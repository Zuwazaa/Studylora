/*
  Izometrik illyustratsiyalar (Settle uslubida): kitoblar, test varag'i, bitiruv qalpog'i,
  kalkulyator, qalam, kolba, globus. Hammasi SVG — tez yuklanadi, istalgan o'lchamda tiniq.
*/
const C30 = Math.cos(Math.PI / 6);
const S30 = 0.5;

// 3D nuqta -> ekran
const P = (x, y, z) => [(x - y) * C30, (x + y) * S30 - z];
const pts = (arr) => arr.map((p) => P(...p).map((n) => n.toFixed(1)).join(",")).join(" ");

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + (amt > 0 ? (255 - c) * amt : c * amt))));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/* Quti: x,y,z — pastki chap-orqa burchak; w (x bo'yicha), d (y bo'yicha), h (balandlik) */
function Box({ x = 0, y = 0, z = 0, w, d, h, color, top, left, right, stroke }) {
  const t = top || shade(color, 0.28);
  const l = left || color;
  const r = right || shade(color, -0.22);
  return (
    <g stroke={stroke || "none"} strokeLinejoin="round">
      <polygon points={pts([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={l} />
      <polygon points={pts([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]])} fill={r} />
      <polygon points={pts([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={t} />
    </g>
  );
}

/* Ustki yuzaga 2D chizish uchun transform (x o'qi -> izometrik x, y o'qi -> izometrik y) */
const topFace = (x, y, z) => {
  const [ox, oy] = P(x, y, z);
  return `matrix(${C30} ${S30} ${-C30} ${S30} ${ox} ${oy})`;
};

function Cylinder({ cx = 0, cy = 0, z = 0, r, h, color }) {
  const [x0, y0] = P(cx, cy, z);
  const rx = r * C30 * 1.414;
  const ry = r * S30 * 1.414;
  return (
    <g>
      <path d={`M${x0 - rx},${y0 - h} L${x0 - rx},${y0} A${rx},${ry} 0 0 0 ${x0 + rx},${y0} L${x0 + rx},${y0 - h} Z`} fill={color} />
      <path d={`M${x0},${y0 - h + ry} L${x0},${y0 + ry} A${rx},${ry} 0 0 0 ${x0 + rx},${y0} L${x0 + rx},${y0 - h} Z`} fill={shade(color, -0.2)} opacity="0.9" />
      <ellipse cx={x0} cy={y0 - h} rx={rx} ry={ry} fill={shade(color, 0.3)} />
    </g>
  );
}

const Shadow = ({ w = 90, y = 6 }) => <ellipse cx="0" cy={y} rx={w / 2} ry={w / 7} fill="rgba(10,30,26,.28)" />;

const KINDS = {
  books: {
    vb: "-70 -78 140 110",
    draw: () => (
      <>
        <Shadow w={120} y={20} />
        <Box x={-34} y={-14} z={0} w={68} d={46} h={12} color="#D3997F" />
        <Box x={-30} y={-12} z={1} w={64} d={2} h={10} color="#FFF6E5" />
        <Box x={-30} y={-10} z={12} w={62} d={42} h={11} color="#5BC0AF" />
        <Box x={-26} y={-8} z={13} w={58} d={2} h={9} color="#FFF6E5" />
        <Box x={-36} y={-16} z={23} w={66} d={44} h={12} color="#F9D965" />
        <Box x={-32} y={-14} z={24} w={62} d={2} h={10} color="#FFF6E5" />
      </>
    ),
  },
  test: {
    vb: "-62 -52 124 92",
    draw: () => (
      <>
        <Shadow w={110} y={22} />
        <Box x={-30} y={-36} z={0} w={60} d={76} h={4} color="#F4F1EA" top="#FFFFFF" right="#D9D3C6" />
        <g transform={topFace(-30, -36, 4)}>
          <rect x="8" y="8" width="26" height="5" rx="2" fill="#24574E" />
          {[22, 36, 50, 64].map((yy, i) => (
            <g key={yy}>
              <circle cx="11" cy={yy} r="3.6" fill={i === 2 ? "#D3997F" : "#5BC0AF"} />
              <rect x="18" y={yy - 2} width={i % 2 ? 30 : 36} height="4" rx="2" fill="#CBD5D1" />
            </g>
          ))}
        </g>
        <Box x={22} y={-30} z={4} w={30} d={5} h={5} color="#F9D965" />
        <Box x={52} y={-30} z={4} w={6} d={5} h={5} color="#D3997F" />
      </>
    ),
  },
  cap: {
    vb: "-62 -70 124 104",
    draw: () => (
      <>
        <Shadow w={96} y={22} />
        <Cylinder cx={0} cy={0} z={0} r={22} h={22} color="#24574E" />
        <Box x={-36} y={-36} z={22} w={72} d={72} h={5} color="#2F6A5F" top="#3B7D70" />
        <path d={`M${P(0, 0, 27)[0]},${P(0, 0, 27)[1]} L${P(30, 18, 27)[0]},${P(30, 18, 27)[1]} L${P(30, 18, 10)[0]},${P(30, 18, 10)[1]}`} stroke="#F9D965" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx={P(30, 18, 8)[0]} cy={P(30, 18, 8)[1]} r="4" fill="#F9D965" />
        <circle cx={P(0, 0, 27)[0]} cy={P(0, 0, 27)[1]} r="3.5" fill="#F9D965" />
      </>
    ),
  },
  calc: {
    vb: "-56 -46 112 84",
    draw: () => (
      <>
        <Shadow w={96} y={18} />
        <Box x={-26} y={-34} z={0} w={52} d={68} h={7} color="#5BC0AF" />
        <g transform={topFace(-26, -34, 7)}>
          <rect x="7" y="7" width="38" height="14" rx="3" fill="#163B35" />
          <rect x="30" y="11" width="11" height="6" rx="1" fill="#5BC0AF" />
          {[0, 1, 2].map((r) => [0, 1, 2].map((c) => (
            <rect key={`${r}${c}`} x={7 + c * 13.5} y={27 + r * 13} width="11" height="10" rx="2.5" fill={r === 2 && c === 2 ? "#F9D965" : "#FFFFFF"} opacity={r === 2 && c === 2 ? 1 : 0.85} />
          )))}
        </g>
      </>
    ),
  },
  pencil: {
    vb: "-66 -40 132 72",
    draw: () => (
      <>
        <Shadow w={100} y={14} />
        <Box x={-44} y={-4} z={0} w={70} d={9} h={9} color="#F9D965" />
        <Box x={-52} y={-4} z={0} w={8} d={9} h={9} color="#D3997F" />
        <polygon points={pts([[26, -4, 9], [26, 5, 9], [40, 0.5, 4.5]])} fill="#F4E3C4" />
        <polygon points={pts([[26, 5, 9], [26, 5, 0], [40, 0.5, 4.5]])} fill="#E0C9A2" />
        <polygon points={pts([[34, 3, 7], [34, 3, 2], [40, 0.5, 4.5]])} fill="#163B35" />
      </>
    ),
  },
  flask: {
    vb: "-46 -86 92 116",
    draw: () => (
      <>
        <Shadow w={70} y={16} />
        <Cylinder cx={0} cy={0} z={0} r={18} h={34} color="#5BC0AF" />
        <Cylinder cx={0} cy={0} z={34} r={7} h={26} color="#DDF2EE" />
        <Cylinder cx={0} cy={0} z={60} r={9} h={4} color="#D3997F" />
        <circle cx="-6" cy="-24" r="3" fill="#FFFFFF" opacity=".8" />
        <circle cx="4" cy="-14" r="2" fill="#FFFFFF" opacity=".8" />
      </>
    ),
  },
  globe: {
    vb: "-50 -96 100 126",
    draw: () => (
      <>
        <Shadow w={70} y={16} />
        <Cylinder cx={0} cy={0} z={0} r={16} h={6} color="#D3997F" />
        <rect x="-2" y="-30" width="4" height="26" fill="#A8664A" />
        <circle cx="0" cy="-58" r="30" fill="#5BC0AF" />
        <path d="M-22,-74 q12,-6 18,4 q6,10 -4,14 q-10,4 -12,14 q-2,8 -10,4 q-4,-10 -2,-18 q2,-10 10,-18z" fill="#24574E" />
        <path d="M8,-80 q10,2 14,10 q2,8 -6,8 q-8,0 -10,-8z M10,-50 q8,-2 12,6 q-2,10 -10,12 q-6,-6 -2,-18z" fill="#24574E" />
        <path d="M-30,-58 a30,30 0 0 0 60,0" fill="none" stroke="#FFFFFF" strokeOpacity=".35" strokeWidth="2" />
        <circle cx="0" cy="-58" r="34" fill="none" stroke="#F9D965" strokeWidth="3" strokeDasharray="80 130" transform="rotate(-30 0 -58)" />
      </>
    ),
  },
  bulb: {
    vb: "-44 -96 88 122",
    draw: () => (
      <>
        <Shadow w={56} y={14} />
        <Cylinder cx={0} cy={0} z={0} r={10} h={16} color="#6B7B77" />
        <circle cx="0" cy="-44" r="26" fill="#F9D965" />
        <circle cx="-9" cy="-53" r="7" fill="#FFFFFF" opacity=".55" />
        <path d="M-6,-24 l6,-14 l6,14" stroke="#E9C33F" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
};

export default function Iso({ kind = "books", size = 120, className = "", style }) {
  const k = KINDS[kind] || KINDS.books;
  return (
    <svg viewBox={k.vb} width={size} height={size} className={className} style={style} aria-hidden="true">
      {k.draw()}
    </svg>
  );
}

export const ISO_KINDS = Object.keys(KINDS);
