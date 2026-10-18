import {
  MessagesSquare, Layers, Triangle, Brain, Calendar, Target, Sprout, ListChecks, Mic, Search, TrendingUp, Gauge,
  Shapes, MapPin,
} from "lucide-react";

const ICONS = {
  messages: MessagesSquare, layers: Layers, pyramid: Triangle, brain: Brain, calendar: Calendar, target: Target,
  sprout: Sprout, "list-checks": ListChecks, mic: Mic, search: Search, "trending-up": TrendingUp, gauge: Gauge,
  shapes: Shapes, "map-pin": MapPin,
};

export default function SkillIcon({ icon, color = "teal", size = 20 }) {
  const I = ICONS[icon] || Brain;
  return <span className={`skill-ic ${color}`}><I size={size} strokeWidth={1.9} /></span>;
}

