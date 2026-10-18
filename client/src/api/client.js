// Backend bilan ishlash. Lokalda /api Vite proxy orqali, prodda VITE_API_URL (Render) ga to'g'ridan-to'g'ri.
const DEFAULT_API = import.meta.env.PROD ? "https://studylora-api.onrender.com" : "";
// Oxiridagi "/" yoki "/api" ni olib tashlaymiz, shunda VITE_API_URL qanday yozilsa ham ishlaydi
export const API_ORIGIN = (import.meta.env.VITE_API_URL || DEFAULT_API).trim().replace(/\/+$/, "").replace(/\/api$/, "");
export const apiUrl = (p) => (p && p.startsWith("/api") ? API_ORIGIN + p : p);
const TOKEN_KEY = "studylora.token";

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (t) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* private mode */ }
};

export class ApiError extends Error {
  constructor(code, status) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export async function api(path, { method = "GET", body, signal } = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${API_ORIGIN}/api${path}`, {
      method,
      signal,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    throw new ApiError("network", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(data.error || `http_${res.status}`, res.status);
  }
  return data;
}

export const Auth = {
  login: (b) => api("/auth/login", { method: "POST", body: b }),
  register: (b) => api("/auth/register", { method: "POST", body: b }),
  me: () => api("/auth/me"),
  profile: (b) => api("/auth/profile", { method: "PATCH", body: b }),
  password: (b) => api("/auth/password", { method: "POST", body: b }),
  forgot: (email) => api("/auth/forgot-password", { method: "POST", body: { email } }),
  reset: (b) => api("/auth/reset-password", { method: "POST", body: b }),
};

export const Me = {
  data: () => api("/me/data"),
  activity: (kind) => api("/me/activity", { method: "POST", body: { kind } }),
  time: (minutes) => api("/me/time", { method: "POST", body: { minutes } }),
  goal: (goal) => api("/me/goal", { method: "PATCH", body: { goal } }),
  reviewMistake: (id, quality) => api("/me/mistakes/review", { method: "POST", body: { id, quality } }),
  deleteMistake: (id) => api(`/me/mistakes/${id}`, { method: "DELETE" }),
};

/* AI javobini bo'laklab o'qish (SSE). onText(bo'lak) har bo'lakda, oxirida yakuniy obyekt qaytadi. */
export async function apiStream(path, body, onText) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${API_ORIGIN}/api${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ ...body, stream: true }),
    });
  } catch {
    throw new ApiError("network", 0);
  }
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(data.error || `http_${res.status}`, res.status);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "", final = null;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 2);
      if (!line.startsWith("data:")) continue;
      const ev = JSON.parse(line.slice(5));
      if (ev.t) onText(ev.t);
      else if (ev.error) throw new ApiError(ev.error, 502);
      else if (ev.done) final = ev;
    }
  }
  if (!final) throw new ApiError("network", 0);
  return final;
}

export const Chats = {
  stream: (b, onText) => apiStream("/chats/send", b, onText),
  list: (key) => api(`/chats${key ? `?key=${encodeURIComponent(key)}` : ""}`),
  get: (id) => api(`/chats/${id}`),
  send: (b) => api("/chats/send", { method: "POST", body: b }),
  rename: (id, title) => api(`/chats/${id}`, { method: "PATCH", body: { title } }),
  remove: (id) => api(`/chats/${id}`, { method: "DELETE" }),
};

export const Books = {
  list: () => api("/books"),
  toc: (key) => api(`/books/${encodeURIComponent(key)}/toc`),
};

export const Courses = {
  list: () => api("/courses"),
  process: (id, lang) => api(`/courses/${id}/process`, { method: "POST", body: { lang } }),
  remove: (id) => api(`/courses/${id}`, { method: "DELETE" }),
  // PDF server orqali yopiq bucketga yuklanadi
  async upload(file, title) {
    const res = await fetch(`${API_ORIGIN}/api/courses?${new URLSearchParams({ title, fileName: file.name })}`, {
      method: "POST",
      headers: { "Content-Type": "application/pdf", Authorization: `Bearer ${getToken()}` },
      body: file,
    }).catch(() => null);
    if (!res) throw new ApiError("network", 0);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(data.error || (res.status === 413 ? "too_big" : "upload_failed"), res.status);
    return data;
  },
};

export const Quiz = {
  generate: (b) => api("/quiz/generate", { method: "POST", body: b }),
  hint: (b) => api("/quiz/hint", { method: "POST", body: b }),
  check: (b) => api("/quiz/check", { method: "POST", body: b }),
  submit: (b) => api("/quiz/submit", { method: "POST", body: b }),
};

export const Cards = {
  decks: () => api("/flashcards"),
  due: (deck, all) => api(`/flashcards/due?${new URLSearchParams({ ...(deck ? { deck } : {}), ...(all ? { all: "1" } : {}) })}`),
  generate: (b) => api("/flashcards/generate", { method: "POST", body: b }),
  review: (b) => api("/flashcards/review", { method: "POST", body: b }),
  remove: (id) => api(`/flashcards/${id}`, { method: "DELETE" }),
};

export const Pedagogy = { get: () => api("/pedagogy") };

export const Lab = { ask: (b) => api("/lab/ask", { method: "POST", body: b }) };

export const Admin = {
  stats: () => api("/admin/stats"),
  users: (q, page, signal) => api(`/admin/users?${new URLSearchParams({ q, page })}`, { signal }),
  books: (refresh) => api(`/admin/books${refresh ? "?refresh=1" : ""}`),
  async uploadBook(key, file) {
    const res = await fetch(`${API_ORIGIN}/api/admin/books/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/pdf", Authorization: `Bearer ${getToken()}` },
      body: file,
    }).catch(() => null);
    if (!res) throw new ApiError("network", 0);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(data.error || (res.status === 413 ? "too_big" : "upload_failed"), res.status);
    return data;
  },
};
