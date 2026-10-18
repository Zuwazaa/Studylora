import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, ScanLine, Layers3, BarChart3, GraduationCap, Globe2, Sparkles } from "lucide-react";
import { useApp } from "../context/AppContext";
import Logo from "../components/Logo";
import Iso from "../components/Iso";
import { LangSwitch } from "../components/Layout";
import { usePedagogy } from "../components/SkillChips";
import SkillIcon from "../components/SkillIcon";

function Orbits() {
  return (
    <svg className="hero-orbits" viewBox="0 0 1200 640" preserveAspectRatio="none" aria-hidden="true">
      <ellipse cx="600" cy="360" rx="520" ry="210" />
      <ellipse cx="600" cy="360" rx="400" ry="150" />
      <path d="M80 210 C 360 60, 820 40, 1150 170" />
      {[[160, 300], [320, 520], [980, 230], [1060, 470], [610, 150], [470, 560]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5" className="dot" />
      ))}
    </svg>
  );
}

export default function Landing() {
  const { t, user, lang } = useApp();
  const nav = useNavigate();
  const ped = usePedagogy();
  const go = () => nav(user ? "/app" : "/kirish?r=1");

  return (
    <div className="landing">
      <section className="hero">
        <header className="l-nav">
          <Logo light />
          <nav className="l-links">
            <a href="#how">{t("land.nav.how")}</a>
            <a href="#methods">{t("land.nav.methods")}</a>
            <a href="#features">{t("land.nav.features")}</a>
          </nav>
          <div className="row">
            <LangSwitch light />
            {user ? (
              <Link to="/app" className="btn sm btn-outline-light">{t("land.cabinet")}</Link>
            ) : (
              <>
                <Link to="/kirish" className="l-login">{t("land.login")}</Link>
                <Link to="/kirish?r=1" className="btn sm btn-outline-light">{t("land.start")}</Link>
              </>
            )}
          </div>
        </header>

        <div className="hero-stage">
          <Orbits />
          <Iso kind="books" size={128} className="float f1" style={{ left: "13%", top: "52%" }} />
          <Iso kind="cap" size={96} className="float f2" style={{ left: "21%", top: "14%" }} />
          <Iso kind="test" size={118} className="float f3" style={{ left: "29%", top: "74%" }} />
          <Iso kind="flask" size={74} className="float f4" style={{ left: "49%", top: "78%" }} />
          <Iso kind="calc" size={98} className="float f2" style={{ left: "75%", top: "18%" }} />
          <Iso kind="pencil" size={104} className="float f1" style={{ left: "66%", top: "70%" }} />
          <Iso kind="globe" size={88} className="float f3" style={{ left: "84%", top: "52%" }} />

          <div className="hero-copy fade-up">
            <p className="hero-eyebrow">{t("land.eyebrow")}</p>
            <h1>
              {t("land.title1")} <span className="serif">{t("land.titleAccent")}</span> {t("land.title2")}
            </h1>
            <p className="hero-sub">{t("land.sub")}</p>
            <button className="btn lg btn-yellow" onClick={go}>{t("land.cta")} <ArrowRight size={18} /></button>
          </div>
        </div>
      </section>

      <section className="l-stats">
        {[["1–11", "land.stat.grades"], ["14", "land.stat.methods"], ["3", "land.stat.levels"], ["UZ · RU", "land.stat.langs"]].map(([n, k]) => (
          <div key={k}><b>{n}</b><span>{t(k)}</span></div>
        ))}
      </section>

      <section className="l-section" id="how">
        <p className="eyebrow">{t("land.how.eyebrow")}</p>
        <h2>{t("land.how.title1")} <span className="serif">{t("land.how.titleAccent")}</span></h2>
        <div className="how-grid">
          {[
            ["books", "land.how.s1", "land.how.s1d"],
            ["test", "land.how.s2", "land.how.s2d"],
            ["globe", "land.how.s3", "land.how.s3d"],
          ].map(([kind, h, d], i) => (
            <div className="how-card" key={h}>
              <span className="how-num">0{i + 1}</span>
              <Iso kind={kind} size={130} />
              <h3>{t(h)}</h3>
              <p className="muted">{t(d)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="l-methods" id="methods">
        <div className="l-methods-inner">
          <p className="eyebrow light">{t("land.methods.eyebrow")}</p>
          <h2>{t("land.methods.title1")} <span className="serif">{t("land.methods.titleAccent")}</span></h2>
          <p className="l-methods-sub">{t("land.methods.sub")}</p>
          <div className="m-grid">
            {(ped?.skills || []).map((s) => (
              <div className="m-card" key={s.id}>
                <SkillIcon icon={s.icon} color={s.color} />
                <b>{s.name[lang]}</b>
                <small>{s.author[lang]}</small>
                <p>{s.short[lang]}</p>
              </div>
            ))}
            {!ped && Array.from({ length: 8 }, (_, i) => <div className="m-card skeleton" key={i} />)}
          </div>
        </div>
      </section>

      <section className="l-section" id="features">
        <p className="eyebrow">{t("land.feat.eyebrow")}</p>
        <h2>{t("land.feat.title1")} <span className="serif">{t("land.feat.titleAccent")}</span></h2>
        <div className="feat-grid">
          {[
            [GraduationCap, "teal", "land.feat.teacher", "land.feat.teacherD"],
            [ScanLine, "yellow", "land.feat.reader", "land.feat.readerD"],
            [BookOpen, "terracotta", "land.feat.tests", "land.feat.testsD"],
            [Globe2, "green", "land.feat.hard", "land.feat.hardD"],
            [Layers3, "teal", "land.feat.cards", "land.feat.cardsD"],
            [BarChart3, "yellow", "land.feat.progress", "land.feat.progressD"],
          ].map(([Icon, c, h, d]) => (
            <div className="feat" key={h}>
              <span className={`feat-ic ${c}`}><Icon size={22} /></span>
              <h3>{t(h)}</h3>
              <p className="muted">{t(d)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="l-cta">
        <Iso kind="bulb" size={110} />
        <div>
          <h2>{t("land.cta2.title")} <span className="serif">{t("land.cta2.accent")}</span></h2>
          <p>{t("land.cta2.sub")}</p>
        </div>
        <button className="btn lg btn-yellow" onClick={go}><Sparkles size={18} />{t("land.cta")}</button>
      </section>

      <footer className="l-foot">
        <Logo />
        <span className="muted small">© {new Date().getFullYear()} Studylora · {t("land.foot")}</span>
      </footer>
    </div>
  );
}
