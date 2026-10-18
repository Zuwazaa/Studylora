import { useEffect, useRef, useState } from "react";
import { Play, RotateCcw, Droplet, Flame as FlameIcon } from "lucide-react";
import { Slider, Choice, Readouts, useFrame, useReport, useTicker, m, round, tr, clamp, fitCanvas } from "../kit";

/* ---------- Kislota-asos titrlash ---------- */
const INDICATORS = [
  { value: "universal", label: { uz: "Universal", ru: "Универсальный" } },
  { value: "phenol", label: { uz: "Fenolftalein", ru: "Фенолфталеин" } },
  { value: "methyl", label: { uz: "Metiloranj", ru: "Метилоранж" } },
];

// pH bo'yicha universal indikator rangi (qizil → sariq → yashil → ko'k → binafsha)
const universalColor = (pH) => `hsl(${clamp(pH, 0, 14) <= 7 ? (pH / 7) * 120 : 120 + ((pH - 7) / 7) * 160} 75% 52%)`;
function colorOf(ind, pH) {
  if (ind === "phenol") return pH < 8.2 ? "rgba(255,255,255,0.35)" : `hsla(320 80% 60% / ${clamp((pH - 8.2) / 1.8, 0.2, 1)})`;
  if (ind === "methyl") return pH < 3.1 ? "hsl(0 75% 52%)" : pH > 4.4 ? "hsl(45 95% 55%)" : "hsl(20 85% 55%)";
  return universalColor(pH);
}

const ACID_ML = 25, C = 0.1;
export const phAt = (base) => {
  const nA = (C * ACID_ML) / 1000, nB = (C * base) / 1000, Vt = (ACID_ML + base) / 1000;
  if (Math.abs(nA - nB) < 1e-9) return 7;
  return nA > nB ? -Math.log10((nA - nB) / Vt) : 14 + Math.log10((nB - nA) / Vt);
};

export function Titration({ lang, onState }) {
  const [base, setBase] = useState(0);
  const [ind, setInd] = useState("universal");
  const pH = phAt(base);
  const fill = (ACID_ML + base) / 80;
  const items = [
    m("V", "Qo'shilgan NaOH", "Добавлено NaOH", round(base, 1), "ml"),
    m("ind", "Indikator", "Индикатор", tr(lang, INDICATORS.find((i) => i.value === ind).label)),
    { ...m("pH", "pH", "pH", round(pH, 2)), accent: true },
    { ...m("env", "Muhit", "Среда", pH < 6.9 ? tr(lang, { uz: "kislotali", ru: "кислая" }) : pH > 7.1 ? tr(lang, { uz: "ishqoriy", ru: "щелочная" }) : tr(lang, { uz: "neytral", ru: "нейтральная" })), accent: true },
  ];
  useReport(onState, items);
  const add = (d) => setBase((b) => clamp(round(b + d, 1), 0, 50));

  return (
    <div className="lab-sim">
      <svg viewBox="0 0 440 300" className="lab-svg" role="img" aria-label="titration">
        {/* byuretka */}
        <rect x="205" y="6" width="30" height="150" rx="4" className="lab-glass" />
        <rect x="208" y={10 + (base / 50) * 140} width="24" height={140 - (base / 50) * 140} className="lab-liquid-clear" />
        <path d="M212 156 L228 156 L222 178 L218 178 Z" className="lab-metal" />
        <text x="245" y="30" className="lab-svg-t">NaOH 0,1 M</text>
        {/* kolba */}
        <path d="M195 190 L195 215 L140 285 L300 285 L245 215 L245 190 Z" className="lab-glass" />
        <clipPath id="flask"><path d="M195 190 L195 215 L140 285 L300 285 L245 215 L245 190 Z" /></clipPath>
        <rect x="130" y={285 - 70 * Math.min(1, fill * 1.4)} width="180" height="80" clipPath="url(#flask)" style={{ fill: colorOf(ind, pH), transition: "fill .4s" }} />
        <text x="320" y="270" className="lab-svg-t">HCl 25 ml, 0,1 M</text>
        <text x="320" y="240" className="lab-svg-b">pH {pH.toFixed(2)}</text>
      </svg>
      <div className="lab-controls">
        <Slider label={tr(lang, { uz: "Qo'shilgan NaOH", ru: "Добавлено NaOH" })} value={base} min={0} max={50} step={0.1} unit="ml" onChange={setBase} fmt={(v) => v.toFixed(1)} />
        <div className="row wrap">
          <button className="btn btn-soft sm" onClick={() => add(0.1)}><Droplet size={15} />+0,1 ml</button>
          <button className="btn btn-soft sm" onClick={() => add(1)}><Droplet size={15} />+1 ml</button>
          <button className="btn btn-soft sm" onClick={() => add(5)}><Droplet size={15} />+5 ml</button>
          <button className="btn btn-soft sm" onClick={() => setBase(0)}><RotateCcw size={15} /></button>
        </div>
        <Choice label={tr(lang, { uz: "Indikator", ru: "Индикатор" })} value={ind} onChange={setInd} options={INDICATORS.map((i) => ({ value: i.value, label: tr(lang, i.label) }))} />
      </div>
      <Readouts lang={lang} items={items.filter((i) => i.accent)} />
    </div>
  );
}

/* ---------- Reaksiya tezligi (to'qnashuvlar nazariyasi) ---------- */
const BOX_W = 440, BOX_H = 250, PR = 6;

function makeParticles(n) {
  const ps = [];
  for (let i = 0; i < n * 2; i++) {
    const ang = Math.random() * Math.PI * 2;
    ps.push({ x: PR + Math.random() * (BOX_W - 2 * PR), y: PR + Math.random() * (BOX_H - 2 * PR), dx: Math.cos(ang), dy: Math.sin(ang), k: i % 2 ? "B" : "A", alive: true });
  }
  return ps;
}

export function Rates({ lang, onState }) {
  const [temp, setTemp] = useState(300);
  const [n, setN] = useState(20);
  const [cat, setCat] = useState("no");
  const [run, setRun] = useState(false);
  const [stats, setStats] = useState({ t: 0, made: 0, half: null });
  const canvas = useRef(null);
  const sim = useRef({ ps: makeParticles(20), t: 0, made: 0, half: null, touching: new Set() });

  const reset = (nn = n) => {
    sim.current = { ps: makeParticles(nn), t: 0, made: 0, half: null, touching: new Set() };
    setStats({ t: 0, made: 0, half: null });
    setRun(false);
  };

  const Ea = cat === "yes" ? 450 : 900;
  const p = Math.exp(-Ea / temp); // to'qnashuvda reaksiyaga kirish ehtimoli
  const speed = 45 * Math.sqrt(temp / 100);

  const draw = () => {
    const c = canvas.current;
    if (!c) return;
    const ctx = fitCanvas(c, BOX_W, BOX_H);
    ctx.clearRect(0, 0, BOX_W, BOX_H);
    for (const q of sim.current.ps) {
      if (!q.alive) continue;
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.k === "C" ? PR + 2 : PR, 0, Math.PI * 2);
      ctx.fillStyle = q.k === "A" ? "#5bc0af" : q.k === "B" ? "#d3997f" : "#f9d965";
      ctx.fill();
    }
  };
  useEffect(draw);

  useFrame((dt) => {
    const s = sim.current;
    s.t += dt;
    for (const q of s.ps) {
      if (!q.alive) continue;
      q.x += q.dx * speed * dt; q.y += q.dy * speed * dt;
      if (q.x < PR || q.x > BOX_W - PR) { q.dx *= -1; q.x = clamp(q.x, PR, BOX_W - PR); }
      if (q.y < PR || q.y > BOX_H - PR) { q.dy *= -1; q.y = clamp(q.y, PR, BOX_H - PR); }
    }
    // A + B to'qnashsa — energiyasi yetarli bo'lsa C hosil bo'ladi
    const now = new Set();
    const As = s.ps.filter((q) => q.alive && q.k === "A");
    const Bs = s.ps.filter((q) => q.alive && q.k === "B");
    for (const a of As) {
      for (const b of Bs) {
        if (!b.alive || !a.alive || a.k !== "A") continue;
        if (Math.abs(a.x - b.x) > 2 * PR || Math.abs(a.y - b.y) > 2 * PR) continue;
        const key = `${s.ps.indexOf(a)}-${s.ps.indexOf(b)}`;
        now.add(key);
        if (s.touching.has(key)) continue;
        if (Math.random() < p) {
          a.k = "C"; b.alive = false; s.made += 1;
          if (s.half == null && s.made >= n / 2) s.half = s.t;
        }
      }
    }
    s.touching = now;
    draw();
    if (Math.floor(s.t * 5) !== Math.floor((s.t - dt) * 5)) setStats({ t: s.t, made: s.made, half: s.half });
    if (s.made >= n) setRun(false);
  }, run);

  const items = [
    m("T", "Harorat", "Температура", temp, "K"),
    m("N", "Har bir moddadan zarrachalar", "Частиц каждого вещества", n),
    m("cat", "Katalizator", "Катализатор", cat === "yes" ? tr(lang, { uz: "bor", ru: "есть" }) : tr(lang, { uz: "yo'q", ru: "нет" })),
    { ...m("made", "Hosil bo'lgan mahsulot", "Образовалось продукта", stats.made), accent: true },
    { ...m("time", "Vaqt", "Время", round(stats.t, 1), "s"), accent: true },
    { ...m("half", "Yarim reaksiya vaqti", "Время полупревращения", stats.half == null ? "—" : round(stats.half, 1), stats.half == null ? "" : "s"), accent: true },
  ];
  useReport(onState, items.filter((i) => i.id !== "time" && i.id !== "made"));

  return (
    <div className="lab-sim">
      <canvas ref={canvas} className="lab-canvas" style={{ aspectRatio: `${BOX_W} / ${BOX_H}` }} />
      <div className="lab-legend">
        <span><i style={{ background: "#5bc0af" }} />A</span>
        <span><i style={{ background: "#d3997f" }} />B</span>
        <span><i style={{ background: "#f9d965" }} />AB</span>
      </div>
      <div className="lab-controls">
        <Slider label={tr(lang, { uz: "Harorat", ru: "Температура" })} value={temp} min={200} max={600} step={10} unit="K" onChange={(v) => { setTemp(v); reset(); }} />
        <Slider label={tr(lang, { uz: "Konsentratsiya (zarrachalar)", ru: "Концентрация (частицы)" })} value={n} min={8} max={40} onChange={(v) => { setN(v); reset(v); }} />
        <Choice label={tr(lang, { uz: "Katalizator", ru: "Катализатор" })} value={cat} onChange={(v) => { setCat(v); reset(); }}
          options={[{ value: "no", label: tr(lang, { uz: "Yo'q", ru: "Нет" }) }, { value: "yes", label: tr(lang, { uz: "Bor", ru: "Есть" }) }]} />
        <div className="row">
          <button className="btn btn-green sm" onClick={() => setRun((x) => !x)} disabled={stats.made >= n}>{run ? "❚❚" : <Play size={15} />}{tr(lang, run ? { uz: "Pauza", ru: "Пауза" } : { uz: "Boshlash", ru: "Старт" })}</button>
          <button className="btn btn-soft sm" onClick={() => reset()}><RotateCcw size={15} /></button>
        </div>
      </div>
      <Readouts lang={lang} items={items.filter((i) => i.accent)} />
    </div>
  );
}

/* ---------- Gaz qonunlari ---------- */
const MOL = 0.1, RGAS = 8.314;

export function GasLaw({ lang, onState }) {
  const [V, setV] = useState(2.5);
  const [T, setT] = useState(300);
  const canvas = useRef(null);
  const parts = useRef(Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random(), a: Math.random() * Math.PI * 2 })));
  const P = (MOL * RGAS * T) / V; // kPa (V litrda)

  const W = 440, H = 240;
  const width = 60 + (V / 5) * 240; // silindr ichki uzunligi
  useFrame((dt) => {
    const c = canvas.current;
    if (!c) return;
    const sp = 0.0035 * Math.sqrt(T) * 60 * dt;
    for (const q of parts.current) {
      q.x += (Math.cos(q.a) * sp * 300) / width;
      q.y += Math.sin(q.a) * sp * 1.6;
      if (q.x < 0 || q.x > 1) { q.a = Math.PI - q.a; q.x = clamp(q.x, 0, 1); }
      if (q.y < 0 || q.y > 1) { q.a = -q.a; q.y = clamp(q.y, 0, 1); }
    }
    const ctx = fitCanvas(c, W, H);
    ctx.clearRect(0, 0, W, H);
    const x0 = 30, y0 = 40, ih = 150;
    ctx.strokeStyle = "#8ea39e"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x0 + 314, y0); ctx.lineTo(x0, y0); ctx.lineTo(x0, y0 + ih); ctx.lineTo(x0 + 314, y0 + ih); ctx.stroke();
    ctx.fillStyle = "#24574e"; ctx.fillRect(x0 + width, y0 + 2, 14, ih - 4);
    ctx.fillStyle = "#8ea39e"; ctx.fillRect(x0 + width + 14, y0 + ih / 2 - 5, 80, 10);
    const hue = 200 - ((T - 200) / 400) * 200;
    ctx.fillStyle = `hsl(${hue} 70% 55%)`;
    for (const q of parts.current) {
      ctx.beginPath();
      ctx.arc(x0 + 6 + q.x * (width - 12), y0 + 6 + q.y * (ih - 12), 4, 0, Math.PI * 2);
      ctx.fill();
    }
    // manometr
    const gx = 390, gy = 210, gr = 26;
    ctx.lineWidth = 3; ctx.strokeStyle = "#8ea39e";
    ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI, 2 * Math.PI); ctx.stroke();
    const k = clamp(P / 1000, 0, 1);
    ctx.strokeStyle = "#c2553d";
    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx - Math.cos(k * Math.PI) * (gr - 4), gy - Math.sin(k * Math.PI) * (gr - 4)); ctx.stroke();
  });

  const items = [
    m("V", "Hajm", "Объём", V, "L"),
    m("T", "Harorat", "Температура", T, "K"),
    { ...m("P", "Bosim", "Давление", round(P, 1), "kPa"), accent: true },
    { ...m("PV", "P·V", "P·V", round(P * V, 1), "kPa·L"), accent: true },
  ];
  useReport(onState, items);

  return (
    <div className="lab-sim">
      <canvas ref={canvas} className="lab-canvas" style={{ aspectRatio: `${W} / ${H}` }} />
      <div className="lab-controls">
        <Slider label={tr(lang, { uz: "Hajm (porshen)", ru: "Объём (поршень)" })} value={V} min={0.5} max={5} step={0.25} unit="L" onChange={setV} />
        <Slider label={tr(lang, { uz: "Harorat", ru: "Температура" })} value={T} min={200} max={600} step={10} unit="K" onChange={setT} />
      </div>
      <Readouts lang={lang} items={items.filter((i) => i.accent)} />
    </div>
  );
}

/* ---------- Alanga rangi bo'yicha metallarni aniqlash ---------- */
const SALTS = [
  { value: "LiCl", color: "#e8304a", nm: 671, name: { uz: "qizil (karmin)", ru: "красный (карминовый)" } },
  { value: "NaCl", color: "#ffc21a", nm: 589, name: { uz: "sariq", ru: "жёлтый" } },
  { value: "KCl", color: "#b07cf0", nm: 766, name: { uz: "och binafsha", ru: "бледно-фиолетовый" } },
  { value: "CaCl₂", color: "#ff6a2b", nm: 622, name: { uz: "g'isht-qizil", ru: "кирпично-красный" } },
  { value: "SrCl₂", color: "#ff1f3d", nm: 650, name: { uz: "to'q qizil", ru: "тёмно-красный" } },
  { value: "CuCl₂", color: "#26d0a0", nm: 510, name: { uz: "yashil-ko'k", ru: "сине-зелёный" } },
  { value: "BaCl₂", color: "#9be35a", nm: 524, name: { uz: "och yashil", ru: "светло-зелёный" } },
];

export function FlameTest({ lang, onState }) {
  const [salt, setSalt] = useState("NaCl");
  const [inFlame, setInFlame] = useState(false);
  const [t] = useTicker(true);
  const s = SALTS.find((x) => x.value === salt);
  const col = inFlame ? s.color : "#4aa8ff";
  const flick = (k) => 6 * Math.sin(t * 9 + k) + 4 * Math.sin(t * 13 + k * 2);

  const items = [
    m("salt", "Tuz", "Соль", salt),
    { ...m("color", "Alanga rangi", "Цвет пламени", inFlame ? tr(lang, s.name) : "—"), accent: true },
    { ...m("nm", "To'lqin uzunligi", "Длина волны", inFlame ? s.nm : "—", inFlame ? "nm" : ""), accent: true },
  ];
  useReport(onState, items);

  return (
    <div className="lab-sim">
      <svg viewBox="0 0 440 300" className="lab-svg" role="img" aria-label="flame test">
        <defs>
          <radialGradient id="fl" cx="50%" cy="80%" r="70%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="35%" stopColor={col} stopOpacity="0.95" />
            <stop offset="100%" stopColor={col} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="190" y="230" width="60" height="60" rx="6" className="lab-metal" />
        <rect x="205" y="200" width="30" height="34" className="lab-metal" />
        <path d={`M220 ${60 + flick(1)} C ${250 + flick(2)} 120, 260 170, 220 200 C 180 170, ${190 + flick(3)} 120, 220 ${60 + flick(1)} Z`} fill="url(#fl)" style={{ transition: "fill .3s" }} />
        <path d={`M220 ${130 + flick(4) / 2} C 232 160, 235 185, 220 200 C 205 185, 208 160, 220 ${130 + flick(4) / 2} Z`} fill="#4aa8ff" opacity="0.7" />
        <g style={{ transform: `translate(${inFlame ? 0 : 90}px, ${inFlame ? 0 : -40}px)`, transition: "transform .5s" }}>
          <line x1="225" y1="150" x2="380" y2="90" className="lab-string" />
          <circle cx="225" cy="150" r="5" style={{ fill: s.color }} />
        </g>
        <text x="16" y="28" className="lab-svg-b">{salt}</text>
        {inFlame && <text x="16" y="48" className="lab-svg-t">λ ≈ {s.nm} nm</text>}
      </svg>
      <div className="lab-controls">
        <Choice label={tr(lang, { uz: "Tuzni tanlang", ru: "Выберите соль" })} value={salt} onChange={(v) => { setSalt(v); setInFlame(false); }}
          options={SALTS.map((x) => ({ value: x.value, label: x.value }))} />
        <button className="btn btn-green sm" onClick={() => setInFlame((x) => !x)}>
          <FlameIcon size={15} />{inFlame ? tr(lang, { uz: "Simni chiqarish", ru: "Убрать проволоку" }) : tr(lang, { uz: "Simni alangaga kiritish", ru: "Внести проволоку в пламя" })}
        </button>
      </div>
      <Readouts lang={lang} items={items.filter((i) => i.accent)} />
    </div>
  );
}
