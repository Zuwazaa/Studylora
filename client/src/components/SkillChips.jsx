import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Pedagogy } from "../api/client";
import { useApp } from "../context/AppContext";

let cache = null;
let pending = null;
export function usePedagogy() {
  const [data, setData] = useState(cache);
  useEffect(() => {
    if (cache) return;
    pending ||= Pedagogy.get().then((r) => (cache = r)).catch(() => null);
    pending.then((r) => r && setData(r));
  }, []);
  return data;
}

// AI javobi ostida: qaysi pedagog skillari ishlatilgani
export default function SkillChips({ ids = [] }) {
  const { lang } = useApp();
  const ped = usePedagogy();
  if (!ids.length || !ped) return null;
  const byId = Object.fromEntries(ped.skills.map((s) => [s.id, s]));
  return (
    <div className="skill-chips">
      <Sparkles size={13} />
      {ids.slice(0, 5).map((id) => byId[id] && (
        <span key={id} className={`chip ${byId[id].color}`} title={byId[id].short[lang]}>{byId[id].name[lang]}</span>
      ))}
    </div>
  );
}
