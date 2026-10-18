/*
  Darsliklar: R2'dagi manifest (index.json) va PDF matnini serverda ajratib olish.
  Matn bir marta ajratiladi va BookText'da keshlanadi — keyingi testlar darhol tuziladi.
*/
import { createRequire } from "node:module";
import path from "node:path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import BookText from "../models/BookText.js";
import { config, HttpError } from "../config.js";
import { uploadFile } from "./gemini.js";
import { r2Enabled, getObjectBuffer, putObject, listKeys, pipeObject } from "./r2.js";

const MAX_PAGE_CHARS = 4000;
const PDFJS_DIR = path.dirname(createRequire(import.meta.url).resolve("pdfjs-dist/package.json"));
const STANDARD_FONTS = path.join(PDFJS_DIR, "standard_fonts") + path.sep;
const MANIFEST_TTL = 10 * 60 * 1000;
const PREFIX = "books/";

let manifest = { at: 0, books: {} };

/* Manifest: { "10-algebra": { file: "algebra-10.pdf", legacy?: "https://..." } }
   Manba: yangi bucketdagi books/*.pdf + books/index.json, keyin eski ochiq bucket (agar sozlangan bo'lsa). */
async function loadManifest() {
  const books = {};

  if (config.booksLegacyUrl) {
    try {
      const r = await fetch(`${config.booksLegacyUrl}/index.json`, { cache: "no-store" });
      if (r.ok) {
        for (const [key, file] of Object.entries(await r.json())) {
          if (typeof file !== "string") continue;
          const url = /^https?:\/\//i.test(file) ? file : `${config.booksLegacyUrl}/${file}`;
          books[key] = { file: url.split("/").pop(), legacy: url };
        }
      }
    } catch (e) {
      console.warn("[books] eski manifest o'qilmadi:", e.message);
    }
  }

  if (r2Enabled()) {
    try {
      const idx = await getObjectBuffer(`${PREFIX}index.json`);
      if (idx) for (const [key, file] of Object.entries(JSON.parse(idx.toString("utf8")))) books[key] = { ...books[key], file, own: true };
      for (const k of await listKeys(PREFIX)) {
        // "algebra-10.pdf" -> "10-algebra"
        const m = /^books\/([a-z0-9-]+)-(\d{1,2})\.pdf$/.exec(k);
        if (m) books[`${m[2]}-${m[1]}`] = { ...books[`${m[2]}-${m[1]}`], file: `${m[1]}-${m[2]}.pdf`, own: true };
      }
    } catch (e) {
      console.warn("[books] R2 ro'yxati o'qilmadi:", e.message);
    }
  }
  return books;
}

export async function getManifest() {
  if (Date.now() - manifest.at < MANIFEST_TTL) return manifest.books;
  const books = await loadManifest();
  manifest = { at: Date.now(), books };
  return books;
}

/** Keshni tozalaydi (admin yangi kitob yuklaganda) */
export const resetManifest = () => { manifest = { at: 0, books: {} }; };

/** Darslik PDF'i (Buffer). Yangi bucketda bo'lmasa — eski manbadan olib, bucketga nusxalaydi. */
export async function readBook(bookKey) {
  const item = (await getManifest())[bookKey];
  if (!item) throw new HttpError(404, "book_not_found");
  if (r2Enabled()) {
    const own = await getObjectBuffer(PREFIX + item.file);
    if (own) return own;
  }
  if (!item.legacy) throw new HttpError(404, "book_not_found");
  const r = await fetch(item.legacy);
  if (!r.ok) throw new HttpError(502, `PDF yuklanmadi (HTTP ${r.status})`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (r2Enabled()) {
    putObject(PREFIX + item.file, buf).then(() => { item.own = true; }).catch((e) => console.warn("[books] nusxalanmadi:", e.message));
  }
  return buf;
}

/** HTTP javobga darslik PDF'ini beradi (Range bilan) */
const copying = new Set();
function copyInBackground(bookKey) {
  if (!r2Enabled() || copying.has(bookKey)) return;
  copying.add(bookKey);
  readBook(bookKey).catch(() => {}).finally(() => copying.delete(bookKey));
}

export async function sendBook(bookKey, req, res) {
  const item = (await getManifest())[bookKey];
  if (!item) throw new HttpError(404, "book_not_found");
  if (r2Enabled() && (await pipeObject(PREFIX + item.file, req, res))) return;
  if (!item.legacy) throw new HttpError(404, "book_not_found");

  // Hali ko'chirilmagan: eski bucketdan Range bilan oqim qilib beramiz (butun faylni kutmasdan),
  // nusxalash esa fonda bir marta bajariladi.
  copyInBackground(bookKey);
  const range = /^bytes=\d*-\d*$/.test(req.headers.range || "") ? req.headers.range : undefined;
  const r = await fetch(item.legacy, range ? { headers: { Range: range } } : undefined);
  if (!r.ok || !r.body) throw new HttpError(502, `PDF yuklanmadi (HTTP ${r.status})`);
  res.status(r.status === 206 ? 206 : 200);
  res.set({ "Content-Type": "application/pdf", "Accept-Ranges": "bytes", "Cache-Control": "public, max-age=604800" });
  for (const h of ["content-length", "content-range"]) if (r.headers.get(h)) res.set(h, r.headers.get(h));
  const { Readable } = await import("node:stream");
  await new Promise((resolve, reject) => {
    const body = Readable.fromWeb(r.body);
    body.on("error", reject);
    res.on("close", resolve);
    body.pipe(res);
  });
}

/* ---------- PDF matnini ajratish ---------- */

async function pageText(doc, i) {
  const page = await doc.getPage(i);
  const tc = await page.getTextContent();
  let out = "";
  for (const it of tc.items) {
    out += it.str;
    out += it.hasEOL ? "\n" : " ";
  }
  page.cleanup();
  return out.replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
}

async function readOutline(doc) {
  const out = [];
  try {
    const walk = async (items, depth) => {
      for (const it of items || []) {
        const title = String(it.title || "").replace(/\s+/g, " ").trim();
        let page = null;
        try {
          const dest = typeof it.dest === "string" ? await doc.getDestination(it.dest) : it.dest;
          if (Array.isArray(dest) && dest[0]) page = (await doc.getPageIndex(dest[0])) + 1;
        } catch { /* bet aniqlanmadi */ }
        if (title) out.push({ title: title.slice(0, 160), page, depth });
        if (depth < 2) await walk(it.items, depth + 1);
        if (out.length > 300) return;
      }
    };
    await walk(await doc.getOutline(), 0);
  } catch { /* mundarija yo'q */ }
  return out;
}

const norm = (s) => s.toLowerCase().replace(/[ʻʼ‘’`']/g, "").replace(/\s+/g, " ").trim();

/* Outline bo'lmasa: "Mundarija" / "Оглавление" betidan bo'limlarni o'qiymiz.
   Bosma bet raqami PDF indeksidan farq qiladi, shuning uchun siljishni (offset) topamiz. */
function tocFromText(pages, numPages) {
  const tocPages = pages.filter((p) => /mundarija|оглавление|содержание|мундарижа/i.test(p.text.slice(0, 400)));
  const items = [];
  for (const p of tocPages.slice(0, 4)) {
    for (const line of p.text.split("\n")) {
      const m = /^(.{3,140}?)[\s.…·_-]{2,}(\d{1,3})\s*$/.exec(line.trim());
      if (m && !/^\d+$/.test(m[1].trim())) items.push({ title: m[1].replace(/[.…·_\s-]+$/, "").trim(), printed: Number(m[2]) });
    }
  }
  if (items.length < 3) return [];

  const offsets = [];
  for (const it of items.slice(0, 12)) {
    const needle = norm(it.title).slice(0, 18);
    if (needle.length < 6) continue;
    const hit = pages.find((p) => p.page >= it.printed - 5 && p.page <= it.printed + 30 && !tocPages.includes(p) && norm(p.text).includes(needle));
    if (hit) offsets.push(hit.page - it.printed);
  }
  offsets.sort((a, b) => a - b);
  const offset = offsets.length ? offsets[Math.floor(offsets.length / 2)] : 0;

  return items
    .map((it) => ({ title: it.title.slice(0, 160), page: Math.min(numPages, Math.max(1, it.printed + offset)), depth: 0 }))
    .slice(0, 300);
}

export async function extractPdf(buffer) {
  const task = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableFontFace: true,
    isEvalSupported: false,
    standardFontDataUrl: STANDARD_FONTS,
    verbosity: 0,
  });
  const doc = await task.promise;
  const numPages = doc.numPages;
  const pages = [];
  for (let i = 1; i <= numPages; i++) {
    try {
      const text = await pageText(doc, i);
      if (text.length >= 40) pages.push({ page: i, text: text.slice(0, MAX_PAGE_CHARS) });
    } catch { /* bet o'qilmadi */ }
  }
  let toc = (await readOutline(doc)).filter((t) => t.page);
  if (toc.length < 3) toc = tocFromText(pages, numPages);
  await task.destroy().catch(() => {});
  return { numPages, pages, toc, scanned: pages.length < numPages * 0.2 };
}

/* ---------- Kesh ---------- */

const running = new Map();

async function build(key, load) {
  await BookText.updateOne({ key }, { $set: { status: "processing", error: "" } }, { upsert: true });
  try {
    const buffer = await load();
    if (!buffer) throw new Error("PDF topilmadi");
    const { numPages, pages, toc, scanned } = await extractPdf(buffer);

    let geminiFile;
    if (scanned) {
      // Skanerlangan kitob: Gemini PDF'ni rasm sifatida o'zi o'qiydi
      geminiFile = await uploadFile(buffer, "application/pdf", key).catch((e) => {
        console.warn("[books] Gemini'ga yuklanmadi:", e.message);
        return undefined;
      });
    }
    await BookText.updateOne({ key }, { $set: { numPages, pages, toc, scanned, geminiFile, status: "ready" } });
  } catch (e) {
    await BookText.updateOne({ key }, { $set: { status: "failed", error: e.message } });
    throw new HttpError(502, `Kitobni o'qib bo'lmadi: ${e.message}`);
  }
}

/** Kitob matnini qaytaradi (kerak bo'lsa birinchi marta ajratadi). load() -> Buffer */
export async function ensureText(key, load) {
  let doc = await BookText.findOne({ key });
  const fresh = doc?.status === "ready";
  const fileExpired = doc?.scanned && (!doc.geminiFile?.uri || doc.geminiFile.expiresAt < Date.now());
  if (fresh && !fileExpired) return doc;
  if (!load) throw new HttpError(404, "book_not_found");

  if (!running.has(key)) {
    running.set(key, build(key, load).finally(() => running.delete(key)));
  }
  await running.get(key);
  return BookText.findOne({ key });
}

/** Darslik kaliti ("10-algebra") bo'yicha */
export async function ensureBook(bookKey) {
  if (!(await getManifest())[bookKey]) throw new HttpError(404, "book_not_found");
  return ensureText(`book:${bookKey}`, () => readBook(bookKey));
}
