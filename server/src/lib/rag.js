// Matn sahifalaridan savolga eng mos qismlarni topish (leksik qidiruv, embedding'siz).

const STOP = new Set([
  "va", "yoki", "bu", "shu", "uchun", "bilan", "ham", "esa", "nima", "qanday", "haqida", "men", "biz", "siz",
  "iltimos", "mavzu", "mavzuni", "tushuntir", "tushuntiring", "bet", "beti", "page", "the", "and", "for",
  "что", "как", "это", "для", "или", "тема", "тему", "объясни", "страница", "про",
]);

export const tokenize = (s) =>
  new Set(
    String(s || "")
      .toLowerCase()
      .replace(/[ʻʼ‘’`]/g, "'")
      .replace(/[^a-z0-9а-яёўқғҳ'\s-]/gi, " ")
      .split(/\s+/)
      .map((w) => w.replace(/^['-]+|['-]+$/g, ""))
      .filter((w) => w.length >= 3 && !STOP.has(w))
  );

function score(text, terms) {
  const low = text.toLowerCase();
  let s = 0;
  for (const term of terms) {
    // o'zbek/rus qo'shimchalari uchun so'z ildizi bo'yicha qidiramiz
    const stem = term.length >= 6 ? term.slice(0, -2) : term.length >= 5 ? term.slice(0, -1) : term;
    let i = low.indexOf(stem);
    let hits = 0;
    while (i !== -1 && hits < 6) { hits++; i = low.indexOf(stem, i + stem.length); }
    s += hits;
  }
  return s;
}

export function extractPageNumbers(query, numPages) {
  const found = new Set();
  const re = /(\d{1,4})\s*[-–]?\s*(?:bet|стр)|(?:bet|page|стр\.?|страница)\s*[-–]?\s*(\d{1,4})/gi;
  let m;
  while ((m = re.exec(String(query || "")))) {
    const n = Number(m[1] || m[2]);
    if (n >= 1 && (!numPages || n <= numPages)) found.add(n);
  }
  return [...found];
}

const join = (pages, maxChars) => {
  let out = "";
  for (const p of [...pages].sort((a, b) => a.page - b.page)) {
    const block = `[${p.page}-bet]\n${p.text.trim()}\n\n`;
    if (out.length + block.length > maxChars) break;
    out += block;
  }
  return out.trim();
};

/** Savol bo'yicha kontekst: aniq bet raqami > so'z mosligi > kitob boshi */
const TOC_RE = /mundarija|мундарижа|оглавление|содержание/i;

export function retrieve(doc, query, { maxChars = 7000, top = 3 } = {}) {
  // Mundarija betlari hamma so'zni o'z ichiga oladi — qidiruvdan chiqaramiz
  const pages = (doc?.pages || []).filter((p) => p.text?.trim() && !TOC_RE.test(p.text.slice(0, 300)));
  if (!pages.length) return "";

  const nums = extractPageNumbers(query, doc.numPages);
  if (nums.length) {
    const wanted = new Set(nums.flatMap((n) => [n, n + 1]));
    const sel = pages.filter((p) => wanted.has(p.page));
    if (sel.length) return join(sel, maxChars);
  }

  const terms = tokenize(query);
  const ranked = terms.size
    ? pages.map((p) => ({ p, s: score(p.text, terms) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s)
    : [];
  if (ranked.length) {
    // eng mos betlar + ularning qo'shnisi (mavzu ko'pincha 2-3 betga yoyilgan)
    const best = ranked.slice(0, top).map((x) => x.p.page);
    const wanted = new Set(best.flatMap((n) => [n, n + 1]));
    return join(pages.filter((p) => wanted.has(p.page)), maxChars);
  }
  return join(pages.slice(0, 2), maxChars);
}

/** Bet oralig'i bo'yicha matn */
export function pageRange(doc, from, to, maxChars = 14000) {
  const pages = (doc?.pages || []).filter((p) => p.page >= from && p.page <= to && p.text?.trim());
  return join(pages, maxChars);
}

/** Mundarijadagi bo'lim -> bet oralig'i (keyingi bo'lim boshigacha) */
export function tocRange(doc, index) {
  const toc = (doc?.toc || []).filter((t) => t.page);
  const item = toc[index];
  if (!item) return null;
  const next = toc.slice(index + 1).find((t) => t.page > item.page);
  const to = next ? Math.max(item.page, next.page - 1) : Math.min(item.page + 6, doc.numPages || item.page + 6);
  return { from: item.page, to: Math.min(to, item.page + 12), title: item.title };
}
