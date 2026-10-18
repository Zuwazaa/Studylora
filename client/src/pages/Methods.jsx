import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import SkillIcon from "../components/SkillIcon";
import { useApp } from "../context/AppContext";
import { usePedagogy } from "../components/SkillChips";
import { PageHead } from "../components/Layout";

const WHERE = {
  chat: "methods.where.chat", quiz: "methods.where.quiz", flashcards: "methods.where.cards", mistakes: "methods.where.mistakes",
  lab: "methods.where.lab",
};
const whereOf = (usedIn) => [...new Set(usedIn.map((u) => u.split(":")[0]))].filter((w) => WHERE[w]);

export default function Methods() {
  const { t, lang } = useApp();
  const ped = usePedagogy();
  const nav = useNavigate();

  return (
    <div>
      <PageHead title={t("methods.title")} accent={t("methods.accent")} sub={t("methods.sub")} />

      <div className="card green methods-hero">
        <div>
          <p className="eyebrow light">{t("methods.heroEyebrow")}</p>
          <h2>{t("methods.heroTitle", { n: ped?.skills.length ?? 14 })}</h2>
          <p className="muted">{t("methods.heroSub")}</p>
        </div>
        <button className="btn btn-yellow" onClick={() => nav("/app/ustoz")}>{t("methods.try")}</button>
      </div>

      {!ped && <div className="center" style={{ padding: 40 }}><span className="spinner lg" /></div>}

      {ped && (
        <>
          <div className="skills-grid">
            {ped.skills.map((s) => (
              <article className="skill-card card" key={s.id}>
                <div className="row">
                  <SkillIcon icon={s.icon} color={s.color} />
                  <div className="grow">
                    <h3>{s.name[lang]}</h3>
                    <small className="muted">{s.author[lang]}</small>
                  </div>
                </div>
                <p className="skill-short">{s.short[lang]}</p>
                <p className="skill-how">{s.how[lang]}</p>
                <div className="row wrap">
                  {whereOf(s.usedIn).map((w) => <span key={w} className="chip">{t(WHERE[w])}</span>)}
                </div>
              </article>
            ))}
          </div>

          <div className="card" style={{ marginTop: 22 }}>
            <div className="card-head">
              <div>
                <h3 className="card-title">{t("methods.matrix")}</h3>
                <p className="muted small">{t("methods.matrixSub")}</p>
              </div>
            </div>
            <div className="matrix-wrap">
              <table className="matrix">
                <thead>
                  <tr>
                    <th />
                    {Object.entries(ped.modes).map(([id, m]) => <th key={id}>{m.name[lang]}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {ped.skills.filter((s) => Object.values(ped.modes).some((m) => m.skills.includes(s.id))).map((s) => (
                    <tr key={s.id}>
                      <td>{s.name[lang]}</td>
                      {Object.entries(ped.modes).map(([id, m]) => (
                        <td key={id}>{m.skills.includes(s.id) && <span className={`dotc ${s.color}`}><Check size={13} /></span>}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
