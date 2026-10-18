import express, { Router } from "express";
import fs from "node:fs";
import User from "../models/User.js";
import UserData from "../models/UserData.js";
import Conversation from "../models/Conversation.js";
import Course from "../models/Course.js";
import Deck from "../models/Deck.js";
import BookText from "../models/BookText.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { getManifest, resetManifest } from "../lib/books.js";
import { putObject, r2Enabled } from "../lib/r2.js";
import { streakOf } from "../lib/userdata.js";
import { today } from "../lib/time.js";
import { HttpError } from "../config.js";

const router = Router();
router.use(requireAuth, requireAdmin);

// Dastur bo'yicha barcha darsliklar: { "10": [["algebra", "Algebra"], ...] }
const SUBJECTS = JSON.parse(fs.readFileSync(new URL("../../scripts/subjects.json", import.meta.url), "utf8"));
const CATALOG = Object.entries(SUBJECTS).flatMap(([grade, list]) =>
  list.map(([id, name]) => ({ key: `${grade}-${id}`, grade: Number(grade), subject: id, name }))
);

const DAY = 86400000;
const dayKey = (ms) => new Date(ms).toISOString().slice(0, 10);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

router.get("/stats", async (req, res) => {
  const now = Date.now();
  const week = new Date(now - 7 * DAY);
  const last7 = Array.from({ length: 7 }, (_, i) => dayKey(Date.parse(`${today()}T00:00:00Z`) - i * DAY));

  const [users, newWeek, activeToday, activeWeek, chats, courses, decks, totals, signups] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: week } }),
    UserData.countDocuments({ streakDates: today() }),
    UserData.countDocuments({ streakDates: { $in: last7 } }),
    Conversation.countDocuments(),
    Course.countDocuments(),
    Deck.countDocuments(),
    UserData.aggregate([
      { $group: {
        _id: null,
        tests: { $sum: { $ifNull: ["$counters.tests", 0] } },
        chat: { $sum: { $ifNull: ["$counters.chat", 0] } },
        minutes: { $sum: { $ifNull: ["$counters.minutes", 0] } },
        mistakes: { $sum: { $size: { $ifNull: ["$mistakes", []] } } },
      } },
    ]),
    User.aggregate([
      { $match: { createdAt: { $gte: new Date(now - 14 * DAY) } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, n: { $sum: 1 } } },
    ]),
  ]);

  const byDay = Object.fromEntries(signups.map((s) => [s._id, s.n]));
  const t = totals[0] || {};
  res.json({
    users, newWeek, activeToday, activeWeek, chats, courses, decks,
    tests: t.tests || 0, chatMessages: t.chat || 0, minutes: t.minutes || 0, mistakes: t.mistakes || 0,
    signups: Array.from({ length: 14 }, (_, i) => {
      const d = dayKey(now - (13 - i) * DAY);
      return { d, n: byDay[d] || 0 };
    }),
  });
});

// Foydalanuvchilar: ?q=ism yoki email, ?page=1
router.get("/users", async (req, res) => {
  const q = String(req.query.q || "").trim().slice(0, 80);
  const page = Math.max(1, Math.floor(Number(req.query.page) || 1));
  const size = 25;
  const filter = q ? { $or: [{ name: new RegExp(escapeRe(q), "i") }, { email: new RegExp(escapeRe(q), "i") }] } : {};

  const [total, list] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * size).limit(size).select("name email grade lang createdAt"),
  ]);
  const data = await UserData.find({ userId: { $in: list.map((u) => u._id) } }).select("userId streakDates counters mistakes");
  const byUser = new Map(data.map((d) => [String(d.userId), d]));

  res.json({
    total, page, pages: Math.max(1, Math.ceil(total / size)),
    users: list.map((u) => {
      const d = byUser.get(String(u._id));
      const c = d?.counters || {};
      return {
        id: String(u._id), name: u.name, email: u.email, grade: u.grade, lang: u.lang, createdAt: u.createdAt,
        lastActive: d?.streakDates?.at(-1) || null,
        streak: streakOf(d?.streakDates || []),
        tests: c.tests || 0, chat: c.chat || 0, minutes: c.minutes || 0, mistakes: d?.mistakes?.length || 0,
      };
    }),
  });
});

// Darsliklar holati: qaysilari bor (yangi bucketda yoki faqat eski CDN'da), qaysilari yetishmaydi
router.get("/books", async (req, res) => {
  if (req.query.refresh) resetManifest();
  const [manifest, texts] = await Promise.all([
    getManifest(),
    BookText.find({ key: /^book:/ }).select("key status numPages scanned error"),
  ]);
  const text = new Map(texts.map((t) => [t.key.slice(5), t]));
  res.json({
    r2: r2Enabled(),
    books: CATALOG.map((b) => {
      const m = manifest[b.key];
      const tx = text.get(b.key);
      return {
        ...b,
        source: !m ? null : m.own ? "r2" : "legacy",
        text: tx ? { status: tx.status, numPages: tx.numPages, scanned: tx.scanned, error: tx.error || undefined } : null,
      };
    }),
  });
});

// Darslik PDF'ini yuklash yoki almashtirish. body: application/pdf
router.post("/books/:key", express.raw({ type: "application/pdf", limit: "120mb" }), async (req, res) => {
  const book = CATALOG.find((b) => b.key === req.params.key);
  if (!book) return res.status(404).json({ error: "book_not_found" });
  if (!r2Enabled()) throw new HttpError(500, "R2 sozlanmagan");
  if (!Buffer.isBuffer(req.body) || req.body.subarray(0, 5).toString() !== "%PDF-") return res.status(400).json({ error: "only_pdf" });

  // Nomlash qoidasi books.js bilan bir xil: "10-algebra" -> books/algebra-10.pdf
  await putObject(`books/${book.subject}-${book.grade}.pdf`, req.body);
  await BookText.deleteOne({ key: `book:${book.key}` }); // matn yangi fayldan qayta ajratiladi
  resetManifest();
  res.json({ ok: true, key: book.key, size: req.body.length });
});

export default router;
