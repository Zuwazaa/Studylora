import { useEffect, useMemo, useState } from "react";
import { Play, RotateCcw, Sprout } from "lucide-react";
import { Slider, Choice, Readouts, useTicker, useReport, m, round, tr, clamp } from "../kit";

/* ---------- Fotosintez: elodeya pufakchalari ---------- */
const CO2 = { low: 14, mid: 28, high: 42 }; // shu darajadagi maksimal tezlik (pufak/daq)

export const photoRate = (light, co2, temp) => {
  const tf = temp <= 30 ? Math.exp(-(((temp - 30) / 14) ** 2)) : Math.max(0, 1 - ((temp - 30) / 14) ** 2);
  return Math.min(0.45 * light, CO2[co2]) * tf; // Blekman: eng kam omil cheklaydi
};

export function Photosynthesis({ lang, onState }) {
  const [light, setLight] = useState(50);
  const [co2, setCo2] = useState("mid");
  const [temp, setTemp] = useState(25);
  const [t] = useTicker(true);
  const rate = photoRate(light, co2, temp);
  const perSec = rate / 60;

  // Pufakchalar: har biri o'z "tug'ilish" vaqtiga ega, tepaga ko'tariladi
  const bubbles = [];
  if (perSec > 0.01) {
    const gap = 1 / (perSec * 4); // animatsiya 4x tezlashtirilgan
    const first = Math.floor((t - 3) / gap);
    for (let k = Math.max(0, first); k * gap <= t; k++) {
      const age = t - k * gap;
      if (age > 3) continue;
      bubbles.push({ k, x: 205 + Math.sin(k * 2.3) * 14 + Math.sin(age * 5 + k) * 3, y: 200 - age * 55 });
    }
  }
  const limiting = 0.45 * light < CO2[co2]
    ? tr(lang, { uz: "yorug'lik", ru: "свет" })
    : tr(lang, { uz: "CO₂", ru: "CO₂" });

  const items = [
    m("light", "Yorug'lik kuchi", "Интенсивность света", light, "%"),
    m("co2", "CO₂ miqdori", "Содержание CO₂", tr(lang, { low: { uz: "kam", ru: "мало" }, mid: { uz: "o'rtacha", ru: "средне" }, high: { uz: "ko'p", ru: "много" } }[co2])),
    m("temp", "Suv harorati", "Температура воды", temp, "°C"),
    { ...m("rate", "Pufakchalar", "Пузырьки", round(rate, 1), tr(lang, { uz: "ta/daq", ru: "шт/мин" })), accent: true },
    { ...m("lim", "Cheklovchi omil", "Ограничивающий фактор", temp > 38 || temp < 10 ? tr(lang, { uz: "harorat", ru: "температура" }) : limiting), accent: true },
  ];
  useReport(onState, items);

  return (
    <div className="lab-sim">
      <svg viewBox="0 0 440 280" className="lab-svg" role="img" aria-label="photosynthesis">
        <circle cx="70" cy="110" r={20 + light * 0.6} className="lab-glow" style={{ opacity: light / 130 }} />
        <rect x="40" y="90" width="50" height="34" rx="8" className="lab-metal" />
        <circle cx="94" cy="107" r="12" className="lab-bulb" style={{ fillOpacity: 0.2 + light / 125 }} />
        <rect x="150" y="50" width="130" height="200" rx="10" className="lab-glass" />
        <rect x="153" y="70" width="124" height="177" rx="8" className="lab-water" />
        <path d="M205 240 C 200 200, 215 180, 205 120 M205 200 l-18 -12 M205 180 l18 -14 M205 160 l-16 -12 M206 140 l15 -10" className="lab-plant" />
        {bubbles.map((b) => <circle key={b.k} cx={b.x} cy={b.y} r="3.5" className="lab-bubble" />)}
        <text x="300" y="80" className="lab-svg-b">{round(rate, 1)}</text>
        <text x="300" y="98" className="lab-svg-t">{tr(lang, { uz: "pufak / daqiqa", ru: "пузырьков / мин" })}</text>
        <text x="300" y="140" className="lab-svg-t">{temp} °C</text>
      </svg>
      <div className="lab-controls">
        <Slider label={tr(lang, { uz: "Yorug'lik kuchi", ru: "Интенсивность света" })} value={light} min={0} max={100} step={5} unit="%" onChange={setLight} />
        <Slider label={tr(lang, { uz: "Suv harorati", ru: "Температура воды" })} value={temp} min={0} max={45} unit="°C" onChange={setTemp} />
        <Choice label={tr(lang, { uz: "CO₂ (soda eritmasi)", ru: "CO₂ (раствор соды)" })} value={co2} onChange={setCo2}
          options={[
            { value: "low", label: tr(lang, { uz: "Kam", ru: "Мало" }) },
            { value: "mid", label: tr(lang, { uz: "O'rtacha", ru: "Средне" }) },
            { value: "high", label: tr(lang, { uz: "Ko'p", ru: "Много" }) },
          ]} />
      </div>
      <Readouts lang={lang} items={items.filter((i) => i.accent)} />
    </div>
  );
}

/* ---------- Osmos ---------- */
export const cellVolume = (type, c) => {
  if (type === "rbc") return c < 0.35 ? 0 : clamp(100 * (0.9 / c) ** 0.7, 45, 160); // 0 — gemoliz
  return c <= 0.6 ? 100 : clamp(100 * (0.6 / c) ** 0.9, 35, 100); // o'simlik: protoplast hajmi
};

export function Osmosis({ lang, onState }) {
  const [type, setType] = useState("rbc");
  const [c, setC] = useState(0.9);
  const [shown, setShown] = useState(100);
  const target = cellVolume(type, c);
  const goal = target === 0 ? 175 : target; // gemolizdan oldin hujayra shishadi
  const [t] = useTicker(true);
  // Hajm sekin-asta yangi qiymatga yetadi (suv membranadan vaqt bilan o'tadi)
  const step = Math.floor(t * 20);
  useEffect(() => {
    setShown((v) => (Math.abs(goal - v) > 0.05 ? v + (goal - v) * 0.08 : v));
  }, [step, goal]);
  const burst = type === "rbc" && target === 0 && shown > 165;
  const tonicity = c < 0.85 ? tr(lang, { uz: "gipotonik", ru: "гипотонический" }) : c > 0.95 ? tr(lang, { uz: "gipertonik", ru: "гипертонический" }) : tr(lang, { uz: "izotonik", ru: "изотонический" });
  const flow = Math.abs(goal - shown) < 1 ? 0 : goal > shown ? 1 : -1;

  const items = [
    m("cell", "Hujayra", "Клетка", type === "rbc" ? tr(lang, { uz: "eritrotsit", ru: "эритроцит" }) : tr(lang, { uz: "piyoz po'sti", ru: "кожица лука" })),
    m("c", "NaCl konsentratsiyasi", "Концентрация NaCl", c, "%"),
    { ...m("ton", "Eritma", "Раствор", tonicity), accent: true },
    { ...m("vol", type === "rbc" ? "Hujayra hajmi" : "Protoplast hajmi", type === "rbc" ? "Объём клетки" : "Объём протопласта", target === 0 ? tr(lang, { uz: "yorildi", ru: "лопнула" }) : round(target, 0), target === 0 ? "" : "%"), accent: true },
  ];
  useReport(onState, items);

  const k = Math.sqrt(Math.max(shown, 0) / 100);
  return (
    <div className="lab-sim">
      <svg viewBox="0 0 440 280" className="lab-svg" role="img" aria-label="osmosis">
        <rect x="20" y="20" width="400" height="240" rx="18" className="lab-water" style={{ fillOpacity: 0.15 + c * 0.12 }} />
        {type === "rbc" ? (
          burst ? (
            [0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${220 + Math.cos(i) * 70} ${140 + Math.sin(i) * 50} q 12 -8 22 2`} className="lab-cell-line" />)
          ) : (
            <g transform={`translate(220 140) scale(${k})`}>
              <ellipse rx="80" ry="58" className="lab-rbc" />
              {c > 1.1 ? [0, 1, 2, 3, 4, 5, 6, 7].map((i) => <circle key={i} cx={Math.cos(i * 0.8) * 78} cy={Math.sin(i * 0.8) * 56} r="8" className="lab-rbc" />)
                : <ellipse rx="34" ry="22" className="lab-rbc-in" />}
            </g>
          )
        ) : (
          <g>
            <rect x="110" y="70" width="220" height="140" rx="10" className="lab-wall" />
            <rect x={220 - 105 * k} y={140 - 65 * k} width={210 * k} height={130 * k} rx="14" className="lab-proto" />
            <circle cx={220 - 40 * k} cy={140 - 15 * k} r="9" className="lab-nucleus" />
          </g>
        )}
        {flow !== 0 && !burst && [0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${60 + i * 160} ${40 + (i % 2) * 190})`}>
            <path d={flow > 0 ? "M0 0 l18 0 m-6 -6 l6 6 l-6 6" : "M18 0 l-18 0 m6 -6 l-6 6 l6 6"} className="lab-flow" />
          </g>
        ))}
        <text x="34" y="44" className="lab-svg-b">NaCl {c}%</text>
        <text x="34" y="62" className="lab-svg-t">{tonicity}</text>
      </svg>
      <div className="lab-controls">
        <Choice label={tr(lang, { uz: "Hujayra", ru: "Клетка" })} value={type} onChange={(v) => { setType(v); setShown(100); }}
          options={[{ value: "rbc", label: tr(lang, { uz: "Eritrotsit", ru: "Эритроцит" }) }, { value: "plant", label: tr(lang, { uz: "Piyoz po'sti", ru: "Кожица лука" }) }]} />
        <Slider label={tr(lang, { uz: "NaCl konsentratsiyasi", ru: "Концентрация NaCl" })} value={c} min={0} max={3} step={0.1} unit="%" onChange={(v) => { setC(round(v, 1)); if (burst) setShown(100); }} fmt={(v) => v.toFixed(1)} />
      </div>
      <Readouts lang={lang} items={items.filter((i) => i.accent)} />
    </div>
  );
}

/* ---------- Ferment faolligi ---------- */
const ENZYMES = {
  amylase: { opt: 7, name: { uz: "Amilaza (so'lak)", ru: "Амилаза (слюна)" }, sub: { uz: "kraxmal", ru: "крахмал" } },
  pepsin: { opt: 2, name: { uz: "Pepsin (oshqozon)", ru: "Пепсин (желудок)" }, sub: { uz: "oqsil", ru: "белок" } },
};
export const enzymeActivity = (enz, temp, pH) => {
  const tf = temp <= 37 ? 2 ** ((temp - 37) / 10) : Math.max(0, 1 - ((temp - 37) / 23) ** 2);
  const pf = Math.exp(-(((pH - ENZYMES[enz].opt) / 1.6) ** 2));
  return tf * pf * 100;
};

export function Enzyme({ lang, onState }) {
  const [enz, setEnz] = useState("amylase");
  const [temp, setTemp] = useState(37);
  const [pH, setPH] = useState(7);
  const [run, setRun] = useState(false);
  const [t, setT] = useTicker(run);
  const act = enzymeActivity(enz, temp, pH);
  const need = act > 1 ? 1000 / act : Infinity; // to'liq parchalanish vaqti (s)
  const left = clamp(1 - t / need, 0, 1);
  const done = run && left <= 0;
  useEffect(() => { if (done) setRun(false); }, [done]);

  // Kraxmal + yod: ko'k → jigarrang
  const color = enz === "amylase" ? `hsl(${230 - (1 - left) * 190} ${60 - (1 - left) * 10}% ${30 + (1 - left) * 25}%)` : `hsla(40 30% 92% / ${0.25 + left * 0.7})`;
  const items = [
    m("enz", "Ferment", "Фермент", tr(lang, ENZYMES[enz].name)),
    m("temp", "Harorat", "Температура", temp, "°C"),
    m("pH", "Muhit pH", "pH среды", pH),
    { ...m("act", "Faollik", "Активность", round(act, 0), "%"), accent: true },
    { ...m("time", "Substrat parchalanish vaqti", "Время расщепления субстрата", Number.isFinite(need) ? round(need, 0) : "∞", Number.isFinite(need) ? "s" : ""), accent: true },
  ];
  useReport(onState, items);

  const restart = () => { setT(0); setRun(true); };
  return (
    <div className="lab-sim">
      <svg viewBox="0 0 440 280" className="lab-svg" role="img" aria-label="enzyme">
        <rect x="170" y="20" width="60" height="220" rx="30" className="lab-glass" />
        <rect x="174" y={120} width="52" height="116" rx="26" style={{ fill: color, transition: "fill .3s" }} />
        <text x="250" y="140" className="lab-svg-b">{tr(lang, ENZYMES[enz].sub)}: {Math.round(left * 100)}%</text>
        <text x="250" y="160" className="lab-svg-t">{t.toFixed(0)} s</text>
        {/* faollik grafigi (harorat bo'yicha) */}
        <g transform="translate(20 40)">
          <rect width="130" height="90" rx="8" className="lab-panel" />
          <polyline className="lab-path" points={Array.from({ length: 41 }, (_, i) => `${5 + i * 3},${85 - enzymeActivity(enz, i * 2, pH) * 0.8}`).join(" ")} />
          <circle cx={5 + (temp / 2) * 3} cy={85 - act * 0.8} r="4" className="lab-bob" />
          <text x="6" y="-6" className="lab-svg-t">{tr(lang, { uz: "faollik / harorat", ru: "активность / t°" })}</text>
        </g>
      </svg>
      <div className="lab-controls">
        <Choice label={tr(lang, { uz: "Ferment", ru: "Фермент" })} value={enz} onChange={(v) => { setEnz(v); setT(0); setRun(false); }}
          options={Object.entries(ENZYMES).map(([value, e]) => ({ value, label: tr(lang, e.name) }))} />
        <Slider label={tr(lang, { uz: "Harorat", ru: "Температура" })} value={temp} min={0} max={80} unit="°C" onChange={(v) => { setTemp(v); setT(0); setRun(false); }} />
        <Slider label="pH" value={pH} min={1} max={13} step={0.5} onChange={(v) => { setPH(v); setT(0); setRun(false); }} />
        <button className="btn btn-green sm" onClick={restart}><Play size={15} />{tr(lang, { uz: "Fermentni qo'shish", ru: "Добавить фермент" })}</button>
      </div>
      <Readouts lang={lang} items={items.filter((i) => i.accent)} />
    </div>
  );
}

/* ---------- Mendel: monogibrid chatishtirish ---------- */
const GENO = ["YY", "Yy", "yy"];
const gametes = (g) => [g[0], g[1]];
const pheno = (g) => (g.includes("Y") ? "yellow" : "green");
const sortG = (a, b) => (a === "y" && b === "Y" ? "Yy" : a + b);

export function Mendel({ lang, onState }) {
  const [p1, setP1] = useState("Yy");
  const [p2, setP2] = useState("Yy");
  const [n, setN] = useState(100);
  const [kids, setKids] = useState(null);

  const square = useMemo(() => gametes(p1).map((a) => gametes(p2).map((b) => sortG(a, b))), [p1, p2]);
  const expYellow = square.flat().filter((g) => pheno(g) === "yellow").length / 4;

  const plant = () => {
    const out = [];
    for (let i = 0; i < n; i++) out.push(sortG(p1[Math.random() < 0.5 ? 0 : 1], p2[Math.random() < 0.5 ? 0 : 1]));
    setKids(out);
  };
  const yellow = kids ? kids.filter((g) => pheno(g) === "yellow").length : 0;
  const green = kids ? kids.length - yellow : 0;

  const items = [
    m("p1", "1-ota-ona", "Родитель 1", p1),
    m("p2", "2-ota-ona", "Родитель 2", p2),
    m("N", "Avlodlar soni", "Число потомков", kids ? kids.length : 0),
    { ...m("yel", "Sariq no'xat", "Жёлтый горох", yellow), accent: true },
    { ...m("grn", "Yashil no'xat", "Зелёный горох", green), accent: true },
    { ...m("ratio", "Yashillar ulushi", "Доля зелёных", kids ? round((green / kids.length) * 100, 1) : "—", kids ? "%" : ""), accent: true },
    { ...m("exp", "Kutilgan yashillar ulushi", "Ожидаемая доля зелёных", round((1 - expYellow) * 100, 1), "%"), accent: true },
  ];
  useReport(onState, items);

  const pea = (g) => (pheno(g) === "yellow" ? "#f9d965" : "#7cbf5a");
  return (
    <div className="lab-sim">
      <div className="lab-mendel">
        <table className="lab-punnett">
          <thead><tr><th>♀ \ ♂</th>{gametes(p2).map((b, i) => <th key={i}>{b}</th>)}</tr></thead>
          <tbody>
            {square.map((row, i) => (
              <tr key={i}>
                <th>{p1[i]}</th>
                {row.map((g, j) => <td key={j}><i style={{ background: pea(g) }} />{g}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="lab-peas">
          {kids ? kids.slice(0, 400).map((g, i) => <i key={i} style={{ background: pea(g) }} title={g} />)
            : <p className="muted small"><Sprout size={16} /> {tr(lang, { uz: "Ekish tugmasini bosing", ru: "Нажмите «Посеять»" })}</p>}
        </div>
      </div>
      <div className="lab-controls">
        <Choice label={tr(lang, { uz: "1-ota-ona (♀)", ru: "Родитель 1 (♀)" })} value={p1} onChange={(v) => { setP1(v); setKids(null); }} options={GENO.map((g) => ({ value: g, label: g }))} />
        <Choice label={tr(lang, { uz: "2-ota-ona (♂)", ru: "Родитель 2 (♂)" })} value={p2} onChange={(v) => { setP2(v); setKids(null); }} options={GENO.map((g) => ({ value: g, label: g }))} />
        <Choice label={tr(lang, { uz: "Nechta urug' ekamiz", ru: "Сколько семян сеем" })} value={n} onChange={setN} options={[10, 100, 1000].map((x) => ({ value: x, label: String(x) }))} />
        <div className="row">
          <button className="btn btn-green sm" onClick={plant}><Sprout size={15} />{tr(lang, { uz: "Ekish", ru: "Посеять" })}</button>
          <button className="btn btn-soft sm" onClick={() => setKids(null)}><RotateCcw size={15} /></button>
        </div>
        <p className="muted small">{tr(lang, { uz: "Y — sariq rang geni (dominant), y — yashil (retsessiv).", ru: "Y — ген жёлтой окраски (доминантный), y — зелёной (рецессивный)." })}</p>
      </div>
      <Readouts lang={lang} items={items.filter((i) => i.accent)} />
    </div>
  );
}
