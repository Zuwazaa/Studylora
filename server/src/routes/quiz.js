import { Router } from "express";
import crypto from "node:crypto";
import mongoose from "mongoose";
import Course from "../models/Course.js";
import UserData from "../models/UserData.js";
import { getObjectBuffer } from "../lib/r2.js";
import { requireAuth, userLimit } from "../middleware/auth.js";
import { collectSource, buildQuiz, BLOOM_LEVELS } from "../lib/quizgen.js";
import { updateData, touch, publicData, MAX_MISTAKES, MAX_HISTORY } from "../lib/userdata.js";
import { initCard } from "../pedagogy/sm2.js";
import { config } from "../config.js";

const router = Router();
router.use(requireAuth);

const TOKEN_TTL = 3 * 3600 * 1000;

/* To'g'ri javoblar brauzerga berilmaydi: ular HMAC bilan imzolangan token ichida turadi. */
const sign = (obj) => {
  const p = Buffer.from(JSON.stringify(obj)).toString("base64url");
  const s = crypto.createHmac("sha256", config.jwtSecret).update(p).digest("base64url");
  return `${p}.${s}`;
};
const verify = (token, userId) => {
  const [p, s] = String(token || "").split(".");
  if (!p || !s) return null;
  const expect = crypto.createHmac("sha256", config.jwtSecret).update(p).digest("base64url");
  if (s.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expect))) return null;
  try {
    const obj = JSON.parse(Buffer.from(p, "base64url").toString("utf8"));
    return obj.exp > Date.now() && obj.uid === String(userId) && Array.isArray(obj.qs) ? obj : null;
  } catch {
    return null;
  }
};

const genLimit = userLimit(60 * 1000, 5, "too_fast");
const dayLimit = userLimit(24 * 3600 * 1000, config.limits.quizPerDay, "daily_limit");
const checkLimit = userLimit(60 * 1000, 90, "too_fast");

const str = (v, n) => String(v ?? "").trim().slice(0, n);

/* body: {
     grade, subject, bookKey?, courseId?, tocIndex?, from?, to?, topic?,
     difficulty: easy|medium|hard, count, mode: test|practice, lang, fromMistakes?
   } */
router.post("/generate", genLimit, dayLimit, async (req, res) => {
  const b = req.body || {};
  const subject = str(b.subject, 80);
  if (!subject && !b.courseId) return res.status(400).json({ error: "no_subject" });

  const difficulty = ["easy", "medium", "hard"].includes(b.difficulty) ? b.difficulty : "medium";
  const count = Math.min(20, Math.max(3, Number(b.count) || 10));
  const lang = b.lang === "ru" ? "ru" : "uz";
  const mode = b.mode === "practice" ? "practice" : "test";

  let courseKey = null;
  let courseLoad = null;
  let courseTitle = "";
  if (b.courseId) {
    const c = mongoose.isValidObjectId(b.courseId) && (await Course.findOne({ _id: b.courseId, userId: req.userId }));
    if (!c) return res.status(404).json({ error: "not_found" });
    courseKey = `course:${c._id}`;
    courseLoad = () => getObjectBuffer(c.fileKey);
    courseTitle = c.title;
  }

  // "Xatolarim bo'yicha test": o'xshash yangi savollar
  let mistakes = null;
  if (b.fromMistakes) {
    const d = await UserData.findOne({ userId: req.userId });
    mistakes = (d?.mistakes || []).filter((m) => !subject || m.subject === subject).slice(-10);
    if (!mistakes.length) return res.status(400).json({ error: "no_mistakes" });
  }

  const source = mistakes
    ? null
    : await collectSource({
        bookKey: b.bookKey ? str(b.bookKey, 60) : null,
        courseKey, courseLoad,
        tocIndex: Number.isInteger(b.tocIndex) ? b.tocIndex : undefined,
        from: Number(b.from) || undefined,
        to: Number(b.to) || undefined,
        topic: str(b.topic, 160),
      });

  const quiz = await buildQuiz({
    subject: subject || courseTitle,
    grade: str(b.grade, 4),
    topic: str(b.topic, 160),
    difficulty, count, lang, source, mistakes,
  });

  const meta = { subject: subject || courseTitle, grade: str(b.grade, 4), topic: quiz.topic, difficulty, mode, bookKey: b.bookKey || null };
  const token = sign({ uid: String(req.userId), exp: Date.now() + TOKEN_TTL, meta, qs: quiz.questions });

  res.json({
    token,
    meta,
    sources: quiz.sources,
    timeLimit: mode === "test" ? quiz.questions.length * ({ easy: 45, medium: 60, hard: 90 }[difficulty]) : 0,
    questions: quiz.questions.map(({ q, options, bloom, source, page, hints }) => ({ q, options, bloom, source, page, hintCount: hints.length })),
  });
});

// Bosqichli ishora (scaffolding): body { token, index, level: 0..2 }
router.post("/hint", checkLimit, (req, res) => {
  const p = verify(req.body?.token, req.userId);
  if (!p) return res.status(400).json({ error: "quiz_expired" });
  const q = p.qs[Number(req.body?.index)];
  if (!q) return res.status(400).json({ error: "not_found" });
  const level = Math.max(0, Math.min(q.hints.length - 1, Number(req.body?.level) || 0));
  res.json({ level, hint: q.hints[level] || "" });
});

// Bitta savolni tekshirish: body { token, index, selected }
router.post("/check", checkLimit, (req, res) => {
  const p = verify(req.body?.token, req.userId);
  if (!p) return res.status(400).json({ error: "quiz_expired" });
  const q = p.qs[Number(req.body?.index)];
  if (!q) return res.status(400).json({ error: "not_found" });
  const selected = Number(req.body?.selected);
  res.json({
    correct: selected === q.answer,
    answer: q.answer,
    explain: q.explain,
    whyWrong: selected !== q.answer ? q.whyWrong[selected] || "" : "",
  });
});

/* Mastery learning: natijaga qarab keyingi qadam */
function nextStep(pct, difficulty, sureWrong) {
  if (sureWrong >= 2) return "review_confident_mistakes";
  if (pct >= 85) return difficulty === "hard" ? "mastered" : "level_up";
  if (pct >= 60) return "practice_more";
  return "reteach";
}

/* Testni yakunlash: body { token, answers:[idx|null], confidence:["sure"|"unsure"|"guess"], hintsUsed:[n], seconds } */
router.post("/submit", async (req, res) => {
  const p = verify(req.body?.token, req.userId);
  if (!p) return res.status(400).json({ error: "quiz_expired" });

  const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
  const conf = Array.isArray(req.body?.confidence) ? req.body.confidence : [];
  const hints = Array.isArray(req.body?.hintsUsed) ? req.body.hintsUsed : [];
  const seconds = Math.max(0, Math.min(6 * 3600, Number(req.body?.seconds) || 0));
  const { meta, qs } = p;

  let score = 0;
  const bloom = {};
  const calibration = { sureRight: 0, sureWrong: 0, unsureRight: 0, unsureWrong: 0, guessRight: 0, guessWrong: 0 };
  const newMistakes = [];
  const review = qs.map((q, i) => {
    const sel = Number.isInteger(answers[i]) ? answers[i] : null;
    const ok = sel === q.answer;
    if (ok) score++;
    const b = (bloom[q.bloom] ||= { ok: 0, total: 0 });
    b.total++;
    if (ok) b.ok++;
    const c = ["sure", "unsure", "guess"].includes(conf[i]) ? conf[i] : null;
    if (c) calibration[`${c}${ok ? "Right" : "Wrong"}`]++;

    if (!ok) {
      newMistakes.push({
        question: q.q.slice(0, 600),
        options: q.options,
        subject: meta.subject, grade: meta.grade, topic: meta.topic, bloom: q.bloom,
        yourAnswer: sel === null ? "" : q.options[sel],
        correctAnswer: q.options[q.answer],
        explain: q.explain.slice(0, 800),
        misconception: sel === null ? "" : q.whyWrong[sel] || "",
        confident: c === "sure",
        date: Date.now(),
        ...initCard(),
      });
    }
    return {
      q: q.q, options: q.options, answer: q.answer, selected: sel, ok, bloom: q.bloom,
      explain: q.explain, whyWrong: sel === null || ok ? "" : q.whyWrong[sel] || "",
      confidence: c, hintsUsed: Number(hints[i]) || 0, source: q.source, page: q.page,
    };
  });

  const total = qs.length;
  const pct = Math.round((score / total) * 100);

  const d = await updateData(req.userId, (doc) => {
    doc.quizHistory.push({ subject: meta.subject, grade: meta.grade, topic: meta.topic, difficulty: meta.difficulty, score, total, bloom, calibration, seconds, date: Date.now() });
    if (doc.quizHistory.length > MAX_HISTORY) doc.quizHistory = doc.quizHistory.slice(-MAX_HISTORY);

    // Bir xil savol qayta qo'shilmasin
    const existing = new Set(doc.mistakes.map((m) => m.question));
    for (const m of newMistakes) if (!existing.has(m.question)) doc.mistakes.push(m);
    if (doc.mistakes.length > MAX_MISTAKES) doc.mistakes = doc.mistakes.slice(-MAX_MISTAKES);

    // O'zlashtirish: eski natija 60%, yangisi 40% (qiyinlikka qarab vazn)
    const w = { easy: 0.8, medium: 1, hard: 1.15 }[meta.difficulty] || 1;
    const old = doc.mastery[meta.subject];
    const val = Math.min(100, Math.round(pct * w));
    doc.mastery[meta.subject] = old === undefined ? val : Math.round(0.6 * old + 0.4 * val);

    for (const [lvl, v] of Object.entries(bloom)) {
      if (!BLOOM_LEVELS.includes(lvl)) continue;
      const g = (doc.bloom[lvl] ||= { ok: 0, total: 0 });
      g.ok += v.ok;
      g.total += v.total;
    }
    doc.counters.correct = (doc.counters.correct || 0) + score;
    touch(doc, "tests", Math.round(seconds / 60));
  });

  res.json({
    score, total, pct, bloom, calibration, review,
    nextStep: nextStep(pct, meta.difficulty, calibration.sureWrong),
    meta,
    data: publicData(d),
  });
});

export default router;
