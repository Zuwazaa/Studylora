import { Router } from "express";
import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Attachment from "../models/Attachment.js";
import BookText from "../models/BookText.js";
import { requireAuth, userLimit } from "../middleware/auth.js";
import { generate, imagePart } from "../lib/gemini.js";
import { retrieve } from "../lib/rag.js";
import { ensureBook } from "../lib/books.js";
import { activity } from "../lib/userdata.js";
import { MODES, teacherSystemPrompt } from "../pedagogy/skills.js";
import { config } from "../config.js";

const router = Router();
router.use(requireAuth);

const HISTORY_FOR_AI = 14;
const HISTORY_FOR_UI = 60;
const MAX_STORED = 300;
const MAX_IMAGES = 6;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const perMinute = userLimit(60 * 1000, 10, "too_fast");
const perDay = userLimit(24 * 3600 * 1000, config.limits.chatPerDay, "daily_limit");

const parseDataUrl = (s) => {
  const m = /^data:(image\/[\w.+-]+);base64,(.+)$/s.exec(String(s || ""));
  if (!m) return null;
  const data = Buffer.from(m[2], "base64");
  return data.length && data.length <= MAX_IMAGE_BYTES ? { mime: m[1], data, raw: s } : null;
};
const toDataUrl = (a) => `data:${a.mime};base64,${a.data.toString("base64")}`;
const owned = (userId, id) => (mongoose.isValidObjectId(id) ? Conversation.findOne({ _id: id, userId }) : null);

async function attachmentsFor(userId, messages) {
  const ids = messages.flatMap((m) => m.attachments || []);
  if (!ids.length) return new Map();
  const docs = await Attachment.find({ _id: { $in: ids }, userId });
  return new Map(docs.map((d) => [String(d._id), d]));
}

async function forUi(userId, convo) {
  const msgs = (convo?.messages || []).slice(-HISTORY_FOR_UI);
  const files = await attachmentsFor(userId, msgs);
  return msgs.map((m) => ({
    role: m.role,
    text: m.text,
    mode: m.mode,
    skills: m.skills || [],
    sources: m.sources || [],
    images: (m.attachments || []).map((id) => files.get(String(id))).filter(Boolean).map((a) => ({ page: a.page, img: toDataUrl(a) })),
    at: m.createdAt,
  }));
}

function makeTitle(text, page) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  const cut = (s) => (s.length > 60 ? s.slice(0, 60).trimEnd() + "…" : s);
  if (!t) return page ? `${page}-bet` : "Yangi suhbat";
  return cut(page ? `${page}-bet: ${t}` : t);
}

// GET /api/chats?key=book:10-algebra
router.get("/", async (req, res) => {
  const filter = { userId: req.userId };
  if (req.query.key) filter.key = String(req.query.key).slice(0, 100);
  const list = await Conversation.find(filter).sort({ updatedAt: -1 }).limit(100).select("key title mode updatedAt");
  res.json({ conversations: list.map((c) => ({ id: String(c._id), key: c.key, title: c.title, mode: c.mode, updatedAt: c.updatedAt })) });
});

router.get("/:id", async (req, res) => {
  const convo = await owned(req.userId, req.params.id);
  if (!convo) return res.status(404).json({ error: "not_found" });
  res.json({ id: String(convo._id), key: convo.key, title: convo.title, mode: convo.mode, messages: await forUi(req.userId, convo) });
});

router.patch("/:id", async (req, res) => {
  const title = String(req.body?.title || "").replace(/\s+/g, " ").trim().slice(0, 120);
  if (!title) return res.status(400).json({ error: "fill_all" });
  const convo = await owned(req.userId, req.params.id);
  if (!convo) return res.status(404).json({ error: "not_found" });
  convo.title = title;
  await convo.save();
  res.json({ ok: true, title });
});

router.delete("/:id", async (req, res) => {
  const convo = await owned(req.userId, req.params.id);
  if (!convo) return res.status(404).json({ error: "not_found" });
  const ids = convo.messages.flatMap((m) => m.attachments || []);
  if (ids.length) await Attachment.deleteMany({ _id: { $in: ids }, userId: req.userId });
  await Conversation.deleteOne({ _id: convo._id });
  res.json({ ok: true });
});

/* Xabar yuborish.
   body: { id?, key, text, images:[{image, page}], mode, lang, grade, subject, difficulty, web } */
router.post("/send", perMinute, perDay, async (req, res) => {
  const b = req.body || {};
  const key = String(b.key || "general").slice(0, 100);
  const text = String(b.text || "").trim().slice(0, 6000);
  const mode = MODES[b.mode] ? b.mode : "explain";
  const lang = b.lang === "ru" ? "ru" : "uz";

  const images = (Array.isArray(b.images) ? b.images : [])
    .slice(0, MAX_IMAGES)
    .map((it) => {
      const p = parseDataUrl(it?.image);
      return p && { ...p, page: Number(it.page) || null };
    })
    .filter(Boolean);
  if (!text && !images.length) return res.status(400).json({ error: "empty_message" });

  let convo = null;
  if (b.id) {
    convo = await owned(req.userId, b.id);
    if (!convo) return res.status(404).json({ error: "not_found" });
  }

  // Suhbat tarixi (rasmlari bilan)
  const recent = (convo?.messages || []).slice(-HISTORY_FOR_AI);
  const files = await attachmentsFor(req.userId, recent);
  const contents = [];
  for (const m of recent) {
    const parts = [];
    if (m.text) parts.push({ text: m.text });
    if (m.role === "user") {
      for (const id of m.attachments || []) {
        const a = files.get(String(id));
        if (a) parts.push(imagePart(toDataUrl(a)));
      }
    }
    if (!parts.length) continue;
    const role = m.role === "ai" ? "model" : "user";
    const prev = contents[contents.length - 1];
    if (prev?.role === role) prev.parts.push(...parts);
    else contents.push({ role, parts });
  }
  while (contents[0]?.role === "model") contents.shift();

  const nowParts = [{ text: text || (lang === "ru" ? "Объясни этот фрагмент." : "Shu qismni tushuntirib bering.") }];
  for (const im of images) {
    if (im.page) nowParts.push({ text: `(${im.page}-bet)` });
    nowParts.push(imagePart(im.raw));
  }
  if (contents[contents.length - 1]?.role === "user") contents[contents.length - 1].parts.push(...nowParts);
  else contents.push({ role: "user", parts: nowParts });

  // Darslik yoki yuklangan kitob bo'yicha suhbat: tegishli betlar (RAG)
  let bookContext = "";
  try {
    if (key.startsWith("book:") || key.startsWith("course:")) {
      const doc = await BookText.findOne({ key, status: "ready" });
      // Matn hali ajratilmagan bo'lsa — fonda boshlaymiz, bu javob kontekstsiz ketadi
      if (!doc && key.startsWith("book:")) ensureBook(key.slice(5)).catch(() => {});
      if (doc && !doc.scanned) bookContext = retrieve(doc, `${text} ${images.map((i) => (i.page ? `${i.page}-bet` : "")).join(" ")}`);
    }
  } catch (e) {
    console.warn("[chat] kitob konteksti olinmadi:", e.message);
  }

  const system = teacherSystemPrompt({
    mode, lang, bookContext,
    grade: String(b.grade || "").slice(0, 4),
    subject: String(b.subject || "").slice(0, 80),
    difficulty: b.difficulty,
  });
  const result = await generate({ system, contents, search: Boolean(b.web), temperature: 0.7 });

  // Javob muvaffaqiyatli bo'lgandan keyingina saqlaymiz
  const saved = images.length
    ? await Attachment.insertMany(images.map((i) => ({ userId: req.userId, page: i.page, mime: i.mime, data: i.data })))
    : [];
  const skills = MODES[mode].skills;
  const newMessages = [
    { role: "user", text, attachments: saved.map((a) => a._id), mode },
    { role: "ai", text: result.text, mode, skills, sources: result.sources },
  ];

  if (convo) {
    await Conversation.updateOne(
      { _id: convo._id },
      { $push: { messages: { $each: newMessages, $slice: -MAX_STORED } }, $set: { mode } }
    );
  } else {
    convo = await Conversation.create({
      userId: req.userId, key, mode, messages: newMessages,
      title: makeTitle(text, images.find((i) => i.page)?.page),
    });
  }
  activity(req.userId, "chat").catch(() => {});

  res.json({ id: String(convo._id), title: convo.title, content: result.text, skills, sources: result.sources, mode });
});

export default router;
