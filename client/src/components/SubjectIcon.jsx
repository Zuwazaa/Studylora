import {
  Sigma, Triangle, Ruler, Atom, Orbit, Code2, FlaskConical, Leaf, Sprout, Globe2, BookOpen, Feather, Book,
  Languages, Landmark, ScrollText, Scale, LineChart, Briefcase, Heart, Shield, Music, Palette, Wrench, CaseSensitive,
} from "lucide-react";

const ICONS = {
  sigma: Sigma, triangle: Triangle, ruler: Ruler, atom: Atom, orbit: Orbit, code: Code2, flask: FlaskConical,
  leaf: Leaf, sprout: Sprout, globe: Globe2, "book-open": BookOpen, feather: Feather, book: Book, languages: Languages,
  landmark: Landmark, scroll: ScrollText, scale: Scale, chart: LineChart, briefcase: Briefcase, heart: Heart,
  shield: Shield, music: Music, palette: Palette, wrench: Wrench, a: CaseSensitive,
};

export default function SubjectIcon({ icon, size = 22 }) {
  const I = ICONS[icon] || Book;
  return <I size={size} strokeWidth={1.8} />;
}
