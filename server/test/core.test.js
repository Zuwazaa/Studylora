import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

process.env.GEMINI_API_KEY = "test-key";
const { review, initCard } = await import("../src/pedagogy/sm2.js");
const { retrieve, tocRange, extractPageNumbers } = await import("../src/lib/rag.js");
const { extractPdf } = await import("../src/lib/books.js");
const { buildQuiz } = await import("../src/lib/quizgen.js");
const { teacherSystemPrompt, SKILLS, MODES } = await import("../src/pedagogy/skills.js");

test("SM-2: intervallar o'sadi, xato bo'lsa qaytadan boshlanadi", () => {
  let c = initCard();
  c = review(c, 5); assert.equal(c.interval, 1);
  c = review(c, 5); assert.equal(c.interval, 3);
  c = review(c, 4); assert.ok(c.interval >= 7);
  c = review(c, 1); assert.equal(c.interval, 1); assert.equal(c.reps, 0);
  assert.ok(c.ef >= 1.3);
});

test("PDF: matn, mundarija va bet siljishi aniqlanadi", async () => {
  const r = await extractPdf(fs.readFileSync(new URL("./fixtures/book.pdf", import.meta.url)));
  assert.equal(r.numPages, 5);
  assert.equal(r.scanned, false);
  assert.deepEqual(r.toc.map((t) => t.page), [3, 4, 5]); // bosma 1-bet = PDF 3-bet
  assert.match(retrieve(r, "diskriminant nima"), /\[4-bet\]/);
  assert.doesNotMatch(retrieve(r, "diskriminant nima"), /MUNDARIJA/);
  assert.deepEqual(tocRange(r, 0), { from: 3, to: 3, title: "Kvadrat tenglamalar" });
});

test("Bet raqamlari savoldan ajratiladi", () => {
  assert.deepEqual(extractPageNumbers("45-bet va стр 12 ni tushuntir", 100), [45, 12]);
});

test("Har bir ustoz rejimi faqat mavjud skillarga tayanadi", () => {
  const ids = new Set(SKILLS.map((s) => s.id));
  for (const m of Object.values(MODES)) for (const s of m.skills) assert.ok(ids.has(s), s);
  const p = teacherSystemPrompt({ mode: "socratic", lang: "ru", bookContext: "[3-bet] matn" });
  assert.match(p, /SOCRATIC METHOD/);
  assert.match(p, /Russian/);
  assert.match(p, /TEXTBOOK/);
});

test("Test: kitob matni AI'ga beriladi, javob aralashtiriladi, noto'g'ri savollar tashlanadi", async (t) => {
  let sentBody;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    sentBody = JSON.parse(init.body);
    const quiz = {
      topic: "Diskriminant",
      questions: [
        { q: "D = ?", options: ["b^2-4ac", "b^2+4ac", "4ac-b^2", "2b"], answer: 0, explain: "formula", whyWrong: ["", "ishora", "teskari", "noto'g'ri"], hints: ["h1", "h2", "h3"], bloom: "remember", source: "book", page: 4 },
        { q: "yaroqsiz", options: ["a", "b"], answer: 0 },
      ],
    };
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(quiz) }] } }] }), { status: 200 });
  });

  const r = await buildQuiz({ subject: "Algebra", grade: "10", difficulty: "easy", count: 5, source: { text: "[4-bet] Diskriminant D = b^2 - 4ac", label: "Diskriminant" } });
  assert.equal(r.questions.length, 1);
  const q = r.questions[0];
  assert.equal(q.options[q.answer], "b^2-4ac");
  assert.equal(q.whyWrong[q.answer], "");
  assert.equal(q.options.length, 4);
  assert.equal(q.page, 4);
  const prompt = sentBody.contents[0].parts.map((p) => p.text).join("");
  assert.match(prompt, /TEXTBOOK/);
  assert.match(sentBody.systemInstruction.parts[0].text, /MISCONCEPTION/);
  assert.equal(sentBody.generationConfig.responseMimeType, "application/json");
});

test("Qiyin daraja: avval Google Search bilan internet materiali olinadi", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push(body);
    if (body.tools) {
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "Olimpiada masalasi..." }] }, groundingMetadata: { groundingChunks: [{ web: { uri: "https://example.org/olimp", title: "Olimpiada" } }] } }] }));
    }
    const quiz = { questions: [{ q: "Q", options: ["1", "2", "3", "4"], answer: 2, explain: "", whyWrong: [], hints: [], bloom: "analyze", source: "internet" }] };
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(quiz) }] } }] }));
  });
  const r = await buildQuiz({ subject: "Algebra", grade: "10", difficulty: "hard", count: 4, source: { text: "[4-bet] matn", label: "X" } });
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].tools, [{ google_search: {} }]);
  assert.match(calls[1].contents[0].parts[0].text, /INTERNET MATERIAL/);
  assert.equal(r.sources[0].url, "https://example.org/olimp");
  assert.equal(r.questions[0].source, "internet");
});

test("Laboratoriya: POE ko'rsatmasi bashorat, o'lchovlar va skillarni o'z ichiga oladi", async () => {
  const { labSystemPrompt, LAB_SKILLS, SKILL_BY_ID } = await import("../src/pedagogy/skills.js");
  for (const ids of Object.values(LAB_SKILLS)) for (const id of ids) assert.ok(SKILL_BY_ID[id], id);
  const p = labSystemPrompt({
    lang: "uz", kind: "explain",
    experiment: { title: "Mayatnik", subject: "Fizika", goal: "Davr" },
    state: "L: 1 m", prediction: { text: "2 marta", correct: true }, records: ["L: 1; T: 2.0"],
  });
  assert.match(p, /Predict-Observe-Explain/);
  assert.match(p, /CORRECT/);
  assert.match(p, /1\. L: 1; T: 2.0/);
  assert.match(p, /MISCONCEPTION|misconception/i);
});

test("AI JSON: LaTeX backslashes are repaired", async () => {
  const { fixLatexEscapes } = await import("../src/lib/gemini.js");
  const raw = String.raw`{"a":"$x \cdot y = \frac{1}{2}$, $a \neq b$","b":"1\n2 \\sqrt{2} é"}`;
  const o = JSON.parse(fixLatexEscapes(raw));
  assert.equal(o.a, String.raw`$x \cdot y = \frac{1}{2}$, $a \neq b$`);
  assert.equal(o.b, "1\n2 \\sqrt{2} é");
});

test("Admin: faqat ADMIN_EMAILS dagilar, panel tokensiz yopiq", async () => {
  const { config } = await import("../src/config.js");
  const { isAdminEmail } = await import("../src/middleware/auth.js");
  const { createApp } = await import("../src/index.js");
  config.adminEmails = ["boss@studylora.uz"];
  assert.equal(isAdminEmail("Boss@Studylora.uz"), true);
  assert.equal(isAdminEmail("student@studylora.uz"), false);
  assert.equal(isAdminEmail(""), false);

  const server = createApp().listen(0);
  try {
    const r = await fetch(`http://127.0.0.1:${server.address().port}/api/admin/stats`);
    assert.equal(r.status, 401);
  } finally {
    server.close();
  }
});
