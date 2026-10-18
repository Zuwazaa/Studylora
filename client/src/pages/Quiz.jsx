import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen, FileText, AlertCircle, Lightbulb, Timer, ArrowRight, ArrowLeft, RotateCcw, Globe2, CheckCircle2, XCircle,
  GraduationCap, TrendingUp, Link2, Play,
} from "lucide-react";
import { Books, Courses, Quiz as QuizApi } from "../api/client";
import { useApp } from "../context/AppContext";
import { GRADES, subjectsOf, bookKey as makeKey } from "../data/catalog";
import { useBooks } from "../lib/useBooks";
import { PageHead } from "../components/Layout";
import { InlineMd } from "../components/Markdown";
import Iso from "../components/Iso";

const LETTERS = ["A", "B", "C", "D"];
const BLOOM_ORDER = ["remember", "understand", "apply", "analyze", "evaluate", "create"];

function presetFrom(state, user) {
  const p = state?.preset || {};
  let grade = p.grade ? String(p.grade) : String(user?.grade || 9);
  let subjectId = p.subjectId || (p.subject && subjectsOf(grade).some((s) => s.id === p.subject) ? p.subject : "");
  if (p.bookKey) {
    const [g, ...rest] = p.bookKey.split("-");
    grade = g;
    subjectId = rest.join("-");
  }
  if (!subjectId && p.subject) subjectId = subjectsOf(grade).find((s) => s.uz === p.subject)?.id || "";
  return {
    source: p.courseId ? "course" : state?.fromMistakes ? "mistakes" : "book",
    grade: GRADES[grade] ? grade : "9",
    subjectId: subjectId || subjectsOf(GRADES[grade] ? grade : 9)[0].id,
    courseId: p.courseId || "",
    scope: p.from ? "pages" : "random",
    from: p.from || "",
    to: p.to || "",
    topic: p.topic || "",
    autostart: Boolean(p.from || state?.autostart),
  };
}

/* ================= Sozlash ================= */
function Setup({ onStart, initial }) {
  const { t, lang, errText, toast } = useApp();
  const books = useBooks();
  const [f, setF] = useState(initial);
  const [difficulty, setDifficulty] = useState(initial.difficulty || "medium");
  const [count, setCount] = useState(10);
  const [mode, setMode] = useState("practice");
  const [toc, setToc] = useState(null);
  const [tocIndex, setTocIndex] = useState("");
  const [courses, setCourses] = useState([]);

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const key = makeKey(f.grade, f.subjectId);
  const hasBook = Boolean(books?.[key]);

  useEffect(() => { Courses.list().then((r) => setCourses(r.courses)).catch(() => {}); }, []);
  useEffect(() => { setToc(null); setTocIndex(""); }, [key, f.source]);

  const loadToc = async () => {
    setToc("loading");
    try {
      const r = await Books.toc(key);
      setToc(r.toc || []);
    } catch (e) {
      setToc([]);
      toast(errText(e), "error");
    }
  };
  useEffect(() => { if (f.scope === "toc" && f.source === "book" && hasBook && toc === null) loadToc(); }, [f.scope, f.source, hasBook, toc]); // eslint-disable-line

  const start = () => {
    const subj = subjectsOf(f.grade).find((s) => s.id === f.subjectId);
    const body = { difficulty, count, mode, lang, grade: f.grade, subject: subj?.uz };
    if (f.source === "book") {
      if (hasBook) body.bookKey = key;
      if (f.scope === "toc" && tocIndex !== "") body.tocIndex = Number(tocIndex);
      if (f.scope === "pages" && f.from) { body.from = Number(f.from); body.to = Number(f.to) || Number(f.from) + 3; }
      if (f.scope === "topic" && f.topic.trim()) body.topic = f.topic.trim();
    } else if (f.source === "course") {
      if (!f.courseId) return toast(t("quiz.pickCourse"), "error");
      body.courseId = f.courseId;
      delete body.subject;
      if (f.scope === "pages" && f.from) { body.from = Number(f.from); body.to = Number(f.to) || Number(f.from) + 3; }
      if (f.scope === "topic" && f.topic.trim()) body.topic = f.topic.trim();
    } else {
      body.fromMistakes = true;
      delete body.subject;
    }
    onStart(body);
  };

  useEffect(() => { if (initial.autostart && books) start(); }, [books]); // eslint-disable-line

  return (
    <div className="quiz-setup">
      <div className="card pad-lg">
        <p className="eyebrow">{t("quiz.step1")}</p>
        <div className="source-tabs">
          {[["book", BookOpen], ["course", FileText], ["mistakes", AlertCircle]].map(([id, Icon]) => (
            <button key={id} className={`source-tab${f.source === id ? " on" : ""}`} onClick={() => set("source", id)}>
              <Icon size={20} />
              <b>{t(`quiz.src.${id}`)}</b>
              <small>{t(`quiz.src.${id}D`)}</small>
            </button>
          ))}
        </div>

        {f.source === "book" && (
          <div className="form-grid">
            <label className="field"><span>{t("quiz.grade")}</span>
              <select className="select" value={f.grade} onChange={(e) => setF((s) => ({ ...s, grade: e.target.value, subjectId: subjectsOf(e.target.value)[0].id }))}>
                {Object.keys(GRADES).map((g) => <option key={g} value={g}>{t("grade.n", { n: g })}</option>)}
              </select>
            </label>
            <label className="field"><span>{t("quiz.subject")}</span>
              <select className="select" value={f.subjectId} onChange={(e) => set("subjectId", e.target.value)}>
                {subjectsOf(f.grade).map((s) => <option key={s.id} value={s.id}>{s[lang]}{books?.[makeKey(f.grade, s.id)] ? " 📘" : ""}</option>)}
              </select>
            </label>
            <p className={`form-note ${hasBook ? "ok" : ""}`}>
              {books === null ? "…" : hasBook ? t("quiz.bookFound") : t("quiz.bookMissing")}
            </p>
          </div>
        )}

        {f.source === "course" && (
          <div className="form-grid">
            <label className="field full"><span>{t("quiz.course")}</span>
              <select className="select" value={f.courseId} onChange={(e) => set("courseId", e.target.value)}>
                <option value="">{t("quiz.pickCourse")}</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </label>
            {courses.length === 0 && <p className="form-note">{t("quiz.noCourses")}</p>}
          </div>
        )}

        {f.source === "mistakes" && <p className="form-note ok">{t("quiz.mistakesNote")}</p>}

        {f.source !== "mistakes" && (hasBook || f.source === "course") && (
          <>
            <p className="eyebrow" style={{ marginTop: 22 }}>{t("quiz.step2")}</p>
            <div className="seg">
              {["random", ...(f.source === "book" ? ["toc"] : []), "pages", "topic"].map((s) => (
                <button key={s} className={f.scope === s ? "on" : ""} onClick={() => set("scope", s)}>{t(`quiz.scope.${s}`)}</button>
              ))}
            </div>
            <div className="scope-body">
              {f.scope === "toc" && (
                toc === "loading" ? <p className="small muted row"><span className="spinner" /> {t("quiz.tocLoading")}</p>
                  : toc?.length ? (
                    <select className="select" value={tocIndex} onChange={(e) => setTocIndex(e.target.value)}>
                      <option value="">{t("quiz.pickSection")}</option>
                      {toc.map((it, i) => it.page && <option key={i} value={i}>{"— ".repeat(it.depth || 0)}{it.title} ({it.page})</option>)}
                    </select>
                  ) : toc && <p className="small muted">{t("quiz.noToc")}</p>
              )}
              {f.scope === "pages" && (
                <div className="row">
                  <input className="input" inputMode="numeric" placeholder={t("quiz.from")} value={f.from} onChange={(e) => set("from", e.target.value.replace(/\D/g, ""))} />
                  <span>—</span>
                  <input className="input" inputMode="numeric" placeholder={t("quiz.to")} value={f.to} onChange={(e) => set("to", e.target.value.replace(/\D/g, ""))} />
                </div>
              )}
              {f.scope === "topic" && <input className="input" placeholder={t("quiz.topicPh")} value={f.topic} onChange={(e) => set("topic", e.target.value)} />}
              {f.scope === "random" && <p className="small muted">{t("quiz.randomNote")}</p>}
            </div>
          </>
        )}
        {f.source === "book" && !hasBook && books && (
          <label className="field" style={{ marginTop: 16 }}><span>{t("quiz.topicOptional")}</span>
            <input className="input" placeholder={t("quiz.topicPh")} value={f.topic} onChange={(e) => setF((s) => ({ ...s, topic: e.target.value, scope: "topic" }))} />
          </label>
        )}
      </div>

      <div className="card pad-lg">
        <p className="eyebrow">{t("quiz.step3")}</p>
        <div className="level-grid">
          {["easy", "medium", "hard"].map((d) => (
            <button key={d} className={`level ${d}${difficulty === d ? " on" : ""}`} onClick={() => setDifficulty(d)}>
              <b>{t(`level.${d}`)}</b>
              <small>{t(`level.${d}D`)}</small>
              {d === "hard" && <span className="chip teal"><Globe2 size={12} />{t("level.web")}</span>}
            </button>
          ))}
        </div>

        <div className="form-grid" style={{ marginTop: 18 }}>
          <div className="field"><span>{t("quiz.count")}</span>
            <div className="seg">{[5, 10, 15, 20].map((n) => <button key={n} className={count === n ? "on" : ""} onClick={() => setCount(n)}>{n}</button>)}</div>
          </div>
          <div className="field"><span>{t("quiz.mode")}</span>
            <div className="seg">
              <button className={mode === "practice" ? "on" : ""} onClick={() => setMode("practice")}>{t("quiz.practice")}</button>
              <button className={mode === "test" ? "on" : ""} onClick={() => setMode("test")}>{t("quiz.exam")}</button>
            </div>
          </div>
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>{mode === "practice" ? t("quiz.practiceD") : t("quiz.examD")}</p>

        <button className="btn lg btn-green block" style={{ marginTop: 22 }} onClick={start}><Play size={18} />{t("quiz.start")}</button>
      </div>
    </div>
  );
}

/* ================= Yuklanish ================= */
function Loading({ hard }) {
  const { t } = useApp();
  const steps = ["quiz.load.read", ...(hard ? ["quiz.load.web"] : []), "quiz.load.bloom", "quiz.load.hints"];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => Math.min(steps.length - 1, x + 1)), 3500);
    return () => clearInterval(id);
  }, [steps.length]);
  return (
    <div className="card quiz-loading">
      <Iso kind={hard ? "globe" : "test"} size={150} className="bob" />
      <h2>{t("quiz.load.title")}</h2>
      <ul>
        {steps.map((s, j) => (
          <li key={s} className={j < i ? "done" : j === i ? "now" : ""}>
            {j < i ? <CheckCircle2 size={16} /> : j === i ? <span className="spinner" /> : <span className="dot" />}
            {t(s)}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ================= Savollar ================= */
function Runner({ quiz, onFinish }) {
  const { t, errText, toast } = useApp();
  const n = quiz.questions.length;
  const practice = quiz.meta.mode === "practice";
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState(() => Array(n).fill(null));
  const [conf, setConf] = useState(() => Array(n).fill(null));
  const [hints, setHints] = useState(() => Array.from({ length: n }, () => []));
  const [checked, setChecked] = useState(() => Array(n).fill(null));
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(quiz.timeLimit || 0);
  const started = useRef(Date.now());
  const finishing = useRef(false);

  const q = quiz.questions[idx];
  const sel = answers[idx];
  const fb = checked[idx];

  const finish = async () => {
    if (finishing.current) return;
    finishing.current = true;
    setBusy(true);
    try {
      const r = await QuizApi.submit({
        token: quiz.token, answers, confidence: conf, hintsUsed: hints.map((h) => h.length),
        seconds: Math.round((Date.now() - started.current) / 1000),
      });
      onFinish(r);
    } catch (e) {
      finishing.current = false;
      setBusy(false);
      toast(errText(e), "error");
    }
  };

  useEffect(() => {
    if (!quiz.timeLimit) return;
    const id = setInterval(() => setLeft((s) => {
      if (s <= 1) { clearInterval(id); finish(); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line

  const choose = (i) => {
    if (fb) return;
    setAnswers((a) => a.map((x, j) => (j === idx ? i : x)));
  };

  const getHint = async () => {
    const level = hints[idx].length;
    if (level >= q.hintCount) return;
    try {
      const r = await QuizApi.hint({ token: quiz.token, index: idx, level });
      setHints((h) => h.map((x, j) => (j === idx ? [...x, r.hint] : x)));
    } catch (e) { toast(errText(e), "error"); }
  };

  const check = async () => {
    if (sel === null) return;
    setBusy(true);
    try {
      const r = await QuizApi.check({ token: quiz.token, index: idx, selected: sel });
      setChecked((c) => c.map((x, j) => (j === idx ? r : x)));
    } catch (e) { toast(errText(e), "error"); }
    setBusy(false);
  };

  const next = () => (idx < n - 1 ? setIdx(idx + 1) : finish());
  const answered = answers.filter((a) => a !== null).length;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div className="runner">
      <div className="runner-top">
        <div className="grow">
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <b>{quiz.meta.topic || quiz.meta.subject}</b>
            <span className="small muted">{t("quiz.qOf", { i: idx + 1, n })}</span>
          </div>
          <div className="bar green"><i style={{ width: `${((idx + (fb || !practice ? 1 : 0)) / n) * 100}%` }} /></div>
        </div>
        {quiz.timeLimit > 0 && <span className={`chip ${left < 60 ? "danger" : "yellow"} timer`}><Timer size={14} />{mm}:{ss}</span>}
      </div>

      <div className="card pad-lg q-card fade-up" key={idx}>
        <div className="row wrap" style={{ marginBottom: 14 }}>
          <span className="chip green">{t(`bloom.${q.bloom}`)}</span>
          {q.source === "internet" ? <span className="chip teal"><Globe2 size={12} />{t("quiz.fromWeb")}</span>
            : q.source === "book" && q.page ? <span className="chip yellow"><BookOpen size={12} />{t("reader.page", { n: q.page })}</span> : null}
        </div>
        <h2 className="q-text"><InlineMd>{q.q}</InlineMd></h2>

        <div className="options">
          {q.options.map((o, i) => {
            let cls = "";
            if (fb) cls = i === fb.answer ? "right" : i === sel ? "wrong" : "dim";
            else if (sel === i) cls = "sel";
            return (
              <button key={i} className={`opt ${cls}`} onClick={() => choose(i)} disabled={Boolean(fb)}>
                <span className="opt-l">{LETTERS[i]}</span>
                <span className="grow"><InlineMd>{o}</InlineMd></span>
                {fb && i === fb.answer && <CheckCircle2 size={18} />}
                {fb && i === sel && i !== fb.answer && <XCircle size={18} />}
              </button>
            );
          })}
        </div>

        {!fb && (
          <div className="confidence">
            <span className="small muted">{t("quiz.conf")}</span>
            {["sure", "unsure", "guess"].map((c) => (
              <button key={c} className={`chip btnlike${conf[idx] === c ? " on" : ""}`} onClick={() => setConf((a) => a.map((x, j) => (j === idx ? c : x)))}>{t(`conf.${c}`)}</button>
            ))}
          </div>
        )}

        {practice && hints[idx].length > 0 && (
          <div className="hints">
            {hints[idx].map((h, i) => (
              <div key={i} className="hint"><Lightbulb size={16} /><div><b>{t("quiz.hintN", { n: i + 1 })}</b> <InlineMd>{h}</InlineMd></div></div>
            ))}
          </div>
        )}

        {fb && (
          <div className={`feedback ${fb.correct ? "ok" : "bad"}`}>
            <b>{fb.correct ? t("quiz.correct") : t("quiz.wrong")}</b>
            {fb.whyWrong && <p><span className="fb-label">{t("quiz.whyWrong")}</span> <InlineMd>{fb.whyWrong}</InlineMd></p>}
            {fb.explain && <p><span className="fb-label">{t("quiz.explain")}</span> <InlineMd>{fb.explain}</InlineMd></p>}
          </div>
        )}

        <div className="q-actions">
          {!practice && idx > 0 && <button className="btn btn-ghost" onClick={() => setIdx(idx - 1)}><ArrowLeft size={16} />{t("quiz.prev")}</button>}
          {practice && !fb && hints[idx].length < q.hintCount && (
            <button className="btn btn-soft" onClick={getHint}><Lightbulb size={16} />{hints[idx].length ? t("quiz.moreHint") : t("quiz.hint")}</button>
          )}
          <span className="grow" />
          {practice && !fb ? (
            <button className="btn btn-green" onClick={check} disabled={sel === null || busy}>{busy ? <span className="spinner" /> : t("quiz.check")}</button>
          ) : (
            <button className="btn btn-green" onClick={next} disabled={busy}>
              {busy ? <span className="spinner" /> : idx < n - 1 ? <>{t("quiz.next")}<ArrowRight size={16} /></> : t("quiz.finish")}
            </button>
          )}
        </div>
      </div>

      {!practice && (
        <div className="q-dots">
          {quiz.questions.map((_, i) => (
            <button key={i} className={`${i === idx ? "now" : ""} ${answers[i] !== null ? "done" : ""}`} onClick={() => setIdx(i)}>{i + 1}</button>
          ))}
          <button className="btn btn-ghost sm" onClick={finish} disabled={busy}>{t("quiz.finishN", { a: answered, n })}</button>
        </div>
      )}
    </div>
  );
}

/* ================= Natija ================= */
function Result({ result, quiz, onRestart, onSame }) {
  const { t } = useApp();
  const nav = useNavigate();
  const { pct, score, total, bloom, calibration, review, nextStep } = result;
  const r = 52, c = 2 * Math.PI * r;

  const next = {
    level_up: { icon: TrendingUp, action: () => onSame({ difficulty: quiz.meta.difficulty === "easy" ? "medium" : "hard" }) },
    mastered: { icon: CheckCircle2, action: onRestart },
    practice_more: { icon: RotateCcw, action: () => onSame({}) },
    reteach: { icon: GraduationCap, action: () => nav("/app/ustoz", { state: { ask: t("result.reteachAsk", { topic: quiz.meta.topic || quiz.meta.subject }) } }) },
    review_confident_mistakes: { icon: AlertCircle, action: () => nav("/app/xatolar") },
  }[nextStep];
  const NextIcon = next?.icon || ArrowRight;

  return (
    <div className="result">
      <div className="result-top">
        <div className="card green result-score">
          <svg width="130" height="130" className="ring light">
            <circle cx="65" cy="65" r={r} className="ring-bg" />
            <circle cx="65" cy="65" r={r} className="ring-fg" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
            <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle">{pct}%</text>
          </svg>
          <div>
            <h2>{t(pct >= 85 ? "result.great" : pct >= 60 ? "result.good" : "result.keep")}</h2>
            <p className="muted">{t("result.score", { s: score, n: total })} · {t(`level.${quiz.meta.difficulty}`)}</p>
          </div>
        </div>

        <div className="card next-card">
          <p className="eyebrow">{t("result.next")}</p>
          <div className="row" style={{ alignItems: "flex-start" }}>
            <span className="stat-ic yellow"><NextIcon size={20} /></span>
            <div className="grow">
              <b>{t(`next.${nextStep}`)}</b>
              <p className="small muted">{t(`next.${nextStep}D`)}</p>
            </div>
          </div>
          <div className="row wrap" style={{ marginTop: 14 }}>
            <button className="btn btn-green sm" onClick={next?.action}>{t(`next.${nextStep}Btn`)}</button>
            <button className="btn btn-ghost sm" onClick={onRestart}>{t("result.new")}</button>
          </div>
          <p className="small muted" style={{ marginTop: 10 }}>{t("result.masteryNote")}</p>
        </div>
      </div>

      <div className="result-grid">
        <div className="card">
          <div className="card-head"><h3 className="card-title">{t("result.bloom")}</h3><span className="chip green">{t("methods.bloom")}</span></div>
          <div className="stack">
            {BLOOM_ORDER.filter((b) => bloom[b]).map((b) => (
              <div key={b}>
                <div className="row" style={{ justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
                  <span>{t(`bloom.${b}`)}</span><span className="muted">{bloom[b].ok}/{bloom[b].total}</span>
                </div>
                <div className="bar"><i style={{ width: `${(bloom[b].ok / bloom[b].total) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3 className="card-title">{t("result.calib")}</h3><span className="chip terracotta">{t("methods.meta")}</span></div>
          <div className="calib">
            <div className="calib-cell ok"><b>{calibration.sureRight}</b><small>{t("calib.sureRight")}</small></div>
            <div className="calib-cell bad"><b>{calibration.sureWrong}</b><small>{t("calib.sureWrong")}</small></div>
            <div className="calib-cell"><b>{calibration.unsureRight + calibration.guessRight}</b><small>{t("calib.luckyRight")}</small></div>
            <div className="calib-cell"><b>{calibration.unsureWrong + calibration.guessWrong}</b><small>{t("calib.knownGap")}</small></div>
          </div>
          <p className="small muted" style={{ marginTop: 10 }}>{calibration.sureWrong ? t("calib.warn") : t("calib.note")}</p>
        </div>
      </div>

      {quiz.sources?.length > 0 && (
        <div className="card" style={{ marginTop: 18 }}>
          <h3 className="card-title" style={{ marginBottom: 10 }}>{t("result.sources")}</h3>
          <div className="row wrap">{quiz.sources.map((s) => <a key={s.url} className="chip" href={s.url} target="_blank" rel="noreferrer"><Link2 size={12} />{s.title.slice(0, 50)}</a>)}</div>
        </div>
      )}

      <h3 className="section-title">{t("result.review")}</h3>
      <div className="stack">
        {review.map((q, i) => (
          <div key={i} className={`card rev ${q.ok ? "ok" : "bad"}`}>
            <div className="row wrap" style={{ marginBottom: 8 }}>
              <span className="rev-n">{i + 1}</span>
              <span className="chip green">{t(`bloom.${q.bloom}`)}</span>
              {q.confidence && <span className="chip">{t(`conf.${q.confidence}`)}</span>}
              {q.hintsUsed > 0 && <span className="chip yellow"><Lightbulb size={12} />{q.hintsUsed}</span>}
              {q.page && quiz.meta.bookKey && (
                <button className="chip btnlike" onClick={() => { const [g, ...s] = quiz.meta.bookKey.split("-"); nav(`/app/darsliklar/${g}/${s.join("-")}?bet=${q.page}`); }}>
                  <BookOpen size={12} />{t("reader.page", { n: q.page })}
                </button>
              )}
            </div>
            <p className="rev-q"><InlineMd>{q.q}</InlineMd></p>
            <div className="rev-ans">
              {q.selected !== null && !q.ok && <span className="bad"><XCircle size={15} /><span><InlineMd>{q.options[q.selected]}</InlineMd></span></span>}
              {q.selected === null && <span className="bad"><XCircle size={15} />{t("result.noAnswer")}</span>}
              <span className="ok"><CheckCircle2 size={15} /><span><InlineMd>{q.options[q.answer]}</InlineMd></span></span>
            </div>
            {q.whyWrong && <p className="small"><b>{t("quiz.whyWrong")}</b> <InlineMd>{q.whyWrong}</InlineMd></p>}
            {q.explain && <p className="small muted"><InlineMd>{q.explain}</InlineMd></p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= Sahifa ================= */
export default function QuizPage() {
  const { t, user, errText, toast, setData } = useApp();
  const loc = useLocation();
  const initial = useMemo(() => presetFrom(loc.state, user), []); // eslint-disable-line
  const [stage, setStage] = useState("setup");
  const [request, setRequest] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [result, setResult] = useState(null);

  const start = async (body) => {
    setRequest(body);
    setStage("loading");
    try {
      const q = await QuizApi.generate(body);
      setQuiz(q);
      setStage("run");
    } catch (e) {
      toast(errText(e), "error");
      setStage("setup");
    }
  };

  const finish = (r) => {
    setResult(r);
    if (r.data) setData(r.data);
    setStage("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      {stage === "setup" && <PageHead title={t("quiz.title")} accent={t("quiz.accent")} sub={t("quiz.sub")} />}
      {stage === "setup" && <Setup initial={{ ...initial, autostart: initial.autostart && !request }} onStart={start} />}
      {stage === "loading" && <Loading hard={request?.difficulty === "hard"} />}
      {stage === "run" && quiz && <Runner quiz={quiz} onFinish={finish} />}
      {stage === "result" && result && (
        <Result
          result={result}
          quiz={quiz}
          onRestart={() => { setQuiz(null); setResult(null); setStage("setup"); }}
          onSame={(over) => start({ ...request, ...over })}
        />
      )}
    </div>
  );
}
