import { Router } from "express";
import { requireAuth, userLimit } from "../middleware/auth.js";
import { generate } from "../lib/gemini.js";
import { activity } from "../lib/userdata.js";
import { labSystemPrompt, LAB_SKILLS } from "../pedagogy/skills.js";
import { config } from "../config.js";

const router = Router();
router.use(requireAuth);

const perMinute = userLimit(60 * 1000, 10, "too_fast");
const perDay = userLimit(24 * 3600 * 1000, config.limits.chatPerDay, "daily_limit");

const str = (v, n) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);

/* Virtual laboratoriyadagi AI ustoz.
   body: { experiment:{id,title,subject,goal}, state:{...}, prediction:{text,correct}, records:[{...}],
           history:[{role:"user"|"ai", text}], text, kind:"chat"|"explain", lang } */
router.post("/ask", perMinute, perDay, async (req, res) => {
  const b = req.body || {};
  const lang = b.lang === "ru" ? "ru" : "uz";
  const kind = b.kind === "explain" ? "explain" : "chat";
  const text = String(b.text || "").trim().slice(0, 3000);
  if (!text) return res.status(400).json({ error: "empty_message" });

  const e = b.experiment || {};
  const flat = (o) =>
    Object.entries(o && typeof o === "object" ? o : {})
      .slice(0, 20)
      .map(([k, v]) => `${str(k, 40)}: ${str(v, 80)}`)
      .join("; ");
  const records = (Array.isArray(b.records) ? b.records : []).slice(-12).map(flat).filter(Boolean);

  const system = labSystemPrompt({
    lang,
    kind,
    experiment: { title: str(e.title, 120), subject: str(e.subject, 40), goal: str(e.goal, 400) },
    state: flat(b.state),
    prediction: b.prediction?.text ? { text: str(b.prediction.text, 200), correct: Boolean(b.prediction.correct) } : null,
    records,
  });

  const contents = [];
  for (const m of (Array.isArray(b.history) ? b.history : []).slice(-10)) {
    const t = String(m?.text || "").slice(0, 3000);
    if (!t) continue;
    const role = m.role === "ai" ? "model" : "user";
    const prev = contents[contents.length - 1];
    if (prev?.role === role) prev.parts.push({ text: t });
    else contents.push({ role, parts: [{ text: t }] });
  }
  while (contents[0]?.role === "model") contents.shift();
  if (contents[contents.length - 1]?.role === "user") contents[contents.length - 1].parts.push({ text });
  else contents.push({ role: "user", parts: [{ text }] });

  const result = await generate({ system, contents, temperature: 0.6 });
  if (kind === "explain") activity(req.userId, "lab").catch(() => {});
  res.json({ text: result.text, skills: LAB_SKILLS[kind] });
});

export default router;
