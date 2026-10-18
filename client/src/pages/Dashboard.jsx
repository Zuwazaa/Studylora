import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Flame, Target, Clock, CheckCircle2, Layers3, AlertCircle, GraduationCap, ClipboardCheck, BookMarked } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Cards, Me } from "../api/client";
import Iso from "../components/Iso";
import { subjectByUz } from "../data/catalog";

// Brauzerlar uz-UZ lokalini to'liq qo'llamaydi, shuning uchun nomlar qo'lda.
const WD = {
  uz: ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"],
  ru: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
};
const WD_LONG = {
  uz: ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"],
  ru: ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"],
};
const MONTHS = {
  uz: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"],
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
};
const longDate = (d, lang) => `${WD_LONG[lang][d.getDay()]}, ${d.getDate()}-${MONTHS[lang][d.getMonth()]}`.replace(/-(?=[а-я])/, " ");

function Ring({ value, max, size = 92 }) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, max ? value / max : 0);
  return (
    <svg width={size} height={size} className="ring">
      <circle cx={size / 2} cy={size / 2} r={r} className="ring-bg" />
      <circle cx={size / 2} cy={size / 2} r={r} className="ring-fg" strokeDasharray={c} strokeDashoffset={c * (1 - p)} />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle">{value}/{max}</text>
    </svg>
  );
}

export function WeekBars({ dayLog = [] }) {
  const { lang } = useApp();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(d);
    const e = dayLog.find((x) => x.d === key);
    return { key, n: e?.n || 0, m: e?.m || 0, label: WD[lang][d.getDay()] };
  });
  const max = Math.max(3, ...days.map((d) => d.n));
  return (
    <div className="week">
      {days.map((d) => (
        <div key={d.key} className="week-col" title={`${d.n} · ${d.m} min`}>
          <div className="week-bar"><i style={{ height: `${(d.n / max) * 100}%` }} /></div>
          <small>{d.label}</small>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { t, user, data, lang, setData } = useApp();
  const nav = useNavigate();
  const [cards, setCards] = useState(null);

  useEffect(() => { Cards.decks().then(setCards).catch(() => setCards({ decks: [], dueTotal: 0 })); }, []);

  const c = data?.counters || {};
  const hist = data?.quizHistory || [];
  const asked = hist.reduce((n, q) => n + q.total, 0);
  const accuracy = asked ? Math.min(100, Math.round((hist.reduce((n, q) => n + q.score, 0) / asked) * 100)) : 0;
  const goal = data?.dailyGoal ?? 3;
  const todayN = data?.today?.n || 0;
  const last = data?.quizHistory?.[0];
  const mastery = Object.entries(data?.mastery || {}).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const setGoal = async (g) => { try { setData(await Me.goal(g)); } catch { /* jim */ } };

  return (
    <div className="dash">
      <section className="card green dash-hero">
        <div className="dash-hero-copy">
          <p className="eyebrow light">{longDate(new Date(), lang)}</p>
          <h1>{t("dash.hi", { name: user?.name?.split(" ")[0] || "" })} <span className="serif">{t("dash.hiAccent")}</span></h1>
          <p className="muted">{t("dash.heroSub")}</p>
          <div className="row wrap" style={{ marginTop: 18 }}>
            <button className="btn btn-yellow" onClick={() => nav("/app/testlar")}><ClipboardCheck size={18} />{t("dash.startTest")}</button>
            <button className="btn btn-outline-light" onClick={() => nav("/app/ustoz")}><GraduationCap size={18} />{t("dash.askTeacher")}</button>
          </div>
        </div>
        <div className="dash-hero-art">
          <Iso kind="books" size={140} className="float f1" style={{ left: "35%", top: "60%" }} />
          <Iso kind="cap" size={96} className="float f2" style={{ left: "75%", top: "30%" }} />
        </div>
      </section>

      <section className="stat-row">
        <div className="card stat">
          <span className="stat-ic yellow"><Flame size={20} /></span>
          <div><b>{data?.streak ?? 0}</b><small>{t("dash.streak")}</small></div>
        </div>
        <div className="card stat">
          <span className="stat-ic teal"><CheckCircle2 size={20} /></span>
          <div><b>{c.tests || 0}</b><small>{t("dash.tests")}</small></div>
        </div>
        <div className="card stat">
          <span className="stat-ic green"><Target size={20} /></span>
          <div><b>{accuracy}%</b><small>{t("dash.accuracy")}</small></div>
        </div>
        <div className="card stat">
          <span className="stat-ic terracotta"><Clock size={20} /></span>
          <div><b>{c.minutes || 0}</b><small>{t("dash.minutes")}</small></div>
        </div>
      </section>

      <div className="dash-grid">
        <section className="card goal-card">
          <div className="card-head"><h3 className="card-title">{t("dash.goal")}</h3></div>
          <div className="row" style={{ gap: 18 }}>
            <Ring value={Math.min(todayN, goal)} max={goal} />
            <div className="grow">
              <p className="small muted">{todayN >= goal ? t("dash.goalDone") : t("dash.goalLeft", { n: goal - todayN })}</p>
              <div className="seg" style={{ marginTop: 10 }}>
                {[2, 3, 5, 8].map((g) => <button key={g} className={g === goal ? "on" : ""} onClick={() => setGoal(g)}>{g}</button>)}
              </div>
            </div>
          </div>
          <WeekBars dayLog={data?.dayLog} />
        </section>

        <section className="card">
          <div className="card-head"><h3 className="card-title">{t("dash.review")}</h3><span className="chip teal">{t("methods.spaced")}</span></div>
          <div className="stack">
            <button className="review-row" onClick={() => nav("/app/xatolar")}>
              <span className="stat-ic terracotta"><AlertCircle size={18} /></span>
              <div className="grow"><b>{t("dash.dueMistakes", { n: data?.dueMistakes || 0 })}</b><small className="muted">{t("dash.dueMistakesSub")}</small></div>
              <ArrowRight size={18} />
            </button>
            <button className="review-row" onClick={() => nav("/app/kartochkalar")}>
              <span className="stat-ic teal"><Layers3 size={18} /></span>
              <div className="grow"><b>{t("dash.dueCards", { n: cards?.dueTotal ?? "…" })}</b><small className="muted">{t("dash.dueCardsSub")}</small></div>
              <ArrowRight size={18} />
            </button>
            <button className="review-row" onClick={() => nav("/app/darsliklar")}>
              <span className="stat-ic yellow"><BookMarked size={18} /></span>
              <div className="grow"><b>{t("dash.openBook")}</b><small className="muted">{t("dash.openBookSub")}</small></div>
              <ArrowRight size={18} />
            </button>
          </div>
        </section>

        <section className="card">
          <div className="card-head"><h3 className="card-title">{t("dash.mastery")}</h3></div>
          {mastery.length === 0 && <div className="empty"><Iso kind="test" size={90} /><b>{t("dash.noResults")}</b>{t("dash.noResultsSub")}</div>}
          <div className="stack">
            {mastery.map(([name, pct]) => (
              <div key={name}>
                <div className="row" style={{ justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
                  <b>{subjectByUz(name, lang)}</b><span className="muted">{pct}%</span>
                </div>
                <div className={`bar ${pct >= 80 ? "green" : pct >= 50 ? "" : "yellow"}`}><i style={{ width: `${pct}%` }} /></div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-head"><h3 className="card-title">{t("dash.lastTest")}</h3></div>
          {!last ? (
            <div className="empty"><b>{t("dash.noTests")}</b><button className="btn btn-soft sm" style={{ marginTop: 10 }} onClick={() => nav("/app/testlar")}>{t("dash.startTest")}</button></div>
          ) : (
            <div className="stack">
              <div className="row">
                <div className="score-big">{Math.round((last.score / last.total) * 100)}%</div>
                <div className="grow">
                  <b>{subjectByUz(last.subject, lang)}{last.grade ? ` · ${t("grade.n", { n: last.grade })}` : ""}</b>
                  <p className="small muted">{last.topic}</p>
                  <span className={`chip ${last.difficulty === "hard" ? "terracotta" : last.difficulty === "easy" ? "teal" : "yellow"}`}>{t(`level.${last.difficulty || "medium"}`)}</span>
                </div>
              </div>
              <button className="btn btn-soft sm" onClick={() => nav("/app/natijalar")}>{t("dash.allResults")} <ArrowRight size={15} /></button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
