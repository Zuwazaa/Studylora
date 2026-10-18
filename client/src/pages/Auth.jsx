import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Auth as AuthApi } from "../api/client";
import { useApp } from "../context/AppContext";
import Logo from "../components/Logo";
import Iso from "../components/Iso";
import { LangSwitch } from "../components/Layout";

export default function AuthPage() {
  const { t, user, signIn, errText, lang } = useApp();
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const mode = params.get("r") ? "register" : params.get("f") ? "forgot" : "login";
  const [f, setF] = useState({ name: "", email: "", password: "", grade: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  if (user) return <Navigate to="/app" replace />;
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const switchTo = (m) => { setErr(""); setOk(""); setParams(m === "register" ? { r: "1" } : m === "forgot" ? { f: "1" } : {}); };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(""); setOk("");
    try {
      if (mode === "forgot") {
        await AuthApi.forgot(f.email);
        setOk(t("auth.forgotSent"));
      } else {
        const r = mode === "register"
          ? await AuthApi.register({ ...f, grade: Number(f.grade) || null, lang })
          : await AuthApi.login({ email: f.email, password: f.password });
        signIn(r.token, r.user);
        nav("/app");
      }
    } catch (e2) {
      setErr(errText(e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-art">
        <Logo light />
        <div className="art-stage">
          <Iso kind="books" size={150} className="float" style={{ left: "30%", top: "55%" }} />
          <Iso kind="cap" size={110} className="float" style={{ left: "66%", top: "30%", animationDelay: "-2s" }} />
          <Iso kind="test" size={120} className="float" style={{ left: "72%", top: "78%", animationDelay: "-4s" }} />
        </div>
        <h2>{t("auth.artTitle1")} <span className="serif">{t("auth.artAccent")}</span></h2>
      </div>

      <div className="auth-form">
        <form className="auth-box" onSubmit={submit}>
          <div className="auth-top"><Link to="/" className="link-btn">← {t("auth.back")}</Link><LangSwitch /></div>
          <h1>
            {mode === "register" ? t("auth.registerTitle") : mode === "forgot" ? t("auth.forgotTitle") : t("auth.loginTitle")}{" "}
            <span className="serif">{mode === "register" ? t("auth.registerAccent") : mode === "forgot" ? "" : t("auth.loginAccent")}</span>
          </h1>
          <p className="muted">{mode === "register" ? t("auth.registerSub") : mode === "forgot" ? t("auth.forgotSub") : t("auth.loginSub")}</p>

          {mode === "register" && (
            <>
              <label className="field"><span>{t("auth.name")}</span><input className="input" value={f.name} onChange={set("name")} required autoComplete="name" /></label>
              <label className="field"><span>{t("auth.grade")}</span>
                <select className="select" value={f.grade} onChange={set("grade")}>
                  <option value="">{t("auth.gradeNone")}</option>
                  {Array.from({ length: 11 }, (_, i) => <option key={i + 1} value={i + 1}>{t("grade.n", { n: i + 1 })}</option>)}
                </select>
              </label>
            </>
          )}
          <label className="field"><span>{t("auth.email")}</span><input className="input" type="email" value={f.email} onChange={set("email")} required autoComplete="email" /></label>
          {mode !== "forgot" && (
            <label className="field"><span>{t("auth.password")}</span><input className="input" type="password" value={f.password} onChange={set("password")} required minLength={6} autoComplete={mode === "register" ? "new-password" : "current-password"} /></label>
          )}
          {err && <div className="form-error">{err}</div>}
          {ok && <div className="form-ok">{ok}</div>}
          <button className="btn lg btn-green block" disabled={busy}>
            {busy ? <span className="spinner" /> : mode === "register" ? t("auth.registerBtn") : mode === "forgot" ? t("auth.forgotBtn") : t("auth.loginBtn")}
          </button>

          <div className="row wrap" style={{ justifyContent: "space-between" }}>
            {mode === "login" && <button type="button" className="link-btn" onClick={() => switchTo("forgot")}>{t("auth.forgotLink")}</button>}
            {mode !== "login" && <button type="button" className="link-btn" onClick={() => switchTo("login")}>{t("auth.haveAccount")}</button>}
            {mode !== "register" && <button type="button" className="link-btn" onClick={() => switchTo("register")}>{t("auth.noAccount")}</button>}
          </div>
        </form>
      </div>
    </div>
  );
}

export function ResetPassword() {
  const { t, errText } = useApp();
  const [params] = useSearchParams();
  const [pw, setPw] = useState("");
  const [state, setState] = useState({ busy: false, err: "", done: false });
  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, err: "", done: false });
    try {
      await AuthApi.reset({ token: params.get("token"), newPassword: pw });
      setState({ busy: false, err: "", done: true });
    } catch (e2) {
      setState({ busy: false, err: errText(e2), done: false });
    }
  };
  return (
    <div className="auth-form" style={{ minHeight: "100vh" }}>
      <form className="auth-box" onSubmit={submit}>
        <Logo />
        <h1>{t("auth.resetTitle")}</h1>
        {state.done ? (
          <><div className="form-ok">{t("auth.resetDone")}</div><Link className="btn btn-green" to="/kirish">{t("auth.loginBtn")}</Link></>
        ) : (
          <>
            <label className="field"><span>{t("auth.newPassword")}</span><input className="input" type="password" minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)} /></label>
            {state.err && <div className="form-error">{state.err}</div>}
            <button className="btn btn-green lg" disabled={state.busy}>{state.busy ? <span className="spinner" /> : t("auth.resetBtn")}</button>
          </>
        )}
      </form>
    </div>
  );
}
