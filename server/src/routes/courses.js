import express, { Router } from "express";
import mongoose from "mongoose";
import Course from "../models/Course.js";
import Conversation from "../models/Conversation.js";
import Attachment from "../models/Attachment.js";
import BookText from "../models/BookText.js";
import { requireAuth, userLimit } from "../middleware/auth.js";
import { putObject, getObjectBuffer, pipeObject, deleteObject, r2Enabled } from "../lib/r2.js";
import { HttpError } from "../config.js";
import { ensureText } from "../lib/books.js";
import { generate } from "../lib/gemini.js";
import { langRule } from "../pedagogy/skills.js";

const router = Router();
router.use(requireAuth);
const uploadLimit = userLimit(60 * 1000, 6, "too_fast");

const pub = (c) => ({
  id: String(c._id), title: c.title, fileName: c.fileName, fileUrl: `/api/courses/${c._id}/file`,
  numPages: c.numPages, chatKey: `course:${c._id}`, intro: c.intro, status: c.status, updatedAt: c.updatedAt,
});
const owned = (userId, id) => (mongoose.isValidObjectId(id) ? Course.findOne({ _id: id, userId }) : null);

router.get("/", async (req, res) => {
  const filter = { userId: req.userId };
  if (req.query.status !== "all") filter.status = "active";
  const list = await Course.find(filter).sort({ updatedAt: -1 });
  res.json({ courses: list.map(pub) });
});

// 1-qadam: PDF'ni server orqali bucketga yuklash. body: application/pdf, ?title=
router.post("/", uploadLimit, express.raw({ type: "application/pdf", limit: "80mb" }), async (req, res) => {
  if (!r2Enabled()) throw new HttpError(500, "R2 sozlanmagan");
  const title = String(req.query.title || "").replace(/\s+/g, " ").trim().slice(0, 160);
  if (!title) return res.status(400).json({ error: "fill_all" });
  if (!Buffer.isBuffer(req.body) || req.body.subarray(0, 5).toString() !== "%PDF-") return res.status(400).json({ error: "only_pdf" });

  const course = new Course({ userId: req.userId, title, fileName: String(req.query.fileName || title).slice(0, 200) });
  course.fileKey = `user-uploads/${req.userId}/${course._id}.pdf`;
  await putObject(course.fileKey, req.body);
  await course.save();
  res.json({ course: pub(course) });
});

router.get("/:id/file", async (req, res) => {
  const course = await owned(req.userId, req.params.id);
  if (!course || !(await pipeObject(course.fileKey, req, res))) res.status(404).json({ error: "not_found" });
});

// 2-qadam: fayl yuklangach — matnni ajratish va AI salomlashuvi
router.post("/:id/process", async (req, res) => {
  const course = await owned(req.userId, req.params.id);
  if (!course) return res.status(404).json({ error: "not_found" });
  const lang = req.body?.lang === "ru" ? "ru" : "uz";

  const doc = await ensureText(`course:${course._id}`, () => getObjectBuffer(course.fileKey));
  course.numPages = doc.numPages;

  const topics = (doc.toc || []).slice(0, 40).map((t) => `- ${t.title}${t.page ? ` (${t.page})` : ""}`).join("\n");
  const sample = topics ? "" : (doc.pages || []).slice(0, 3).map((p) => p.text).join("\n").slice(0, 3000);
  try {
    const { text } = await generate({
      system: `You are Studylora Ustoz, a warm teacher. ${langRule(lang)}`,
      contents: [
        `The student uploaded a book "${course.title}" (${doc.numPages} pages).`,
        topics ? `Table of contents:\n${topics}` : `First pages:\n${sample}`,
        "In 4-6 sentences: say you have looked through it, what it is about, list 3-5 main topics, then ask exactly which topic to start with. Plain friendly text, no headings.",
      ].join("\n\n"),
      temperature: 0.6,
    });
    course.intro = text;
  } catch {
    course.intro = lang === "ru" ? `Я просмотрел книгу «${course.title}». С какой темы начнём?` : `"${course.title}" kitobini ko'rib chiqdim. Qaysi mavzudan boshlaymiz?`;
  }
  await course.save();
  res.json({ course: pub(course) });
});

router.patch("/:id", async (req, res) => {
  const course = await owned(req.userId, req.params.id);
  if (!course) return res.status(404).json({ error: "not_found" });
  course.status = req.body?.status === "closed" ? "closed" : "active";
  await course.save();
  res.json({ course: pub(course) });
});

router.delete("/:id", async (req, res) => {
  const course = await owned(req.userId, req.params.id);
  if (!course) return res.status(404).json({ error: "not_found" });
  const key = `course:${course._id}`;
  const convos = await Conversation.find({ userId: req.userId, key });
  const att = convos.flatMap((c) => c.messages.flatMap((m) => m.attachments || []));
  if (att.length) await Attachment.deleteMany({ _id: { $in: att }, userId: req.userId });
  await Conversation.deleteMany({ userId: req.userId, key });
  await BookText.deleteOne({ key });
  await deleteObject(course.fileKey);
  await Course.deleteOne({ _id: course._id });
  res.json({ ok: true });
});

export default router;
