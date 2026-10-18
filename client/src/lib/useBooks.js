import { useEffect, useState } from "react";
import { Books } from "../api/client";

// Darsliklarning ochiq CDN manzili: ro'yxat va PDF'lar to'g'ridan-to'g'ri Cloudflare'dan olinadi,
// shuning uchun server uxlab qolgan bo'lsa ham kitoblar darhol chiqadi.
export const BOOKS_CDN = "https://pub-29c11e82661d4766a8c49675efbaaaec.r2.dev/";

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
      return (cache = merged);
    });
    pending.then(setBooks);
  }, []);
  return books;
}
