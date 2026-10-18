// Barcha sozlamalar muhit o'zgaruvchilaridan (.env yoki Render env) olinadi.
const list = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);

export const config = {
  port: Number(process.env.PORT) || 8787,
  mongoUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "",
  clientOrigins: list(process.env.CLIENT_ORIGIN || "http://localhost:5173"),
  timezone: process.env.APP_TZ || "Asia/Tashkent",

  gemini: {
    keys: list(process.env.GEMINI_API_KEY),
    model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
    fallbacks: list(process.env.GEMINI_FALLBACK_MODELS || "gemini-3.8-flash,gemini-3.5-flash-lite"),
  },

  r2: {
    accountId: process.env.R2_ACCOUNT_ID || "",
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    bucket: process.env.R2_BUCKET || "",
  },

  // Eski (AI Teacher) ochiq bucket: darslik yangi bucketda bo'lmasa, shu yerdan olinib
  // yangi bucketga avtomatik ko'chiriladi. Bo'sh qoldirilsa o'chadi.
  booksLegacyUrl: String(process.env.BOOKS_LEGACY_URL ?? "https://pub-29c11e82661d4766a8c49675efbaaaec.r2.dev").replace(/\/$/, ""),

  mail: {
    brevoKey: process.env.BREVO_KEY || "",
    from: process.env.MAIL_USER || "",
  },

  limits: {
    chatPerDay: Number(process.env.DAILY_LIMIT) || 100,
    quizPerDay: Number(process.env.QUIZ_DAILY_LIMIT) || 40,
  },
};

export function assertConfig() {
  const missing = [];
  if (!config.mongoUri) missing.push("MONGODB_URI");
  if (!config.jwtSecret) missing.push("JWT_SECRET");
  if (missing.length) throw new Error(`Muhit o'zgaruvchilari yetishmayapti: ${missing.join(", ")}`);
  if (!config.gemini.keys.length) console.warn("[config] GEMINI_API_KEY yo'q — AI funksiyalari ishlamaydi");
  if (!config.r2.bucket) console.warn("[config] R2 sozlanmagan — darsliklar va PDF yuklash ishlamaydi");
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
