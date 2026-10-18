import { Router } from "express";
import BookText from "../models/BookText.js";
import { requireAuth } from "../middleware/auth.js";
import { getManifest, ensureBook, sendBook } from "../lib/books.js";

const router = Router();

// Ochiq: mavjud darsliklar { "10-algebra": "/api/books/file/10-algebra" }
router.get("/", async (req, res) => {
  const books = await getManifest();
  res.set("Cache-Control", "public, max-age=300");
  res.json({ books: Object.fromEntries(Object.keys(books).map((k) => [k, `/api/books/file/${k}`])) });
});

// Darslik PDF'i (bucket yopiq — server orqali, Range bilan)
router.get("/file/:key", async (req, res) => {
  await sendBook(String(req.params.key).slice(0, 60), req, res);
});

// Kitob mundarijasi (test uchun bo'lim tanlash). Kerak bo'lsa matnni ajratadi.
router.get("/:key/toc", requireAuth, async (req, res) => {
  const key = String(req.params.key).slice(0, 60);
  const cached = await BookText.findOne({ key: `book:${key}`, status: "ready" }).select("toc numPages scanned");
  const doc = cached || (await ensureBook(key));
  res.json({ toc: doc.toc || [], numPages: doc.numPages, scanned: doc.scanned });
});

export default router;
