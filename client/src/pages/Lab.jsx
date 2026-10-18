import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, CheckCircle2, ClipboardList, Eye, Lightbulb, MessageCircleQuestion, Send, Trash2, X } from "lucide-react";
import { Lab as LabApi } from "../api/client";
import { useApp } from "../context/AppContext";
import { PageHead } from "../components/Layout";
import SubjectIcon from "../components/SubjectIcon";
import SkillChips from "../components/SkillChips";
import Markdown from "../components/Markdown";
import { EXPERIMENTS, EXP_BY_ID, LAB_SUBJECTS } from "../lab/experiments";
import { tr } from "../lab/kit";
import "../styles/lab.css";

const DONE_KEY = "studylora.lab.done";
const readDone = () => { try { return JSON.parse(localStorage.getItem(DONE_KEY) || "[]"); } catch { return []; } };
const markDone = (id) => { try { localStorage.setItem(DONE_KEY, JSON.stringify([...new Set([...readDone(), id])])); } catch { /* ignore */ } };

export default function Lab() {
  const { expId } = useParams();
  if (!expId) return <LabHome />;
  const exp = EXP_BY_ID[expId];
  if (!exp) return <Navigate to="/app/laboratoriya" replace />;
  return <Experiment key={exp.id} exp={exp} />;
}

function LabHome() {
  const { t, lang } = useApp();
  const [subj, setSubj] = useState("all");
  const done = readDone();
  const list = EXPERIMENTS.filter((e) => subj === "all" || e.subject === subj);

  return (
    <div>
      <PageHead title={t("lab.title")} accent={t("lab.accent")} sub={t("lab.sub")} />

      <div className="card green lab-hero">
        <div>
          <p className="eyebrow light">{t("lab.heroEyebrow")}</p>
          <h2>{t("lab.heroTitle")}</h2>
          <p className="muted">{t("lab.heroSub")}</p>
        </div>
        <ol className="lab-poe">
          <li><Lightbulb size={18} /><b>{t("lab.step1")}</b><small>{t("lab.step1d")}</small></li>
          <li><Eye size={18} /><b>{t("lab.step2")}</b><small>{t("lab.step2d")}</small></li>
          <li><MessageCircleQuestion size={18} /><b>{t("lab.step3")}</b><small>{t("lab.step3d")}</small></li>
        </ol>
      </div>

      <div className="row wrap" style={{ margin: "4px 0 16px" }}>
        <div className="seg">
          <button className={subj === "all" ? "on" : ""} onClick={() => setSubj("all")}>{t("lab.all")}</button>
          {Object.entries(LAB_SUBJECTS).map(([id, s]) => (
            <button key={id} className={subj === id ? "on" : ""} onClick={() => setSubj(id)}>{s[lang]}</button>
          ))}
        </div>
        <span className="muted small">{t("lab.doneCount", { n: done.length, total: EXPERIMENTS.length })}</span>
      </div>

      <div className="lab-grid">
        {list.map((e) => {
          const s = LAB_SUBJECTS[e.subject];
          return (
            <Link key={e.id} to={`/app/laboratoriya/${e.id}`} className="lab-card card">
              <div className="row">
                <span className={`lab-ic ${s.tone}`}><SubjectIcon icon={s.icon} size={20} /></span>
                <span className="chip">{s[lang]}</span>
                <span className="chip">{t("grade.n", { n: e.grade })}</span>
                {done.includes(e.id) && <span className="lab-done" title={t("lab.done")}><Check size={14} /></span>}
              </div>
              <h3>{tr(lang, e.title)}</h3>
              <p className="muted small">{tr(lang, e.goal)}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

const asText = (items, lang) =>
  Object.fromEntries((items || []).map((i) => [`${tr(lang, i.label)}${i.unit ? ` (${i.unit})` : ""}`, i.value]));

function Experiment({ exp }) {
  const { t, lang, errText, toast } = useApp();
  const nav = useNavigate();
  const subj = LAB_SUBJECTS[exp.subject];
  const [current, setCurrent] = useState([]);
  const [records, setRecords] = useState([]);
  const [guess, setGuess] = useState(null);
  const [skipped, setSkipped] = useState(false);
  const [explain, setExplain] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);
  const onState = useCallback((items) => setCurrent(items), []);
  const Sim = exp.Sim;

  const context = () => ({
    lang,
    experiment: { id: exp.id, title: tr(lang, exp.title), subject: subj[lang], goal: tr(lang, exp.goal) },
    state: asText(current, lang),
    prediction: guess == null ? null : { text: tr(lang, exp.predict.options[guess]), correct: guess === exp.predict.answer },
    records: records.map((r) => asText(r, lang)),
  });

  const record = () => {
    if (!current.length) return;
    setRecords((l) => [...l, current].slice(-20));
  };

  const submit = async () => {
    setBusy(true);
    try {
      const r = await LabApi.ask({ ...context(), kind: "explain", text: explain });
      setFeedback(r);
      markDone(exp.id);
    } catch (e) {
      toast(errText(e), "error");
    } finally {
      setBusy(false);
    }
  };

  const locked = guess == null && !skipped;
  const cols = records[0] || [];
  const right = guess === exp.predict.answer;

  return (
    <div className="lab-exp">
      <div className="row wrap lab-top">
        <button className="icon-btn" onClick={() => nav("/app/laboratoriya")} aria-label={t("lab.back")}><ArrowLeft size={20} /></button>
        <span className={`lab-ic ${subj.tone}`}><SubjectIcon icon={subj.icon} size={20} /></span>
        <div className="grow">
          <h1 className="lab-h1">{tr(lang, exp.title)}</h1>
          <p className="muted small">{tr(lang, exp.goal)}</p>
        </div>
      </div>

      <div className="lab-layout">
        <div className="stack">
          <div className={`card lab-bench${locked ? " locked" : ""}`}>
            <Sim lang={lang} onState={onState} />
            {locked && (
              <div className="lab-lock">
                <Lightbulb size={26} />
                <b>{t("lab.lockTitle")}</b>
                <p className="muted small">{t("lab.lockSub")}</p>
                <button className="btn btn-soft sm" onClick={() => setSkipped(true)}>{t("lab.skip")}</button>
              </div>
            )}
            <div className="row wrap lab-bench-foot">
              <button className="btn btn-yellow sm" onClick={record} disabled={locked}><ClipboardList size={16} />{t("lab.record")}</button>
              <span className="muted small">{t("lab.recordHint")}</span>
            </div>
          </div>

          {records.length > 0 && (
            <div className="card">
              <div className="card-head">
                <h3 className="card-title">{t("lab.journal")}</h3>
                <button className="btn btn-ghost sm" onClick={() => setRecords([])}><Trash2 size={15} />{t("lab.clear")}</button>
              </div>
              {exp.plot && <LabChart records={records} plot={exp.plot} lang={lang} />}
              <div className="table-wrap">
                <table className="table lab-table">
                  <thead>
                    <tr><th>#</th>{cols.map((c) => <th key={c.id}>{tr(lang, c.label)}{c.unit && `, ${c.unit}`}</th>)}<th /></tr>
                  </thead>
                  <tbody>
                    {records.map((r, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        {cols.map((c) => <td key={c.id}>{String(r.find((x) => x.id === c.id)?.value ?? "—")}</td>)}
                        <td><button className="icon-btn" onClick={() => setRecords((l) => l.filter((_, j) => j !== i))} aria-label={t("lab.clear")}><X size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="stack lab-side">
          <div className="card lab-steps">
            <section className={guess != null ? "ok" : "active"}>
              <h4><span>1</span>{t("lab.step1")}</h4>
              <p>{tr(lang, exp.predict.q)}</p>
              <div className="lab-opts">
                {exp.predict.options.map((o, i) => {
                  const reveal = feedback && guess != null;
                  const cls = guess === i ? (reveal ? (right ? "good" : "bad") : "on") : reveal && i === exp.predict.answer ? "good" : "";
                  return (
                    <button key={i} className={`lab-opt ${cls}`} disabled={guess != null} onClick={() => setGuess(i)}>{tr(lang, o)}</button>
                  );
                })}
              </div>
              {guess != null && !feedback && <p className="muted small">{t("lab.guessSaved")}</p>}
              {feedback && guess != null && <p className={`lab-verdict ${right ? "good" : "bad"}`}>{right ? t("lab.guessRight") : t("lab.guessWrong")}</p>}
            </section>

            <section className={locked ? "" : records.length >= 2 ? "ok" : "active"}>
              <h4><span>2</span>{t("lab.step2")}</h4>
              <ul className="lab-tasks">
                {tr(lang, exp.tasks).map((x, i) => <li key={i}>{x}</li>)}
              </ul>
              <p className="muted small">{t("lab.recordsN", { n: records.length })}</p>
            </section>

            <section className={feedback ? "ok" : records.length ? "active" : ""}>
              <h4><span>3</span>{t("lab.step3")}</h4>
              {!feedback ? (
                <>
                  <textarea className="textarea" rows={4} value={explain} onChange={(e) => setExplain(e.target.value)} placeholder={t("lab.explainPh")} />
                  <button className="btn btn-green sm" disabled={busy || !records.length || explain.trim().length < 10} onClick={submit}>
                    {busy ? <span className="spinner" /> : <Send size={15} />}{t("lab.check")}
                  </button>
                  {!records.length && <p className="muted small">{t("lab.needRecords")}</p>}
                </>
              ) : (
                <div className="lab-feedback">
                  <Markdown>{feedback.text}</Markdown>
                  <SkillChips ids={feedback.skills} />
                  <p className="lab-verdict good"><CheckCircle2 size={16} />{t("lab.finished")}</p>
                  <button className="btn btn-soft sm" onClick={() => { setFeedback(null); }}>{t("lab.again")}</button>
                </div>
              )}
            </section>
          </div>

          <LabChat context={context} />
        </div>
      </div>
    </div>
  );
}

function LabChat({ context }) {
  const { t, errText } = useApp();
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const box = useRef(null);
  // Faqat xabarlar oynasini aylantiramiz, sahifani emas
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [msgs, busy]);

  const send = async (q) => {
    const body = String(q ?? text).trim();
    if (!body || busy) return;
    setText("");
    const history = msgs.map((m) => ({ role: m.role, text: m.text }));
    setMsgs((l) => [...l, { role: "user", text: body }]);
    setBusy(true);
    try {
      const r = await LabApi.ask({ ...context(), kind: "chat", text: body, history });
      setMsgs((l) => [...l, { role: "ai", text: r.text, skills: r.skills }]);
    } catch (e) {
      setMsgs((l) => [...l, { role: "ai", text: errText(e), error: true }]);
    } finally {
      setBusy(false);
    }
  };

  const sugg = [t("lab.q1"), t("lab.q2"), t("lab.q3")];
  return (
    <div className="card lab-chat">
      <div className="card-head">
        <div>
          <h3 className="card-title">{t("lab.ustoz")}</h3>
          <p className="muted small">{t("lab.ustozSub")}</p>
        </div>
      </div>
      <div className="lab-msgs" ref={box}>
        {msgs.map((m, i) => (
          <div key={i} className={`lab-msg ${m.role}${m.error ? " err" : ""}`}>
            {m.role === "ai" ? <Markdown>{m.text}</Markdown> : m.text}
            {m.skills && <SkillChips ids={m.skills} />}
          </div>
        ))}
        {busy && <div className="lab-msg ai"><span className="spinner" /></div>}
      </div>
      {!msgs.length && (
        <div className="row wrap">
          {sugg.map((s) => <button key={s} className="chip btnlike" onClick={() => send(s)}>{s}</button>)}
        </div>
      )}
      <form className="lab-compose" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("lab.askPh")} aria-label={t("lab.askPh")} />
        <button className="btn btn-green" disabled={busy || !text.trim()} aria-label={t("lab.send")}><Send size={16} /></button>
      </form>
    </div>
  );
}

/* O'lchovlar grafigi: x bo'yicha saralangan nuqtalar */
function LabChart({ records, plot, lang }) {
  const pts = records
    .map((r) => [r.find((i) => i.id === plot.x), r.find((i) => i.id === plot.y)])
    .filter(([a, b]) => typeof a?.value === "number" && typeof b?.value === "number")
    .map(([a, b]) => ({ x: a.value, y: b.value, xl: a, yl: b }))
    .sort((a, b) => a.x - b.x);
  if (pts.length < 2) return <p className="muted small">{tr(lang, { uz: "Grafik uchun kamida 2 ta o'lchov yozing.", ru: "Для графика запишите хотя бы 2 измерения." })}</p>;

  const W = 420, H = 200, pad = 40;
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const x0 = Math.min(0, ...xs), x1 = Math.max(...xs) || 1;
  const y0 = Math.min(0, ...ys), y1 = Math.max(...ys) || 1;
  const sx = (v) => pad + ((v - x0) / (x1 - x0 || 1)) * (W - pad - 12);
  const sy = (v) => H - 28 - ((v - y0) / (y1 - y0 || 1)) * (H - 46);
  const { xl, yl } = pts[0];
  const ticks = (a, b) => [a, (a + b) / 2, b].map((v) => Math.round(v * 100) / 100);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="lab-chart" role="img" aria-label={`${tr(lang, yl.label)} / ${tr(lang, xl.label)}`}>
      {ticks(y0, y1).map((v) => (
        <g key={`y${v}`}>
          <line x1={pad} x2={W - 12} y1={sy(v)} y2={sy(v)} className="lab-grid-l" />
          <text x={pad - 6} y={sy(v) + 4} textAnchor="end" className="lab-svg-t">{v}</text>
        </g>
      ))}
      {ticks(x0, x1).map((v) => (
        <text key={`x${v}`} x={sx(v)} y={H - 12} textAnchor="middle" className="lab-svg-t">{v}</text>
      ))}
      <polyline points={pts.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ")} className="lab-path" />
      {pts.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r="4.5" className="lab-dot" />)}
      <text x={W - 12} y={H - 1} textAnchor="end" className="lab-svg-t">{tr(lang, xl.label)}{xl.unit && `, ${xl.unit}`}</text>
      <text x={pad} y="10" className="lab-svg-t">{tr(lang, yl.label)}{yl.unit && `, ${yl.unit}`}</text>
    </svg>
  );
}
