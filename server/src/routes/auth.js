import { Router } from "express";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import User from "../models/User.js";
import { requireAuth, signToken, isAdminEmail } from "../middleware/auth.js";
import { sendMail, mailEnabled } from "../lib/mail.js";
import { config } from "../config.js";

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { error: "too_many_attempts" } });

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, grade: u.grade, lang: u.lang, ...(isAdminEmail(u.email) ? { isAdmin: true } : {}) });
const validEmail = (e) => /^\S+@\S+\.\S+$/.test(e);
const cleanName = (s) => String(s || "").replace(/\s+/g, " ").trim().slice(0, 60);

router.post("/register", limiter, async (req, res) => {
  const name = cleanName(req.body?.name);
  const email = String(req.body?.email || "").toLowerCase().trim();
  const password = String(req.body?.password || "");
  const grade = Number(req.body?.grade) || null;
  const lang = req.body?.lang === "ru" ? "ru" : "uz";

  if (!name || !email || !password) return res.status(400).json({ error: "fill_all" });
  if (!validEmail(email)) return res.status(400).json({ error: "bad_email" });
  if (password.length < 6) return res.status(400).json({ error: "short_password" });

  try {
    const user = await User.create({
      name, email, lang,
      grade: grade >= 1 && grade <= 11 ? grade : null,
      passwordHash: await bcrypt.hash(password, 12),
    });
    res.status(201).json({ token: signToken(user.id), user: publicUser(user) });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: "email_taken" });
    throw e;
  }
});

router.post("/login", limiter, async (req, res) => {
  const email = String(req.body?.email || "").toLowerCase().trim();
  const user = email && (await User.findOne({ email }));
  const ok = user && (await bcrypt.compare(String(req.body?.password || ""), user.passwordHash));
  if (!ok) return res.status(401).json({ error: "bad_credentials" });
  res.json({ token: signToken(user.id), user: publicUser(user) });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: "session_expired" });
  res.json({ user: publicUser(user) });
});

router.patch("/profile", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: "session_expired" });
  if (req.body?.name !== undefined) {
    const name = cleanName(req.body.name);
    if (!name) return res.status(400).json({ error: "fill_all" });
    user.name = name;
  }
  if (req.body?.grade !== undefined) {
    const g = Number(req.body.grade);
    user.grade = g >= 1 && g <= 11 ? g : null;
  }
  if (req.body?.lang !== undefined) user.lang = req.body.lang === "ru" ? "ru" : "uz";
  await user.save();
  res.json({ user: publicUser(user) });
});

router.post("/password", requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (String(newPassword || "").length < 6) return res.status(400).json({ error: "short_password" });
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: "session_expired" });
  if (!(await bcrypt.compare(String(oldPassword || ""), user.passwordHash))) {
    return res.status(401).json({ error: "bad_old_password" });
  }
  user.passwordHash = await bcrypt.hash(String(newPassword), 12);
  await user.save();
  res.json({ ok: true });
});

// Email mavjudligini oshkor qilmaymiz: javob har doim bir xil
router.post("/forgot-password", limiter, async (req, res) => {
  const email = String(req.body?.email || "").toLowerCase().trim();
  const user = email && (await User.findOne({ email }));
  if (user && mailEnabled()) {
    const token = crypto.randomBytes(32).toString("hex");
    user.resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const origin = req.get("origin");
    const base = (origin && config.clientOrigins.includes(origin) ? origin : config.clientOrigins[0]) || "";
    const link = `${base}/reset-password?token=${token}`;
    const ru = user.lang === "ru";
    sendMail({
      to: user.email,
      subject: ru ? "Studylora — восстановление пароля" : "Studylora — parolni tiklash",
      text: link,
      html: ru
        ? `<p>Здравствуйте, ${user.name}!</p><p>Чтобы задать новый пароль, перейдите по <a href="${link}">ссылке</a>. Она действует 1 час.</p>`
        : `<p>Salom, ${user.name}!</p><p>Yangi parol o'rnatish uchun <a href="${link}">shu havolani</a> bosing. Havola 1 soat amal qiladi.</p>`,
    }).catch((e) => console.warn("[mail] yuborilmadi:", e.message));
  }
  res.json({ ok: true });
});

router.post("/reset-password", limiter, async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (String(newPassword || "").length < 6) return res.status(400).json({ error: "short_password" });
  const hash = crypto.createHash("sha256").update(String(token || "")).digest("hex");
  const user = await User.findOne({ resetTokenHash: hash, resetTokenExpires: { $gt: new Date() } });
  if (!user) return res.status(400).json({ error: "bad_reset_link" });
  user.passwordHash = await bcrypt.hash(String(newPassword), 12);
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  await user.save();
  res.json({ ok: true });
});

export default router;
