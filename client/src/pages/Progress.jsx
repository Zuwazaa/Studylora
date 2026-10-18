import { useApp } from "../context/AppContext";
import { PageHead } from "../components/Layout";
import { WeekBars } from "./Dashboard";
import { subjectByUz } from "../data/catalog";

const BLOOM_ORDER = ["remember", "understand", "apply", "analyze", "evaluate", "create"];

function Heatmap({ dates = [], dayLog = [] }) {
  const { t } = useApp();
  const set = new Set(dates);
  const counts = Object.fromEntries(dayLog.map((d) => [d.d, d.n]));
  const days = Array.from({ length: 7 * 15 }, (_, i) => {
    const d = new Date(Date.now() - (7 * 15 - 1 - i) * 86400000);
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(d);
    const n = counts[key] || (set.has(key) ? 1 : 0);
    return { key, lvl: n === 0 ? 0 : n < 2 ? 1 : n < 4 ? 2 : n < 7 ? 3 : 4 };
  });
  return (
    <div>
      <div className="heat">{days.map((d) => <i key={d.key} className={`l${d.lvl}`} title={d.key} />)}</div>
      <div className="row small muted" style={{ justifyContent: "flex-end", marginTop: 8, gap: 6 }}>
        {t("prog.less")} {[0, 1, 2, 3, 4].map((l) => <i key={l} className={`heat-key l${l}`} />)} {t("prog.more")}
      </div>
    </div>
  );
}

export default function Progress() {
  const { t, lang, data } = useApp();
  const c = data?.counters || {};
  const bloom = data?.bloom || {};
  const history = data?.quizHistory || [];
  const mastery = Object.entries(data?.mastery || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <PageHead title={t("prog.title")} accent={t("prog.accent")} sub={t("prog.sub")} />
      <div className="stat-row">
        {[["streak", data?.streak ?? 0], ["tests", c.tests || 0], ["correct", c.correct || 0], ["cards", c.cards || 0], ["chat", c.chat || 0], ["minutes", c.minutes || 0]].map(([k, v]) => (
          <div className="card stat compact" key={k}><div><b>{v}</b><small>{t(`prog.c.${k}`)}</small></div></div>
        ))}
      </div>

      <div className="dash-grid">
        <div className="card wide">
          <div className="card-head"><h3 className="card-title">{t("prog.activity")}</h3></div>
          <Heatmap dates={data?.streakDates} dayLog={data?.dayLog} />
        </div>

        <div className="card">
          <div className="card-head"><h3 className="card-title">{t("prog.bloom")}</h3><span className="chip green">{t("methods.bloom")}</span></div>
          <p className="small muted" style={{ marginBottom: 12 }}>{t("prog.bloomSub")}</p>
          <div className="pyramid">
            {[...BLOOM_ORDER].reverse().map((b, i) => {
              const v = bloom[b];
              const pct = v?.total ? Math.round((v.ok / v.total) * 100) : null;
              return (
                <div key={b} className="pyr-row" style={{ width: `${46 + i * 11}%` }}>
                  <span>{t(`bloom.${b}`)}</span>
                  <b>{pct === null ? "—" : `${pct}%`}</b>
                  {pct !== null && <i style={{ width: `${pct}%` }} />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3 className="card-title">{t("prog.week")}</h3></div>
          <WeekBars dayLog={data?.dayLog} />
          <h3 className="card-title" style={{ margin: "18px 0 12px" }}>{t("dash.mastery")}</h3>
          {mastery.length === 0 && <p className="small muted">{t("dash.noResultsSub")}</p>}
          <div className="stack">
            {mastery.map(([name, pct]) => (
              <div key={name}>
                <div className="row" style={{ justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}><b>{subjectByUz(name, lang)}</b><span className="muted">{pct}%</span></div>
                <div className={`bar ${pct >= 80 ? "green" : pct >= 50 ? "" : "yellow"}`}><i style={{ width: `${pct}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="card wide">
          <div className="card-head"><h3 className="card-title">{t("prog.history")}</h3></div>
          {history.length === 0 ? <p className="small muted">{t("dash.noTests")}</p> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>{t("prog.h.subject")}</th><th>{t("prog.h.topic")}</th><th>{t("prog.h.level")}</th><th>{t("prog.h.score")}</th><th>{t("prog.h.date")}</th></tr></thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i}>
                      <td><b>{subjectByUz(h.subject, lang)}</b>{h.grade ? <span className="muted"> · {h.grade}</span> : null}</td>
                      <td className="muted">{h.topic || "—"}</td>
                      <td><span className={`chip ${h.difficulty === "hard" ? "terracotta" : h.difficulty === "easy" ? "teal" : "yellow"}`}>{t(`level.${h.difficulty || "medium"}`)}</span></td>
                      <td><b>{Math.round((h.score / h.total) * 100)}%</b> <span className="muted">({h.score}/{h.total})</span></td>
                      <td className="muted">{new Date(h.date).toLocaleDateString(lang === "ru" ? "ru-RU" : "uz-UZ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
