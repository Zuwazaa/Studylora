import SubjectPicker from "../components/SubjectPicker";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Plus, Trash2, Play, Layers3, Sparkles } from "lucide-react";
import { Cards } from "../api/client";
import { useApp } from "../context/AppContext";
import { GRADES, subjectsOf, bookKey as makeKey } from "../data/catalog";
import { useBooks } from "../lib/useBooks";
import { PageHead } from "../components/Layout";
import Markdown from "../components/Markdown";
import Iso from "../components/Iso";

function NewDeck({ preset, onCreated, onClose }) {
  const { t, lang, user, errText, toast } = useApp();
  const books = useBooks();
  const fromKey = preset?.bookKey?.split("-");
  const [grade, setGrade] = useState(fromKey?.[0] || String(user?.grade || 9));
  const [subjectId, setSubjectId] = useState(fromKey ? fromKey.slice(1).join("-") : subjectsOf(grade)[0].id);
  const [topic, setTopic] = useState("");
  const [from, setFrom] = useState(preset?.from ? String(preset.from) : "");
  const [to, setTo] = useState(preset?.to ? String(preset.to) : "");
  const [count, setCount] = useState(12);
  const [busy, setBusy] = useState(false);
  const key = makeKey(grade, subjectId);

  const create = async () => {
    setBusy(true);
    try {
      const subj = subjectsOf(grade).find((s) => s.id === subjectId);
      const body = preset?.courseId
        ? { courseId: preset.courseId, from: Number(from) || undefined, to: Number(to) || undefined, topic, count, lang }
        : { grade, subject: subj?.uz, bookKey: books?.[key] ? key : undefined, from: Number(from) || undefined, to: Number(to) || undefined, topic, count, lang };
      const r = await Cards.generate(body);
      onCreated(r.deck);
    } catch (e) {
      toast(errText(e), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="card-title">{t("cards.new")}</h3>
        <p className="small muted" style={{ margin: "4px 0 16px" }}>{t("cards.newSub")}</p>
        <div className="stack">
          {!preset?.courseId && (
            <div className="form-grid">
              <label className="field"><span>{t("quiz.grade")}</span>
                <select className="select" value={grade} onChange={(e) => { setGrade(e.target.value); setSubjectId(subjectsOf(e.target.value)[0].id); }}>
                  {Object.keys(GRADES).map((g) => <option key={g} value={g}>{t("grade.n", { n: g })}</option>)}
                </select>
              </label>
              <div className="field"><span>{t("quiz.subject")}</span>
                <SubjectPicker grade={grade} value={subjectId} onChange={setSubjectId} books={books} />
              </div>
            </div>
          )}
          <label className="field"><span>{t("quiz.topicOptional")}</span><input className="input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={t("quiz.topicPh")} /></label>
          {(books?.[key] || preset?.courseId) && (
            <div className="field"><span>{t("cards.pages")}</span>
              <div className="row">
                <input className="input" inputMode="numeric" placeholder={t("quiz.from")} value={from} onChange={(e) => setFrom(e.target.value.replace(/\D/g, ""))} />
                <span>—</span>
                <input className="input" inputMode="numeric" placeholder={t("quiz.to")} value={to} onChange={(e) => setTo(e.target.value.replace(/\D/g, ""))} />
              </div>
            </div>
          )}
          <div className="field"><span>{t("quiz.count")}</span>
            <div className="seg">{[8, 12, 20].map((n) => <button key={n} className={count === n ? "on" : ""} onClick={() => setCount(n)}>{n}</button>)}</div>
          </div>
          <div className="row" style={{ justifyContent: "flex-end", marginTop: 6 }}>
            <button className="btn btn-ghost" onClick={onClose}>{t("common.cancel")}</button>
            <button className="btn btn-green" onClick={create} disabled={busy}>{busy ? <span className="spinner" /> : <><Sparkles size={16} />{t("cards.create")}</>}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Study({ cards, onDone }) {
  const { t, errText, toast } = useApp();
  const [i, setI] = useState(0);
  const [show, setShow] = useState(false);
  const c = cards[i];

  const rate = async (quality) => {
    try { await Cards.review({ deckId: c.deckId, cardId: c.id, quality }); } catch (e) { toast(errText(e), "error"); }
    setShow(false);
    if (i < cards.length - 1) setI(i + 1);
    else onDone();
  };

  return (
    <div className="study">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <span className="small muted">{c.deckTitle}</span>
        <span className="small muted">{i + 1} / {cards.length}</span>
      </div>
      <div className="bar green" style={{ marginBottom: 18 }}><i style={{ width: `${(i / cards.length) * 100}%` }} /></div>
      <div className={`flip${show ? " back" : ""}`} onClick={() => setShow(true)}>
        <div className="flip-face front">
          <span className="eyebrow">{t("cards.question")}</span>
          <Markdown>{c.front}</Markdown>
          {!show && <span className="small muted flip-hint">{t("cards.recall")}</span>}
        </div>
        {show && (
          <div className="flip-face answer fade-up">
            <span className="eyebrow">{t("cards.answer")}</span>
            <Markdown>{c.back}</Markdown>
          </div>
        )}
      </div>
      {show ? (
        <div className="rate">
          <button className="rate-btn again" onClick={() => rate(1)}><b>{t("cards.again")}</b><small>{t("cards.in1")}</small></button>
          <button className="rate-btn hard" onClick={() => rate(3)}><b>{t("cards.hard")}</b></button>
          <button className="rate-btn good" onClick={() => rate(4)}><b>{t("cards.good")}</b></button>
          <button className="rate-btn easy" onClick={() => rate(5)}><b>{t("cards.easy")}</b></button>
        </div>
      ) : (
        <button className="btn btn-green lg block" style={{ marginTop: 18 }} onClick={() => setShow(true)}>{t("cards.show")}</button>
      )}
      <p className="small muted" style={{ textAlign: "center", marginTop: 14 }}>{t("cards.sm2")}</p>
    </div>
  );
}

export default function Flashcards() {
  const { t } = useApp();
  const loc = useLocation();
  const [decks, setDecks] = useState(null);
  const [dueTotal, setDueTotal] = useState(0);
  const [creating, setCreating] = useState(Boolean(loc.state?.preset));
  const [study, setStudy] = useState(null);

  const load = () => Cards.decks().then((r) => { setDecks(r.decks); setDueTotal(r.dueTotal); }).catch(() => setDecks([]));
  useEffect(() => { load(); }, []);

  const startStudy = async (deckId, all = false) => {
    const r = await Cards.due(deckId, all).catch(() => ({ cards: [] }));
    if (r.cards.length) setStudy(r.cards);
  };
  const remove = async (id) => {
    if (!window.confirm(t("cards.confirmDelete"))) return;
    await Cards.remove(id).catch(() => {});
    load();
  };

  if (study) return <Study cards={study} onDone={() => { setStudy(null); load(); }} />;

  return (
    <div>
      <PageHead title={t("cards.title")} accent={t("cards.accent")} sub={t("cards.sub")}>
        <button className="btn btn-green" onClick={() => setCreating(true)}><Plus size={17} />{t("cards.new")}</button>
      </PageHead>

      <div className="card green due-hero">
        <Iso kind="calc" size={110} />
        <div className="grow">
          <h2>{t("cards.dueToday", { n: dueTotal })}</h2>
          <p className="muted">{t("cards.dueSub")}</p>
        </div>
        <button className="btn btn-yellow" disabled={!dueTotal} onClick={() => startStudy()}><Play size={17} />{t("cards.studyAll")}</button>
      </div>

      {decks === null && <div className="center" style={{ padding: 40 }}><span className="spinner lg" /></div>}
      {decks?.length === 0 && (
        <div className="card empty"><Layers3 size={40} /><b>{t("cards.empty")}</b>{t("cards.emptySub")}</div>
      )}
      <div className="deck-grid">
        {decks?.map((d) => (
          <div key={d.id} className="card deck">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="chip teal">{t("cards.nCards", { n: d.total })}</span>
              <button className="icon-btn" onClick={() => remove(d.id)} aria-label="delete"><Trash2 size={16} /></button>
            </div>
            <h3>{d.title}</h3>
            <p className="small muted">{[d.subject, d.grade && t("grade.n", { n: d.grade }), d.source].filter(Boolean).join(" · ")}</p>
            <div className="row" style={{ marginTop: "auto" }}>
              <button className="btn btn-green sm" disabled={!d.due} onClick={() => startStudy(d.id)}>{t("cards.studyDue", { n: d.due })}</button>
              <button className="btn btn-ghost sm" onClick={() => startStudy(d.id, true)}>{t("cards.studyAllDeck")}</button>
            </div>
          </div>
        ))}
      </div>

      {creating && (
        <NewDeck
          preset={loc.state?.preset}
          onClose={() => setCreating(false)}
          onCreated={() => { setCreating(false); load(); }}
        />
      )}
    </div>
  );
}
