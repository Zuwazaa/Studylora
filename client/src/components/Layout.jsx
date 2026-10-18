import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, GraduationCap, BookMarked, ClipboardCheck, Layers3, AlertCircle, BarChart3, Sparkles,
  Settings, LogOut, Moon, Sun, Menu, X, Flame, FlaskConical,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import Logo from "./Logo";

const NAV = [
  { to: "/app", icon: LayoutDashboard, key: "nav.home", end: true },
  { to: "/app/ustoz", icon: GraduationCap, key: "nav.teacher" },
  { to: "/app/darsliklar", icon: BookMarked, key: "nav.library" },
  { to: "/app/testlar", icon: ClipboardCheck, key: "nav.tests" },
  { to: "/app/kartochkalar", icon: Layers3, key: "nav.cards" },
  { to: "/app/xatolar", icon: AlertCircle, key: "nav.mistakes", badge: "mistakes" },
  { to: "/app/laboratoriya", icon: FlaskConical, key: "nav.lab" },
  { to: "/app/natijalar", icon: BarChart3, key: "nav.progress" },
  { to: "/app/metodika", icon: Sparkles, key: "nav.methods" },
];

export function LangSwitch({ light = false }) {
  const { lang, setLang } = useApp();
  return (
    <div className={`lang-switch${light ? " light" : ""}`} role="group" aria-label="Til / Язык">
      {["uz", "ru"].map((l) => (
        <button key={l} className={lang === l ? "on" : ""} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
      ))}
    </div>
  );
}

export default function Layout() {
  const { t, user, data, logout, theme, setTheme } = useApp();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  useEffect(() => setOpen(false), [loc.pathname]);

  const fullBleed = /\/app\/darsliklar\/\d+\/[\w-]+/.test(loc.pathname) || /\/app\/ustoz\/kurs\//.test(loc.pathname);

  return (
    <div className={`shell${open ? " nav-open" : ""}`}>
      <aside className="sidebar">
        <div className="sb-top">
          <Logo to="/app" light />
          <button className="icon-btn sb-close" onClick={() => setOpen(false)} aria-label="Close"><X size={20} /></button>
        </div>
        <nav className="sb-nav">
          {NAV.map(({ to, icon: Icon, key, end, badge }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
              <Icon size={19} strokeWidth={1.9} />
              <span>{t(key)}</span>
              {badge === "mistakes" && data?.dueMistakes > 0 && <em className="sb-badge">{data.dueMistakes}</em>}
            </NavLink>
          ))}
        </nav>
        <div className="sb-card">
          <div className="sb-card-ring"><Flame size={18} /></div>
          <div>
            <b>{t("streak.days", { n: data?.streak ?? 0 })}</b>
            <small>{t("streak.keep")}</small>
          </div>
        </div>
        <div className="sb-bottom">
          <NavLink to="/app/sozlamalar" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
            <Settings size={19} strokeWidth={1.9} /><span>{t("nav.settings")}</span>
          </NavLink>
          <button className="sb-link" onClick={() => { logout(); nav("/"); }}>
            <LogOut size={19} strokeWidth={1.9} /><span>{t("nav.logout")}</span>
          </button>
        </div>
      </aside>
      <div className="sb-scrim" onClick={() => setOpen(false)} />

      <div className="main">
        <header className="topbar">
          <button className="icon-btn burger" onClick={() => setOpen(true)} aria-label="Menu"><Menu size={22} /></button>
          <div className="tb-hello">
            <span className="muted small">{t("tb.hello")}</span>
            <b>{user?.name?.split(" ")[0]}</b>
          </div>
          <div className="row">
            <span className="chip yellow tb-streak"><Flame size={14} />{data?.streak ?? 0}</span>
            <LangSwitch />
            <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Theme">
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button className="avatar" onClick={() => nav("/app/sozlamalar")} aria-label={t("nav.settings")}>
              {(user?.name || "?").trim().charAt(0).toUpperCase()}
            </button>
          </div>
        </header>
        <main className={`content${fullBleed ? " full" : ""}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PageHead({ title, accent, sub, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title} {accent && <span className="serif">{accent}</span>}</h1>
        {sub && <p className="muted">{sub}</p>}
      </div>
      {children && <div className="row wrap">{children}</div>}
    </div>
  );
}
