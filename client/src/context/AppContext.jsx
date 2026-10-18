import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Auth, Me, getToken, setToken, setUnauthorizedHandler } from "../api/client";
import { dictionaries } from "../i18n";

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

const read = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };
const drop = (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } };

// Oxirgi foydalanuvchi va uning ma'lumotlari keshda turadi: sayt server uyg'onishini kutmasdan darhol ochiladi
const cached = (k) => { try { return getToken() ? JSON.parse(localStorage.getItem(k) || "null") : null; } catch { return null; } };
const USER_KEY = "studylora.user", DATA_KEY = "studylora.data";

export function AppProvider({ children }) {
  const [user, setUserState] = useState(() => cached(USER_KEY));
  const [booting, setBooting] = useState(() => Boolean(getToken()) && !cached(USER_KEY));
  const [lang, setLangState] = useState(() => (read("studylora.lang", "uz") === "ru" ? "ru" : "uz"));
  const [theme, setThemeState] = useState(() => read("studylora.theme", "light"));
  const [data, setDataState] = useState(() => cached(DATA_KEY));
  const setUser = useCallback((u) => {
    setUserState((prev) => {
      const next = typeof u === "function" ? u(prev) : u;
      next ? write(USER_KEY, JSON.stringify(next)) : drop(USER_KEY);
      return next;
    });
  }, []);
  const setData = useCallback((d) => {
    setDataState((prev) => {
      const next = typeof d === "function" ? d(prev) : d;
      next ? write(DATA_KEY, JSON.stringify(next)) : drop(DATA_KEY);
      return next;
    });
  }, []);
  const [toasts, setToasts] = useState([]);

  const t = useCallback(
    (key, vars) => {
      let s = dictionaries[lang][key] ?? dictionaries.uz[key] ?? key;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
      return s;
    },
    [lang]
  );

  // API xato kodlarini foydalanuvchi tiliga o'giradi
  const errText = useCallback((e) => {
    const code = e?.code || e?.message || "server_error";
    const key = `err.${code}`;
    const s = dictionaries[lang][key] ?? dictionaries.uz[key];
    return s || (/^[a-z_]+$/.test(code) ? dictionaries[lang]["err.server_error"] : code);
  }, [lang]);

  const toast = useCallback((text, kind = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((l) => [...l, { id, text, kind }]);
    setTimeout(() => setToasts((l) => l.filter((x) => x.id !== id)), 4200);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setData(null);
  }, [setUser, setData]);

  useEffect(() => setUnauthorizedHandler(logout), [logout]);

  const refresh = useCallback(async () => {
    try { setData(await Me.data()); } catch { /* jim */ }
  }, [setData]);

  // Profil va ma'lumotlar parallel so'raladi; tarmoq xatosida keshdagi foydalanuvchi qoladi
  useEffect(() => {
    if (!getToken()) return;
    refresh();
    Auth.me()
      .then((r) => setUser(r.user))
      .catch((e) => { if (e?.status === 401 || !cached(USER_KEY)) logout(); })
      .finally(() => setBooting(false));
  }, [refresh, setUser, logout]);

  const setLang = useCallback((l) => {
    setLangState(l);
    write("studylora.lang", l);
    document.documentElement.lang = l;
    if (getToken()) Auth.profile({ lang: l }).catch(() => {});
  }, []);

  const setTheme = useCallback((th) => { setThemeState(th); write("studylora.theme", th); }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const signIn = useCallback((token, u) => {
    setToken(token);
    setUser(u);
    if (u?.lang && u.lang !== lang) setLang(u.lang);
    refresh();
  }, [lang, setLang, refresh]);

  // Faol o'qish vaqtini sanash: sahifa ko'rinib turgan va foydalanuvchi harakat qilgan har daqiqa
  const activeRef = useRef(Date.now());
  useEffect(() => {
    if (!user) return;
    const bump = () => { activeRef.current = Date.now(); };
    window.addEventListener("pointerdown", bump);
    window.addEventListener("keydown", bump);
    let minutes = 0;
    const tick = setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() - activeRef.current < 2 * 60 * 1000) minutes++;
      if (minutes >= 5) { Me.time(minutes).then(setData).catch(() => {}); minutes = 0; }
    }, 60 * 1000);
    return () => {
      clearInterval(tick);
      window.removeEventListener("pointerdown", bump);
      window.removeEventListener("keydown", bump);
    };
  }, [user]);

  const value = useMemo(
    () => ({ user, setUser, booting, lang, setLang, theme, setTheme, t, errText, data, setData, refresh, toast, signIn, logout }),
    [user, booting, lang, setLang, theme, setTheme, t, errText, data, refresh, toast, signIn, logout]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      <div className="toasts" role="status">
        {toasts.map((x) => <div key={x.id} className={`toast ${x.kind}`}>{x.text}</div>)}
      </div>
    </AppContext.Provider>
  );
}
