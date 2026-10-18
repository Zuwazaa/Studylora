import { Router } from "express";
import mongoose from "mongoose";
import Deck from "../models/Deck.js";
import Course from "../models/Course.js";
import { getObjectBuffer } from "../lib/r2.js";
import { requireAuth, userLimit } from "../middleware/auth.js";
import { collectSource } from "../lib/quizgen.js";
import { generate } from "../lib/gemini.js";
import { review, initCard } from "../pedagogy/sm2.js";
import { SKILL_BY_ID, langRule } from "../pedagogy/skills.js";
import { updateData, touch } from "../lib/userdata.js";
import { HttpError } from "../config.js";

const router = Router();
router.use(requireAuth);
const genLimit = userLimit(60 * 1000, 4, "too_fast");

const now = () => Date.now();
const pubDeck = (d) => ({
  id: String(d._id), title: d.title, subject: d.subject, grade: d.grade, source: d.source,
  total: d.cards.length, due: d.cards.filter((c) => c.due <= now()).length, updatedAt: d.updatedAt,
});
const CARDS_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    cards: { type: "ARRAY", items: { type: "OBJECT", properties: { front: { type: "STRING" }, back: { type: "STRING" } }, required: ["front", "back"] } },
  },
  required: ["title", "cards"],
};

const pubCard = (deck, c) => ({ deckId: String(deck._id), deckTitle: deck.title, id: String(c._id), front: c.front, back: c.back, reps: c.reps, interval: c.interval });
const owned = (userId, id) => (mongoose.isValidObjectId(id) ? Deck.findOne({ _id: id, userId }) : null);

router.get("/", async (req, res) => {
  const decks = await Deck.find({ userId: req.userId }).sort({ updatedAt: -1 });
  res.json({ decks: decks.map(pubDeck), dueTotal: decks.reduce((n, d) => n + d.cards.filter((c) => c.due <= now()).length, 0) });
});

// Bugun takrorlanadigan kartochkalar (barcha to'plamlardan yoki bittasidan)
router.get("/due", async (req, res) => {
  const filter = { userId: req.userId };
  if (req.query.deck && mongoose.isValidObjectId(req.query.deck)) filter._id = req.query.deck;
  const decks = await Deck.find(filter);
  const all = req.query.all === "1";
  const cards = decks.flatMap((d) => d.cards.filter((c) => all || c.due <= now()).map((c) => pubCard(d, c)));
  res.json({ cards: cards.slice(0, 100) });
});

/* body: { grade, subject, bookKey?, courseId?, tocIndex?, from?, to?, topic?, count, lang } */
router.post("/generate", genLimit, async (req, res) => {
  const b = req.body || {};
  const lang = b.lang === "ru" ? "ru" : "uz";
  const count = Math.min(30, Math.max(5, Number(b.count) || 12));
  let courseKey = null, courseLoad = null, subject = String(b.subject || "").slice(0, 80);
  if (b.courseId) {
    const c = mongoose.isValidObjectId(b.courseId) && (await Course.findOne({ _id: b.courseId, userId: req.userId }));
    if (!c) return res.status(404).json({ error: "not_found" });
    courseKey = `course:${c._id}`;
    courseLoad = () => getObjectBuffer(c.fileKey);
    subject ||= c.title;
  }
  const source = await collectSource({
    bookKey: b.bookKey || null, courseKey, courseLoad,
    tocIndex: Number.isInteger(b.tocIndex) ? b.tocIndex : undefined,
    from: Number(b.from) || undefined, to: Number(b.to) || undefined,
    topic: String(b.topic || "").slice(0, 160),
  });

  const parts = [{
    text: [
      `Subject: ${subject}. Grade: ${b.grade || "?"}. ${source.label ? `Topic: ${source.label}.` : ""}`,
      `Create exactly ${count} flashcards for spaced repetition.`,
      `- ${SKILL_BY_ID.retrieval.prompt}`,
      "- Front: one clear question or term that forces recall (not yes/no). Back: a short, precise answer (max 2 sentences or one formula in LaTeX).",
      "- Cover the key definitions, formulas, dates, rules and cause-effect links of the material.",
      source.pagesHint || "",
      source.text ? `--- TEXTBOOK ---\n${source.text}\n--- END ---` : "Follow the Uzbekistan school curriculum for this grade.",
      'Return ONLY JSON: {"title":"short deck title","cards":[{"front":"","back":""}]}',
    ].filter(Boolean).join("\n"),
  }];
  if (source.filePart) parts.unshift(source.filePart);

  const { data } = await generate({ system: `You create study flashcards. ${langRule(lang)}`, contents: [{ role: "user", parts }], json: true, schema: CARDS_SCHEMA, temperature: 0.6 });
  const cards = (Array.isArray(data?.cards) ? data.cards : [])
    .filter((c) => c?.front && c?.back)
    .slice(0, count)
    .map((c) => ({ front: String(c.front).slice(0, 500), back: String(c.back).slice(0, 800), ...initCard() }));
  if (!cards.length) throw new HttpError(502, "quiz_failed");

  const deck = await Deck.create({
    userId: req.userId,
    title: String(data.title || source.label || subject).slice(0, 140),
    subject, grade: String(b.grade || ""),
    source: source.label || "",
    cards,
  });
  res.json({ deck: pubDeck(deck) });
});

// body: { deckId, cardId, quality: 0..5 }
router.post("/review", async (req, res) => {
  const deck = await owned(req.userId, req.body?.deckId);
  const card = deck?.cards.id(req.body?.cardId);
  if (!card) return res.status(404).json({ error: "not_found" });
  Object.assign(card, review(card, Number(req.body?.quality)));
  await deck.save();
  updateData(req.userId, (d) => touch(d, "cards")).catch(() => {});
  res.json({ ok: true, interval: card.interval, due: card.due });
});

router.delete("/:id", async (req, res) => {
  const deck = await owned(req.userId, req.params.id);
  if (!deck) return res.status(404).json({ error: "not_found" });
  await Deck.deleteOne({ _id: deck._id });
  res.json({ ok: true });
});

export default router;
