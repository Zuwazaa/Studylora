// Virtual laboratoriya uchun umumiy qismlar: slayder, tanlov, o'lchov ko'rsatkichlari, animatsiya taymeri.
import { useEffect, useRef, useState } from "react";

export const tr = (lang, o) => (o && typeof o === "object" ? o[lang] ?? o.uz : o);
export const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* O'lchov: { id, label:{uz,ru}, unit, value } — jadval, grafik va AI uchun bitta format */
export const m = (id, uz, ru, value, unit = "") => ({ id, label: { uz, ru }, unit, value });

export function Slider({ label, value, min, max, step = 1, unit = "", onChange, fmt }) {
  return (
    <label className="lab-slider">
      <span className="row">
        <span className="grow">{label}</span>
        <b>{fmt ? fmt(value) : value}{unit && ` ${unit}`}</b>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function Choice({ label, options, value, onChange }) {
  return (
    <div className="lab-choice">
      {label && <span>{label}</span>}
      <div className="seg">
        {options.map((o) => (
          <button key={o.value} type="button" className={o.value === value ? "on" : ""} onClick={() => onChange(o.value)}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

export function Readouts({ items, lang }) {
  return (
    <div className="lab-readouts">
      {items.map((it) => (
        <div key={it.id} className={it.accent ? "accent" : ""}>
          <small>{tr(lang, it.label)}</small>
          <b>{typeof it.value === "number" ? it.value.toLocaleString(lang === "ru" ? "ru-RU" : "uz-UZ") : it.value}{it.unit && <em> {it.unit}</em>}</b>
        </div>
      ))}
    </div>
  );
}

/* Sekundlarda o'tgan vaqt; running=false bo'lsa to'xtaydi */
export function useTicker(running) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!running) return undefined;
    let raf;
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setT((x) => x + dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);
  return [t, setT];
}

/* Kanvasli simulyatsiyalar uchun: har kadrda step(dt) chaqiradi */
export function useFrame(step, running = true) {
  const ref = useRef(step);
  ref.current = step;
  useEffect(() => {
    if (!running) return undefined;
    let raf;
    let last = performance.now();
    const loop = (now) => {
      ref.current(Math.min(0.05, (now - last) / 1000));
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);
}

/* O'lchovlarni ota komponentga faqat qiymat o'zgarganda yuboradi */
export function useReport(onState, items) {
  const key = JSON.stringify(items.map((i) => [i.id, i.value]));
  const ref = useRef(items);
  ref.current = items;
  useEffect(() => { onState?.(ref.current); }, [key, onState]);
}

/* Kanvas o'lchamini DPI ga moslaydi, chizish uchun context qaytaradi */
export function fitCanvas(canvas, w, h) {
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== w * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export const cssVar = (name, fallback) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};
