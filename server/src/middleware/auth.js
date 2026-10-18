import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { config } from "../config.js";

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
