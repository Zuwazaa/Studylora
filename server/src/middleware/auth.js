import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { config } from "../config.js";
import User from "../models/User.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "auth_required" });
  try {
    req.userId = jwt.verify(token, config.jwtSecret).sub;
    next();
  } catch {
    res.status(401).json({ error: "session_expired" });
  }
}

export const signToken = (userId) => jwt.sign({ sub: String(userId) }, config.jwtSecret, { expiresIn: "30d" });

// Foydalanuvchi bo'yicha tezlik cheklovi
export const userLimit = (windowMs, max, error = "too_many_requests") =>
  rateLimit({ windowMs, max, keyGenerator: (req) => req.userId, message: { error }, standardHeaders: true, legacyHeaders: false });

export const isAdminEmail = (email) => Boolean(email) && config.adminEmails.includes(String(email).toLowerCase());

// Faqat ADMIN_EMAILS ro'yxatidagilar. Boshqalarga 404 — panel borligi oshkor qilinmaydi.
export async function requireAdmin(req, res, next) {
  const user = await User.findById(req.userId).select("email");
  if (!user || !isAdminEmail(user.email)) return res.status(404).json({ error: "not_found" });
  req.admin = user;
  next();
}
