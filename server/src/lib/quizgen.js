/*
  Test tuzish dvigateli.
  1) Manba matnini yig'adi: darslik/yuklangan kitob (bo'lim, bet oralig'i yoki mavzu bo'yicha).
  2) "Qiyin" darajada internetdan (Google Search) olimpiada/DTM uslubidagi materiallarni qo'shadi.
  3) Pedagog skillari asosida JSON test tuzadi: Blum darajasi, 3 bosqichli ishora,
     har noto'g'ri variant uchun xato tushuncha izohi.
*/
import { generate } from "./gemini.js";
import { ensureBook, ensureText } from "./books.js";
import { retrieve, pageRange, tocRange } from "./rag.js";
import { SKILL_BY_ID, langRule } from "../pedagogy/skills.js";
import { HttpError } from "../config.js";

export const BLOOM_LEVELS = ["remember", "understand", "apply", "analyze", "evaluate", "create"];

const BLOOM_MIX = {
  easy: "about 40% remember, 40% understand, 20% apply",
  medium: "about 25% understand, 45% apply, 30% analyze",
  hard: "about 25% apply, 45% analyze, 30% evaluate/create — multi-step reasoning, olympiad and DTM/BMBA exam style",
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ---------- 1. Manba ---------- */

async function sourceFrom(doc, { tocIndex, from, to, topic }) {
  if (doc.scanned) {
    // Matn yo'q: Gemini PDF faylning o'zini o'qiydi
    const sec = Number.isInteger(tocIndex) ? tocRange(doc, tocIndex) : null;
    const range = sec || (from ? { from, to: to || from + 5 } : null);
    return {
      filePart: doc.geminiFile?.uri ? { file_data: { mime_type: "application/pdf", file_uri: doc.geminiFile.uri } } : null,
      text: "",
      label: sec?.title || topic || (range ? `${range.from}–${range.to}` : ""),
      pagesHint: range ? `Use ONLY PDF pages ${range.from}-${range.to} of the attached textbook.` : topic ? `Use the section of the attached textbook about: ${topic}.` : "Pick one coherent section of the attached textbook.",
    };
  }

  if (Number.isInteger(tocIndex)) {
    const sec = tocRange(doc, tocIndex);
    if (sec) return { text: pageRange(doc, sec.from, sec.to), label: sec.title, pages: [sec.from, sec.to] };
  }
  if (from) {
    const a = Math.max(1, from), b = Math.min(Math.max(a, to || a + 4), a + 15);
    return { text: pageRange(doc, a, b), label: `${a}–${b}`, pages: [a, b] };
  }
  if (topic) return { text: retrieve(doc, topic, { maxChars: 12000, top: 4 }), label: topic };

  // Hech narsa tanlanmagan: tasodifiy bo'lim
  const toc = (doc.toc || []).filter((t) => t.page);
  if (toc.length) {
    const i = Math.floor(Math.random() * toc.length);
    const sec = tocRange(doc, i);
    return { text: pageRange(doc, sec.from, sec.to), label: sec.title, pages: [sec.from, sec.to] };
  }
  const pages = doc.pages || [];
  const start = pages[Math.floor(Math.random() * Math.max(1, pages.length - 5))]?.page || 1;
  return { text: pageRange(doc, start, start + 5), label: `${start}–${start + 5}`, pages: [start, start + 5] };
}

export async function collectSource({ bookKey, courseKey, courseLoad, tocIndex, from, to, topic }) {
  if (bookKey) return sourceFrom(await ensureBook(bookKey), { tocIndex, from, to, topic });
  if (courseKey) return sourceFrom(await ensureText(courseKey, courseLoad), { tocIndex, from, to, topic });
  return { text: "", label: topic || "" };
}

/* ---------- 2. Internet (faqat qiyin daraja) ---------- */

async function webResearch({ subject, grade, topic, lang }) {
  const prompt = [
    `Find challenging, high-quality test problems for a grade ${grade || "9-11"} student on: ${subject}${topic ? ` — ${topic}` : ""}.`,
    "Prefer: Uzbekistan DTM/BMBA entrance exam questions, national and international olympiads (IMO/IPhO/IChO junior rounds), SAT/AP-level problems, well-known problem books.",
    "Return 8-12 concrete problems, each with its correct answer and a one-line solution idea. Keep them strictly on this topic.",
    `Write in ${lang === "ru" ? "Russian" : "Uzbek"}.`,
  ].join("\n");
  try {
    const { text, sources } = await generate({ contents: prompt, search: true, temperature: 0.4 });
    return { text: text.slice(0, 9000), sources };
  } catch (e) {
    console.warn("[quiz] internet qidiruvi ishlamadi:", e.message);
    return { text: "", sources: [] };
  }
}

/* ---------- 3. JSON test ---------- */

const SYSTEM = (lang) =>
  [
    "You are Studylora's expert test author, an experienced teacher in Uzbekistan's school system.",
    langRule(lang),
    "Apply these pedagogy skills:",
    `- ${SKILL_BY_ID.bloom.prompt}`,
    `- ${SKILL_BY_ID.misconception.prompt}`,
    `- ${SKILL_BY_ID.scaffolding.prompt} For each question write exactly 3 hints of increasing help: hint 1 = direction, hint 2 = method/rule, hint 3 = a partial step. Hints must NOT reveal the correct option.`,
    `- ${SKILL_BY_ID.feedback.prompt} The explanation explains WHY the correct answer is right.`,
    `- ${SKILL_BY_ID.context.prompt} Use this only where natural.`,
    "Every question has exactly 4 options and exactly one correct option. Options are similar in length and style. No 'all of the above'. Formulas in LaTeX ($...$).",
  ].join("\n");

// Model ba'zan javob indeksini "1" yoki "B" ko'rinishida qaytaradi
const toIndex = (a) => {
  if (Number.isInteger(a)) return a;
  const str = String(a ?? "").trim();
  if (/^[A-D]$/i.test(str)) return str.toUpperCase().charCodeAt(0) - 65;
  return /^\d$/.test(str) ? Number(str) : NaN;
};

const S = (type, extra = {}) => ({ type, ...extra });
const QUIZ_SCHEMA = S("OBJECT", {
  properties: {
    topic: S("STRING"),
    questions: S("ARRAY", {
      items: S("OBJECT", {
        properties: {
          q: S("STRING"), options: S("ARRAY", { items: S("STRING") }), answer: S("INTEGER"), explain: S("STRING"),
          whyWrong: S("ARRAY", { items: S("STRING") }), hints: S("ARRAY", { items: S("STRING") }),
          bloom: S("STRING"), source: S("STRING"), page: S("INTEGER", { nullable: true }),
        },
        required: ["q", "options", "answer", "explain", "whyWrong", "hints", "bloom"],
        propertyOrdering: ["q", "options", "answer", "explain", "whyWrong", "hints", "bloom", "source", "page"],
      }),
    }),
  },
  required: ["topic", "questions"],
});

const valid = (q) =>
  q && typeof q.q === "string" && q.q.trim() &&
  Array.isArray(q.options) && q.options.length === 4 && q.options.every((o) => typeof o === "string" && o.trim()) &&
  Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3;

export async function buildQuiz({ subject, grade, topic, difficulty = "medium", count = 10, lang = "uz", source, mistakes }) {
  let web = { text: "", sources: [] };
  if (difficulty === "hard") web = await webResearch({ subject, grade, topic: source?.label || topic, lang });

  const hasBook = Boolean(source?.text || source?.filePart);
  const bookShare = difficulty === "hard" ? Math.ceil(count / 2) : count;

  const lines = [
    `Subject: ${subject}. Grade: ${grade || "unknown"}.`,
    source?.label || topic ? `Topic / section: ${source?.label || topic}.` : "",
    `Difficulty: ${difficulty}. Bloom distribution: ${BLOOM_MIX[difficulty] || BLOOM_MIX.medium}.`,
    `Write exactly ${count} questions.`,
  ];

  if (mistakes?.length) {
    lines.push(
      "The student previously got these questions WRONG. Write NEW questions that target the same concepts and misconceptions (do not copy them):",
      mistakes.map((m, i) => `${i + 1}. ${m.question} — correct: ${m.correctAnswer}; student chose: ${m.yourAnswer}`).join("\n")
    );
  }
  if (hasBook) {
    lines.push(
      difficulty === "hard" && web.text
        ? `At least ${bookShare} questions MUST be based on the textbook material; the rest may use the internet material below to raise difficulty. Set "source" to "book" or "internet" accordingly.`
        : difficulty === "hard"
          ? `At least ${bookShare} questions MUST be based on the textbook material; the rest may be harder olympiad / DTM-style problems on the same topic from your own knowledge (set "source" to "ai" for those, "book" for the rest).`
          : 'All questions MUST be based on the textbook material below, using its definitions, notation and examples. Set "source" to "book".',
      'For book-based questions set "page" to the textbook page number (from [N-bet] markers) where the answer is found, or null.'
    );
    if (source.pagesHint) lines.push(source.pagesHint);
    if (source.text) lines.push("--- TEXTBOOK ---", source.text, "--- END TEXTBOOK ---");
  } else if (!mistakes?.length) {
    lines.push("No textbook text is available: follow the official Uzbekistan school curriculum for this grade and subject.");
  }
  if (web.text) lines.push("--- INTERNET MATERIAL (exam/olympiad problems) ---", web.text, "--- END INTERNET ---");

  lines.push(
    "Return ONLY JSON of this shape:",
    '{"topic":"short topic title","questions":[{"q":"question","options":["","","",""],"answer":0,"explain":"why correct","whyWrong":["for option 0 (empty string if correct)","option 1","option 2","option 3"],"hints":["direction","method","partial step"],"bloom":"apply","source":"book","page":45}]}'
  );

  const parts = [{ text: lines.filter(Boolean).join("\n") }];
  if (source?.filePart) parts.unshift(source.filePart);

  const { data } = await generate({
    system: SYSTEM(lang),
    contents: [{ role: "user", parts }],
    json: true,
    schema: QUIZ_SCHEMA,
    temperature: 0.8,
  });

  const questions = (Array.isArray(data?.questions) ? data.questions : [])
    .map((q) => (q && typeof q === "object" ? { ...q, answer: toIndex(q.answer) } : q))
    .filter(valid)
    .slice(0, count)
    .map((q) => {
      // To'g'ri javob har doim "A" bo'lib qolmasligi uchun variantlarni aralashtiramiz
      const order = shuffle([0, 1, 2, 3]);
      const why = Array.isArray(q.whyWrong) ? q.whyWrong : [];
      return {
        q: q.q.trim(),
        options: order.map((i) => q.options[i].trim()),
        answer: order.indexOf(q.answer),
        explain: String(q.explain || "").slice(0, 1500),
        whyWrong: order.map((i) => (i === q.answer ? "" : String(why[i] || "").slice(0, 400))),
        hints: (Array.isArray(q.hints) ? q.hints : []).map(String).filter(Boolean).slice(0, 3),
        bloom: BLOOM_LEVELS.includes(q.bloom) ? q.bloom : "understand",
        source: q.source === "internet" && web.text ? "internet" : q.source === "ai" || !hasBook ? "ai" : "book",
        page: Number.isInteger(q.page) ? q.page : null,
      };
    });

  if (!questions.length) throw new HttpError(502, "quiz_failed");
  return { topic: String(data.topic || source?.label || topic || "").slice(0, 140), questions, sources: web.sources };
}
