import { useEffect, useState } from "react";
import { Books } from "../api/client";

// Darsliklarning ochiq Cloudflare manzili. Prodda u Vercel orqali o'z domenimizdan beriladi (/cdn/books/),
// shunda Range so'rovlar CORS cheklovisiz ishlaydi va PDF bo'lib-bo'lib (avval kerakli bet) yuklanadi.
const R2_PUBLIC = "https://pub-29c11e82661d4766a8c49675efbaaaec.r2.dev/";
export const BOOKS_CDN = import.meta.env.PROD ? "/cdn/books/" : R2_PUBLIC;
const viaCdn = (url) => (url.startsWith(R2_PUBLIC) ? BOOKS_CDN + url.slice(R2_PUBLIC.length) : url);

let cache = null;
let pending = null;

async function fromCdn() {
  const r = await fetch(BOOKS_CDN + "index.json", { cache: "no-cache" });
  if (!r.ok) throw new Error("cdn");
  const idx = await r.json();
  const out = {};
  for (const [k, f] of Object.entries(idx)) if (typeof f === "string") out[k] = /^https?:/i.test(f) ? f : BOOKS_CDN + f;
  return out;
}

// Darsliklar manifesti: { "10-algebra": "https://.../algebra-10.pdf" | "/api/books/file/..." }
export function useBooks() {
  const [books, setBooks] = useState(cache);
  useEffect(() => {
    if (cache) return;
    pending ||= Promise.allSettled([fromCdn(), Books.list()]).then(([cdn, api]) => {
      // Server ro'yxati (yangi bucketdagi kitoblar) + CDN havolalari ustun
      const merged = { ...(api.value?.books || {}), ...(cdn.value || {}) };
      for (const k of Object.keys(merged)) merged[k] = viaCdn(merged[k]);
      return (cache = merged);
    });
    pending.then(setBooks);
  }, []);
  return books;
}
