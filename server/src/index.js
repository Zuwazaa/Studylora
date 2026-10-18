import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import { config, assertConfig } from "./config.js";
import authRoutes from "./routes/auth.js";
import meRoutes from "./routes/me.js";
import chatRoutes from "./routes/chats.js";
import courseRoutes from "./routes/courses.js";
import bookRoutes from "./routes/books.js";
import quizRoutes from "./routes/quiz.js";
import flashcardRoutes from "./routes/flashcards.js";
import pedagogyRoutes from "./routes/pedagogy.js";
import labRoutes from "./routes/lab.js";
import adminRoutes from "./routes/admin.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1); // Render/Vercel proksisi orqasida — rate-limit to'g'ri IP ko'radi
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  // Vercel preview manzillari (studylora-*.vercel.app) ham ruxsat etiladi
  const preview = /^https:\/\/studylora[a-z0-9-]*\.vercel\.app$/;
  app.use(
    cors({
      origin: (origin, cb) =>
        cb(null, !origin || config.clientOrigins.includes("*") || config.clientOrigins.includes(origin) || preview.test(origin)),
      exposedHeaders: ["Content-Range", "Accept-Ranges", "Content-Length"],
    })
  );
  app.use(express.json({ limit: "40mb" }));

  app.get("/api/health", (req, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1 }));
  app.use("/api/auth", authRoutes);
  app.use("/api/me", meRoutes);
  app.use("/api/chats", chatRoutes);
  app.use("/api/courses", courseRoutes);
  app.use("/api/books", bookRoutes);
  app.use("/api/quiz", quizRoutes);
  app.use("/api/flashcards", flashcardRoutes);
  app.use("/api/pedagogy", pedagogyRoutes);
  app.use("/api/lab", labRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api", (req, res) => res.status(404).json({ error: "not_found" }));

  // Express 5: async xatolar shu yerga keladi
  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 && !err.status ? "server_error" : err.message });
  });
  return app;
}

async function start() {
  assertConfig();
  // Port darhol ochiladi (Render uyg'onishi tezroq), Mongo parallel ulanadi; so'rovlar ulanishgacha navbatda turadi
  createApp().listen(config.port, () => console.log(`[api] http://localhost:${config.port}`));
  await mongoose.connect(config.mongoUri);
  console.log("[db] MongoDB ulandi");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start().catch((e) => {
    console.error("Server ishga tushmadi:", e.message);
    process.exit(1);
  });
}
