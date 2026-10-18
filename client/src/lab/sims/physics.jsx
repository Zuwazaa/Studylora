import { useEffect, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { Slider, Choice, Readouts, useTicker, useReport, m, round, tr, clamp } from "../kit";

const PLANETS = [
  { value: "earth", g: 9.81, label: { uz: "Yer", ru: "Земля" } },
  { value: "moon", g: 1.62, label: { uz: "Oy", ru: "Луна" } },
  { value: "mars", g: 3.71, label: { uz: "Mars", ru: "Марс" } },
  { value: "jupiter", g: 24.79, label: { uz: "Yupiter", ru: "Юпитер" } },
];

/* ---------- Matematik mayatnik ---------- */
export function Pendulum({ lang, onState }) {
  const [L, setL] = useState(1);
  const [planet, setPlanet] = useState("earth");
  const [amp, setAmp] = useState(15);
  const [mass, setMass] = useState(0.5);
  const [run, setRun] = useState(true);
  const [t, setT] = useTicker(run);

  const g = PLANETS.find((p) => p.value === planet).g;
  const rad = (amp * Math.PI) / 180;
  const T = 2 * Math.PI * Math.sqrt(L / g) * (1 + rad * rad / 16);
  const theta = rad * Math.cos((2 * Math.PI * t) / T);
  const len = 40 + L * 95;
  const bx = 220 + len * Math.sin(theta);
  const by = 24 + len * Math.cos(theta);
  const r = 8 + mass * 6;

  const items = [
    m("L", "Ip uzunligi", "Длина нити", L, "m"),
    m("g", "Erkin tushish tezlanishi", "Ускорение свободного падения", g, "m/s²"),
    m("A", "Og'ish burchagi", "Угол отклонения", amp, "°"),
    m("mass", "Yuk massasi", "Масса груза", mass, "kg"),
    { ...m("T", "Tebranish davri", "Период колебаний", round(T, 2), "s"), accent: true },
    { ...m("n", "Tebranishlar soni", "Число колебаний", Math.floor(t / T)), accent: true },
  ];
  useReport(onState, items.filter((i) => i.id !== "n"));

  const reset = () => setT(0);
  return (
    <div className="lab-sim">
      <svg viewBox="0 0 440 300" className="lab-svg" role="img" aria-label="pendulum">
        <rect x="150" y="14" width="140" height="10" rx="4" className="lab-metal" />
        <path d={`M220 24 L${220 + len * Math.sin(rad)} ${24 + len * Math.cos(rad)}`} className="lab-guide" />
        <path d={`M220 24 L${220 - len * Math.sin(rad)} ${24 + len * Math.cos(rad)}`} className="lab-guide" />
        <line x1="220" y1="24" x2={bx} y2={by} className="lab-string" />
        <circle cx={bx} cy={by} r={r} className="lab-bob" />
        <text x="12" y="290" className="lab-svg-t">{tr(lang, { uz: "Sekundomer", ru: "Секундомер" })}: {t.toFixed(1)} s</text>
      </svg>
      <div className="lab-controls">
        <Slider label={tr(lang, { uz: "Ip uzunligi", ru: "Длина нити" })} value={L} min={0.2} max={2.5} step={0.1} unit="m" onChange={(v) => { setL(v); reset(); }} />
        <Slider label={tr(lang, { uz: "Og'ish burchagi", ru: "Угол отклонения" })} value={amp} min={5} max={60} unit="°" onChange={(v) => { setAmp(v); reset(); }} />
        <Slider label={tr(lang, { uz: "Yuk massasi", ru: "Масса груза" })} value={mass} min={0.1} max={2} step={0.1} unit="kg" onChange={setMass} />
        <Choice label={tr(lang, { uz: "Sayyora", ru: "Планета" })} value={planet} onChange={(v) => { setPlanet(v); reset(); }}
          options={PLANETS.map((p) => ({ value: p.value, label: tr(lang, p.label) }))} />
        <div className="row">
          <button className="btn btn-soft sm" onClick={() => setRun((x) => !x)}>{run ? "❚❚" : <Play size={15} />}</button>
          <button className="btn btn-soft sm" onClick={reset}><RotateCcw size={15} />{tr(lang, { uz: "Sekundomer", ru: "Секундомер" })}</button>
        </div>
      </div>
      <Readouts lang={lang} items={items.filter((i) => i.accent)} />
    </div>
  );
}

/* ---------- Gorizontga burchak ostida otilgan jism ---------- */
const G = 9.81;
const SCALE = 2.7; // px / m

export function Projectile({ lang, onState }) {
  const [v0, setV0] = useState(20);
  const [angle, setAngle] = useState(30);
  const [flying, setFlying] = useState(false);
  const [t, setT] = useTicker(flying);
  const [trails, setTrails] = useState([]);

  const a = (angle * Math.PI) / 180;
  const flight = (2 * v0 * Math.sin(a)) / G;
  const range = (v0 * v0 * Math.sin(2 * a)) / G;
  const H = (v0 * v0 * Math.sin(a) ** 2) / (2 * G);
  const tt = Math.min(t * 1.6, flight); // animatsiya biroz tezlashtirilgan
  const landed = flying && tt >= flight;
  useEffect(() => {
    if (!landed) return;
    setFlying(false);
    setTrails((l) => [...l.slice(-3), { angle, v0, range }]);
  }, [landed, angle, v0, range]);
  const pos = (time) => [20 + v0 * Math.cos(a) * time * SCALE, 250 - (v0 * Math.sin(a) * time - (G * time * time) / 2) * SCALE];
  const path = (va, aa) => {
    const ar = (aa * Math.PI) / 180;
    const ft = (2 * va * Math.sin(ar)) / G;
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const s = (ft * i) / 40;
      pts.push(`${20 + va * Math.cos(ar) * s * SCALE},${250 - (va * Math.sin(ar) * s - (G * s * s) / 2) * SCALE}`);
    }
    return pts.join(" ");
  };
  const live = [];
  for (let i = 0; i <= 30; i++) {
    const [x, y] = pos((tt * i) / 30);
    live.push(`${x},${y}`);
  }
  const [bx, by] = pos(tt);

  const items = [
    m("v0", "Boshlang'ich tezlik", "Начальная скорость", v0, "m/s"),
    m("angle", "Otish burchagi", "Угол броска", angle, "°"),
    { ...m("R", "Uchish uzoqligi", "Дальность полёта", round(range, 1), "m"), accent: true },
    { ...m("H", "Maksimal balandlik", "Макс. высота", round(H, 1), "m"), accent: true },
    { ...m("tf", "Uchish vaqti", "Время полёта", round(flight, 2), "s"), accent: true },
  ];
  useReport(onState, items);

  const launch = () => { setT(0); setFlying(true); };
  return (
    <div className="lab-sim">
      <svg viewBox="0 0 480 270" className="lab-svg" role="img" aria-label="projectile">
        <line x1="0" y1="252" x2="480" y2="252" className="lab-ground" />
        {[50, 100, 150].map((d) => (
          <g key={d}>
            <line x1={20 + d * SCALE} y1="252" x2={20 + d * SCALE} y2="258" className="lab-guide" />
            <text x={20 + d * SCALE} y="268" textAnchor="middle" className="lab-svg-t">{d} m</text>
          </g>
        ))}
        {trails.map((tr0, i) => (
          <polyline key={i} points={path(tr0.v0, tr0.angle)} className="lab-trail" style={{ opacity: 0.25 + (i / trails.length) * 0.4 }} />
        ))}
        <polyline points={live} className="lab-path" />
        <g transform={`translate(20 250) rotate(${-angle})`}>
          <rect x="-4" y="-6" width="34" height="12" rx="5" className="lab-metal" />
        </g>
        <circle cx={bx} cy={by} r="6" className="lab-bob" />
        {trails.map((tr0, i) => (
          <text key={i} x={clamp(20 + tr0.range * SCALE, 30, 450)} y={244 - i * 12} textAnchor="middle" className="lab-svg-t">{tr0.angle}°</text>
        ))}
      </svg>
      <div className="lab-controls">
        <Slider label={tr(lang, { uz: "Boshlang'ich tezlik", ru: "Начальная скорость" })} value={v0} min={5} max={40} unit="m/s" onChange={(v) => { setV0(v); if (!flying) setT(0); }} />
        <Slider label={tr(lang, { uz: "Otish burchagi", ru: "Угол броска" })} value={angle} min={5} max={85} unit="°" onChange={(v) => { setAngle(v); if (!flying) setT(0); }} />
        <div className="row">
          <button className="btn btn-green sm" onClick={launch} disabled={flying}><Play size={15} />{tr(lang, { uz: "Otish", ru: "Бросок" })}</button>
          <button className="btn btn-soft sm" onClick={() => setTrails([])}><RotateCcw size={15} />{tr(lang, { uz: "Izlarni tozalash", ru: "Очистить следы" })}</button>
        </div>
      </div>
      <Readouts lang={lang} items={items.filter((i) => i.accent)} />
    </div>
  );
}

/* ---------- Om qonuni ---------- */
export function Ohm({ lang, onState }) {
  const [U, setU] = useState(6);
  const [R, setR] = useState(10);
  const [t] = useTicker(true);
  const I = U / R;
  const P = U * I;
  const glow = clamp(P / 20, 0.05, 1);

  // Zanjir bo'ylab harakatlanuvchi elektronlar (to'rtburchak yo'l)
  const loop = [[60, 60], [380, 60], [380, 220], [60, 220]];
  const per = 2 * (320 + 160);
  const at = (s) => {
    s = ((s % per) + per) % per;
    let acc = 0;
    for (let i = 0; i < 4; i++) {
      const [x1, y1] = loop[i];
      const [x2, y2] = loop[(i + 1) % 4];
      const d = Math.hypot(x2 - x1, y2 - y1);
      if (s <= acc + d) {
        const k = (s - acc) / d;
        return [x1 + (x2 - x1) * k, y1 + (y2 - y1) * k];
      }
      acc += d;
    }
    return loop[0];
  };
  const dots = Array.from({ length: 24 }, (_, i) => at((i * per) / 24 - t * I * 120));

  const items = [
    m("U", "Kuchlanish", "Напряжение", U, "V"),
    m("R", "Qarshilik", "Сопротивление", R, "Ω"),
    { ...m("I", "Tok kuchi", "Сила тока", round(I, 3), "A"), accent: true },
    { ...m("P", "Quvvat", "Мощность", round(P, 2), "W"), accent: true },
  ];
  useReport(onState, items);

  return (
    <div className="lab-sim">
      <svg viewBox="0 0 440 280" className="lab-svg" role="img" aria-label="circuit">
        <rect x="60" y="60" width="320" height="160" rx="6" className="lab-wire" />
        {dots.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" className="lab-electron" />)}
        {/* batareya */}
        <g transform="translate(60 140)">
          <rect x="-18" y="-34" width="36" height="68" rx="6" className="lab-battery" />
          <text x="0" y="5" textAnchor="middle" className="lab-svg-b">{U} V</text>
        </g>
        {/* rezistor */}
        <g transform="translate(220 60)">
          <rect x="-40" y="-12" width="80" height="24" rx="5" className="lab-resistor" />
          <text x="0" y="5" textAnchor="middle" className="lab-svg-b">{R} Ω</text>
        </g>
        {/* lampochka */}
        <g transform="translate(380 140)">
          <circle r={34 + glow * 30} className="lab-glow" style={{ opacity: glow * 0.85 }} />
          <circle r="22" className="lab-bulb" style={{ fillOpacity: 0.25 + glow * 0.75 }} />
        </g>
        {/* ampermetr */}
        <g transform="translate(220 220)">
          <circle r="24" className="lab-meter" />
          <text x="0" y="-2" textAnchor="middle" className="lab-svg-b">A</text>
          <text x="0" y="12" textAnchor="middle" className="lab-svg-t">{I.toFixed(2)}</text>
        </g>
      </svg>
      <div className="lab-controls">
        <Slider label={tr(lang, { uz: "Kuchlanish", ru: "Напряжение" })} value={U} min={1.5} max={12} step={0.5} unit="V" onChange={setU} />
        <Slider label={tr(lang, { uz: "Qarshilik", ru: "Сопротивление" })} value={R} min={2} max={50} unit="Ω" onChange={setR} />
      </div>
      <Readouts lang={lang} items={items.filter((i) => i.accent)} />
    </div>
  );
}

/* ---------- Yorug'likning sinishi (Snell qonuni) ---------- */
const MEDIA = [
  { value: "air", n: 1.0, label: { uz: "Havo", ru: "Воздух" } },
  { value: "water", n: 1.33, label: { uz: "Suv", ru: "Вода" } },
  { value: "glass", n: 1.5, label: { uz: "Shisha", ru: "Стекло" } },
  { value: "diamond", n: 2.42, label: { uz: "Olmos", ru: "Алмаз" } },
];

export function Refraction({ lang, onState }) {
  const [a1, setA1] = useState(40);
  const [m1, setM1] = useState("air");
  const [m2, setM2] = useState("water");
  const n1 = MEDIA.find((x) => x.value === m1).n;
  const n2 = MEDIA.find((x) => x.value === m2).n;
  const s2 = (n1 * Math.sin((a1 * Math.PI) / 180)) / n2;
  const tir = s2 > 1;
  const a2 = tir ? null : (Math.asin(s2) * 180) / Math.PI;
  const crit = n1 > n2 ? (Math.asin(n2 / n1) * 180) / Math.PI : null;

  const cx = 220, cy = 150, Lr = 130;
  const r1 = (a1 * Math.PI) / 180;
  const inX = cx - Lr * Math.sin(r1), inY = cy - Lr * Math.cos(r1);
  const reflX = cx + Lr * Math.sin(r1), reflY = inY;
  const out = a2 == null ? null : [cx + Lr * Math.sin((a2 * Math.PI) / 180), cy + Lr * Math.cos((a2 * Math.PI) / 180)];
  const shade = (n) => 0.06 + (n - 1) * 0.18;

  const items = [
    m("n1", "1-muhit sindirish ko'rsatkichi", "Показатель преломления среды 1", n1),
    m("n2", "2-muhit sindirish ko'rsatkichi", "Показатель преломления среды 2", n2),
    m("a1", "Tushish burchagi", "Угол падения", a1, "°"),
    { ...m("a2", "Sinish burchagi", "Угол преломления", a2 == null ? "—" : round(a2, 1), a2 == null ? "" : "°"), accent: true },
    { ...m("tir", "To'liq ichki qaytish", "Полное внутреннее отражение", tir ? tr(lang, { uz: "ha", ru: "да" }) : tr(lang, { uz: "yo'q", ru: "нет" })), accent: true },
    ...(crit ? [{ ...m("crit", "Chegaraviy burchak", "Предельный угол", round(crit, 1), "°"), accent: true }] : []),
  ];
  useReport(onState, items);

  return (
    <div className="lab-sim">
      <svg viewBox="0 0 440 300" className="lab-svg" role="img" aria-label="refraction">
        <rect x="0" y="0" width="440" height="150" className="lab-medium" style={{ fillOpacity: shade(n1) }} />
        <rect x="0" y="150" width="440" height="150" className="lab-medium" style={{ fillOpacity: shade(n2) }} />
        <text x="12" y="22" className="lab-svg-b">{tr(lang, MEDIA.find((x) => x.value === m1).label)} n={n1}</text>
        <text x="12" y="288" className="lab-svg-b">{tr(lang, MEDIA.find((x) => x.value === m2).label)} n={n2}</text>
        <line x1={cx} y1="10" x2={cx} y2="290" className="lab-guide" />
        <line x1={inX} y1={inY} x2={cx} y2={cy} className="lab-ray" />
        <line x1={cx} y1={cy} x2={reflX} y2={reflY} className="lab-ray" style={{ opacity: tir ? 1 : 0.25 }} />
        {out && <line x1={cx} y1={cy} x2={out[0]} y2={out[1]} className="lab-ray" />}
        {tir && <text x={cx + 12} y={cy + 40} className="lab-svg-b">{tr(lang, { uz: "To'liq ichki qaytish!", ru: "Полное внутреннее отражение!" })}</text>}
      </svg>
      <div className="lab-controls">
        <Slider label={tr(lang, { uz: "Tushish burchagi", ru: "Угол падения" })} value={a1} min={0} max={89} unit="°" onChange={setA1} />
        <Choice label={tr(lang, { uz: "Yuqori muhit", ru: "Верхняя среда" })} value={m1} onChange={setM1} options={MEDIA.map((x) => ({ value: x.value, label: tr(lang, x.label) }))} />
        <Choice label={tr(lang, { uz: "Pastki muhit", ru: "Нижняя среда" })} value={m2} onChange={setM2} options={MEDIA.map((x) => ({ value: x.value, label: tr(lang, x.label) }))} />
      </div>
      <Readouts lang={lang} items={items.filter((i) => i.accent)} />
    </div>
  );
}
