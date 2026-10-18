import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { Users, UserPlus, Activity, ClipboardCheck, MessageSquare, BookMarked, Layers3, Clock, AlertCircle, Search, Upload, RefreshCw } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Admin as AdminApi } from "../api/client";
import { PageHead } from "../components/Layout";
import { subjectName } from "../data/catalog";

function Overview() {
  const { t, errText } = useApp();
  const [s, setS] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { AdminApi.stats().then(setS).catch((e) => setErr(errText(e))); }, [errText]);
  if (err) return <div className="card empty"><p>{err}</p></div>;
  if (!s) return <div className="center" style={{ padding: 60 }}><span className="spinner lg" /></div>;

  const tiles = [
    [Users, "green", s.users, "adm.users"],
    [UserPlus, "teal", s.newWeek, "adm.newWeek"],
    [Activity, "yellow", s.activeToday, "adm.activeToday"],
    [Activity, "teal", s.activeWeek, "adm.activeWeek"],
    [ClipboardCheck, "green", s.tests, "adm.tests"],
    [MessageSquare, "yellow", s.chatMessages, "adm.chatMessages"],
    [BookMarked, "terracotta", s.courses, "adm.courses"],
    [Layers3, "teal", s.decks, "adm.decks"],
    [AlertCircle, "terracotta", s.mistakes, "adm.mistakesTotal"],
    [Clock, "green", Math.round(s.minutes / 60), "adm.hours"],
  ];
  const max = Math.max(1, ...s.signups.map((d) => d.n));
  return (
    <>
      <div className="stat-row">
        {tiles.map(([Icon, tone, v, k]) => (
          <div className="card stat" key={k}>
            <span className={`stat-ic ${tone}`}><Icon size={20} /></span>
            <div><b>{v.toLocaleString()}</b><small>{t(k)}</small></div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-head"><h3 className="card-title">{t("adm.signups")}</h3><span className="chip green">{t("adm.days14")}</span></div>
        <div className="week adm-bars">
          {s.signups.map((d) => (
            <div key={d.d} className="week-col" title={`${d.d}: ${d.n}`}>
              <div className="week-bar"><i style={{ height: `${(d.n / max) * 100}%` }} /></div>
              <small>{d.d.slice(8)}</small>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function UsersTab() {
  const { t, errText } = useApp();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [r, setR] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const ctl = new AbortController();
    const id = setTimeout(() => {
      AdminApi.users(q, page, ctl.signal).then((x) => { setR(x); setErr(""); }).catch((e) => { if (e.name !== "AbortError") setErr(errText(e)); });
    }, 250);
    return () => { clearTimeout(id); ctl.abort(); };
  }, [q, page, errText]);

  return (
    <div className="card">
      <div className="card-head">
        <h3 className="card-title">{t("adm.usersTitle")} {r && <span className="muted small">({r.total})</span>}</h3>
        <label className="adm-search">
          <Search size={16} />
          <input className="input" value={q} placeholder={t("adm.searchPh")} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </label>
      </div>
      {err && <p className="form-error">{err}</p>}
      {!r ? <div className="center" style={{ padding: 40 }}><span className="spinner" /></div> : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("adm.name")}</th><th>{t("auth.email")}</th><th>{t("auth.grade")}</th>
                  <th>{t("adm.joined")}</th><th>{t("adm.lastActive")}</th>
                  <th>{t("adm.streak")}</th><th>{t("adm.tests")}</th><th>{t("adm.chat")}</th><th>{t("adm.mistakes")}</th>
                </tr>
              </thead>
              <tbody>
                {r.users.map((u) => (
                  <tr key={u.id}>
                    <td><b>{u.name}</b> <span className="chip">{u.lang}</span></td>
                    <td>{u.email}</td>
                    <td>{u.grade || "—"}</td>
                    <td>{new Date(u.createdAt).toISOString().slice(0, 10)}</td>
                    <td>{u.lastActive || "—"}</td>
                    <td>{u.streak}</td><td>{u.tests}</td><td>{u.chat}</td><td>{u.mistakes}</td>
                  </tr>
                ))}
                {!r.users.length && <tr><td colSpan={9} className="muted">{t("adm.noUsers")}</td></tr>}
              </tbody>
            </table>
          </div>
          {r.pages > 1 && (
            <div className="row adm-pager">
              <button className="btn btn-ghost sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
              <span className="small muted">{page} / {r.pages}</span>
              <button className="btn btn-ghost sm" disabled={page >= r.pages} onClick={() => setPage(page + 1)}>›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BooksTab() {
  const { t, lang, toast, errText } = useApp();
  const [r, setR] = useState(null);
  const [filter, setFilter] = useState("missing");
  const [busy, setBusy] = useState("");
  const fileRef = useRef(null);
  const target = useRef(null);

  const load = (refresh) => AdminApi.books(refresh).then(setR).catch((e) => toast(errText(e), "error"));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = useMemo(() => {
    const b = r?.books || [];
    return { all: b.length, missing: b.filter((x) => !x.source).length, r2: b.filter((x) => x.source === "r2").length, legacy: b.filter((x) => x.source === "legacy").length };
  }, [r]);
  const list = (r?.books || []).filter((b) => filter === "all" || (filter === "missing" ? !b.source : b.source === filter));

  const pick = (key) => { target.current = key; fileRef.current?.click(); };
  const upload = async (file) => {
    const key = target.current;
    if (!file || !key) return;
    setBusy(key);
    try {
      await AdminApi.uploadBook(key, file);
      toast(t("adm.uploaded"), "ok");
      await load(true);
    } catch (e) { toast(errText(e), "error"); }
    setBusy("");
  };

  if (!r) return <div className="center" style={{ padding: 60 }}><span className="spinner lg" /></div>;
  return (
    <div className="card">
      <div className="card-head">
        <div className="seg">
          {["missing", "r2", "legacy", "all"].map((f) => (
            <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>{t(`adm.f.${f}`)} · {counts[f]}</button>
          ))}
        </div>
        <button className="btn btn-ghost sm" onClick={() => load(true)}><RefreshCw size={15} />{t("adm.refresh")}</button>
      </div>
      {!r.r2 && <p className="form-error">{t("adm.noR2")}</p>}
      <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>{t("auth.grade")}</th><th>{t("adm.subject")}</th><th>{t("adm.status")}</th><th>{t("adm.text")}</th><th /></tr></thead>
          <tbody>
            {list.map((b) => (
              <tr key={b.key}>
                <td>{b.grade}</td>
                <td><b>{subjectName(b.subject, lang)}</b> <span className="muted small">{b.key}</span></td>
                <td>
                  {b.source === "r2" && <span className="chip green">{t("adm.f.r2")}</span>}
                  {b.source === "legacy" && <span className="chip yellow">{t("adm.f.legacy")}</span>}
                  {!b.source && <span className="chip danger">{t("adm.f.missing")}</span>}
                </td>
                <td className="small muted">
                  {!b.text ? "—" : b.text.status === "ready" ? t("adm.textReady", { n: b.text.numPages }) + (b.text.scanned ? ` · ${t("adm.scanned")}` : "") : b.text.status}
                </td>
                <td>
                  <button className="btn btn-soft sm" disabled={!r.r2 || Boolean(busy)} onClick={() => pick(b.key)}>
                    {busy === b.key ? <span className="spinner" /> : <><Upload size={15} />{b.source ? t("adm.replace") : t("adm.upload")}</>}
                  </button>
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={5} className="muted">{t("adm.noBooks")}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const TABS = { overview: Overview, users: UsersTab, books: BooksTab };

export default function Admin() {
  const { t, user } = useApp();
  const [tab, setTab] = useState("overview");
  if (!user?.isAdmin) return <Navigate to="/app" replace />;
  const Tab = TABS[tab];
  return (
    <div className="admin">
      <PageHead title={t("adm.title")} accent={t("adm.accent")} sub={t("adm.sub")}>
        <div className="seg">
          {Object.keys(TABS).map((k) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{t(`adm.tab.${k}`)}</button>)}
        </div>
      </PageHead>
      <Tab />
    </div>
  );
}
