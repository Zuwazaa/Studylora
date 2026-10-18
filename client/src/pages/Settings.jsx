import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "../api/client";
import { useApp } from "../context/AppContext";
import { PageHead } from "../components/Layout";

export default function Settings() {
  const { t, user, setUser, lang, setLang, theme, setTheme, logout, toast, errText } = useApp();
  const nav = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [grade, setGrade] = useState(String(user?.grade || ""));
  const [pw, setPw] = useState({ oldPassword: "", newPassword: "" });
  const [busy, setBusy] = useState("");

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusy("p");
    try {
      const r = await Auth.profile({ name, grade: Number(grade) || null });
      setUser(r.user);
      toast(t("set.saved"), "ok");
    } catch (e2) { toast(errText(e2), "error"); }
    setBusy("");
  };
  const savePw = async (e) => {
    e.preventDefault();
    setBusy("w");
    try {
      await Auth.password(pw);
      setPw({ oldPassword: "", newPassword: "" });
      toast(t("set.pwChanged"), "ok");
    } catch (e2) { toast(errText(e2), "error"); }
    setBusy("");
  };

  return (
    <div className="settings">
      <PageHead title={t("set.title")} accent={t("set.accent")} />
      <div className="settings-grid">
        <form className="card pad-lg stack" onSubmit={saveProfile}>
          <h3 className="card-title">{t("set.profile")}</h3>
          <label className="field"><span>{t("auth.name")}</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} required /></label>
          <label className="field"><span>{t("auth.email")}</span><input className="input" value={user?.email || ""} disabled /></label>
          <label className="field"><span>{t("auth.grade")}</span>
            <select className="select" value={grade} onChange={(e) => setGrade(e.target.value)}>
              <option value="">{t("auth.gradeNone")}</option>
              {Array.from({ length: 11 }, (_, i) => <option key={i + 1} value={i + 1}>{t("grade.n", { n: i + 1 })}</option>)}
            </select>
          </label>
          <button className="btn btn-green" disabled={busy === "p"}>{busy === "p" ? <span className="spinner" /> : t("set.save")}</button>
        </form>

        <div className="stack">
          <div className="card pad-lg stack">
            <h3 className="card-title">{t("set.look")}</h3>
            <div className="field"><span>{t("set.lang")}</span>
              <div className="seg"><button className={lang === "uz" ? "on" : ""} onClick={() => setLang("uz")}>O'zbekcha</button><button className={lang === "ru" ? "on" : ""} onClick={() => setLang("ru")}>Русский</button></div>
            </div>
            <div className="field"><span>{t("set.theme")}</span>
              <div className="seg"><button className={theme === "light" ? "on" : ""} onClick={() => setTheme("light")}>{t("set.light")}</button><button className={theme === "dark" ? "on" : ""} onClick={() => setTheme("dark")}>{t("set.dark")}</button></div>
            </div>
          </div>

          <form className="card pad-lg stack" onSubmit={savePw}>
            <h3 className="card-title">{t("set.password")}</h3>
            <label className="field"><span>{t("set.oldPw")}</span><input className="input" type="password" value={pw.oldPassword} onChange={(e) => setPw((s) => ({ ...s, oldPassword: e.target.value }))} required autoComplete="current-password" /></label>
            <label className="field"><span>{t("auth.newPassword")}</span><input className="input" type="password" minLength={6} value={pw.newPassword} onChange={(e) => setPw((s) => ({ ...s, newPassword: e.target.value }))} required autoComplete="new-password" /></label>
            <button className="btn btn-ghost" disabled={busy === "w"}>{busy === "w" ? <span className="spinner" /> : t("set.changePw")}</button>
          </form>
          <button className="btn btn-danger" onClick={() => { logout(); nav("/"); }}>{t("nav.logout")}</button>
        </div>
      </div>
    </div>
  );
}
