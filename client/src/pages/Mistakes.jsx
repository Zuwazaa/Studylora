import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, RotateCcw, Trash2, AlertTriangle, CheckCircle2, XCircle, Play } from "lucide-react";
import { Me } from "../api/client";
import { useApp } from "../context/AppContext";
import { PageHead } from "../components/Layout";
import { InlineMd } from "../components/Markdown";
import { subjectByUz } from "../data/catalog";
import Iso from "../components/Iso";

const LETTERS = ["A", "B", "C", "D"];

// Oraliqli takrorlash: o'quvchi avval o'zi javob beradi (faol eslash), keyin natija SM-2 ga yoziladi
function ReviewSession({ items, onDone }) {
  const { t, setData, errText, toast } = useApp();
  const [i, setI] = useState(0);
  const [sel, setSel] = useState(null);
  const m = items[i];
  const correctIdx = m.options?.indexOf(m.correctAnswer) ?? -1;
  const answered = sel !== null;
  const ok = sel === correctIdx;

  const next = async () => {
    try { setData(await Me.reviewMistake(m.id, ok ? 5 : 1)); } catch (e) { toast(errText(e), "error"); }
    setSel(null);
    if (i < items.length - 1) setI(i + 1); else onDone();
  };

  return (
    <div className="card pad-lg review-session fade-up" key={m.id}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
        <span className="chip terracotta">{t("mist.reviewing")}</span>
        <span className="small muted">{i + 1} / {items.length}</span>
      </div>
      <h3 className="q-text"><InlineMd>{m.question}</InlineMd></h3>
      {m.options?.length === 4 && correctIdx >= 0 ? (
        <div className="options">
          {m.options.map((o, j) => (
            <button key={j} disabled={answered} onClick={() => setSel(j)}
              className={`opt ${answered ? (j === correctIdx ? "right" : j === sel ? "wrong" : "dim") : ""}`}>
              <span className="opt-l">{LETTERS[j]}</span><span className="grow"><InlineMd>{o}</InlineMd></span>
            </button>
          ))}
        </div>
      ) : (
        !answered && <button className="btn btn-soft" onClick={() => setSel(-2)}>{t("cards.show")}</button>
      )}
      {answered && (
        <div className={`feedback ${ok ? "ok" : "bad"}`}>
          <b>{ok ? t("mist.nowRight") : t("mist.stillWrong")}</b>
          {sel === -2 && <p><b>{t("quiz.correctAnswer")}:</b> <InlineMd>{m.correctAnswer}</InlineMd></p>}
          {m.explain && <p><InlineMd>{m.explain}</InlineMd></p>}
        </div>
      )}
      {answered && <button className="btn btn-green" style={{ marginTop: 14 }} onClick={next}>{i < items.length - 1 ? t("quiz.next") : t("quiz.finish")}</button>}
    </div>
  );
}

export default function Mistakes() {
  const { t, lang, data, setData, errText, toast } = useApp();
  const nav = useNavigate();
  const [filter, setFilter] = useState("due");
  const [session, setSession] = useState(null);
  const all = data?.mistakes || [];
  const list = filter === "due" ? all.filter((m) => m.isDue) : filter === "sure" ? all.filter((m) => m.confident) : all;

  const remove = async (id) => {
    try { setData(await Me.deleteMistake(id)); } catch (e) { toast(errText(e), "error"); }
  };

  if (session) return <ReviewSession items={session} onDone={() => setSession(null)} />;

  return (
    <div>
      <PageHead title={t("mist.title")} accent={t("mist.accent")} sub={t("mist.sub")}>
        <button className="btn btn-ghost" disabled={!all.length} onClick={() => nav("/app/testlar", { state: { fromMistakes: true } })}><RotateCcw size={16} />{t("mist.similarTest")}</button>
        <button className="btn btn-green" disabled={!data?.dueMistakes} onClick={() => setSession(all.filter((m) => m.isDue).slice(0, 15))}><Play size={16} />{t("mist.reviewNow", { n: data?.dueMistakes || 0 })}</button>
      </PageHead>

      <div className="seg" style={{ marginBottom: 18 }}>
        {[["due", data?.dueMistakes || 0], ["sure", all.filter((m) => m.confident).length], ["all", all.length]].map(([f, n]) => (
          <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>{t(`mist.f.${f}`)} · {n}</button>
        ))}
      </div>

      {list.length === 0 && (
        <div className="card empty"><Iso kind="cap" size={110} /><b>{filter === "due" ? t("mist.noneDue") : t("mist.none")}</b>{t("mist.noneSub")}</div>
      )}

      <div className="stack">
        {list.map((m) => (
          <div key={m.id} className="card mistake">
            <div className="row wrap" style={{ marginBottom: 8 }}>
              <span className="chip">{subjectByUz(m.subject, lang)}{m.grade ? ` · ${t("grade.n", { n: m.grade })}` : ""}</span>
              {m.bloom && <span className="chip green">{t(`bloom.${m.bloom}`)}</span>}
              {m.confident && <span className="chip danger"><AlertTriangle size={12} />{t("mist.confident")}</span>}
              <span className="grow" />
              <span className="small muted">{m.isDue ? t("mist.dueNow") : t("mist.dueOn", { d: new Date(m.due).toLocaleDateString(lang === "ru" ? "ru-RU" : "uz-UZ") })}</span>
            </div>
            <p className="rev-q"><InlineMd>{m.question}</InlineMd></p>
            <div className="rev-ans">
              {m.yourAnswer && <span className="bad"><XCircle size={15} /><InlineMd>{m.yourAnswer}</InlineMd></span>}
              <span className="ok"><CheckCircle2 size={15} /><InlineMd>{m.correctAnswer}</InlineMd></span>
            </div>
            {m.misconception && <p className="small"><b>{t("quiz.whyWrong")}</b> <InlineMd>{m.misconception}</InlineMd></p>}
            <div className="row wrap" style={{ marginTop: 12 }}>
              <button className="btn btn-soft sm" onClick={() => nav("/app/ustoz", { state: { mistake: m } })}><GraduationCap size={15} />{t("mist.relearn")}</button>
              <button className="btn btn-ghost sm" onClick={() => setSession([m])}><RotateCcw size={15} />{t("mist.tryAgain")}</button>
              <span className="grow" />
              <button className="icon-btn" onClick={() => remove(m.id)} aria-label="delete"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
