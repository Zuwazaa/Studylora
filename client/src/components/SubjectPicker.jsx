import { useEffect, useRef, useState } from "react";
import { BookCheck, Check, ChevronDown } from "lucide-react";
import { useApp } from "../context/AppContext";
import { subjectsOf, bookKey } from "../data/catalog";
import SubjectIcon from "./SubjectIcon";

/* Fan tanlash: har bir fan o'z ikonkasi bilan, darsligi bor fanlar belgilanadi. */
export default function SubjectPicker({ grade, value, onChange, books }) {
  const { t, lang } = useApp();
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const ref = useRef(null);
  const listRef = useRef(null);
  const items = subjectsOf(grade);
  const cur = items.find((s) => s.id === value) || items[0];
  const has = (id) => Boolean(books?.[bookKey(grade, id)]);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", close);
    setHi(Math.max(0, items.findIndex((s) => s.id === value)));
    return () => document.removeEventListener("pointerdown", close);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) listRef.current?.children[hi]?.scrollIntoView({ block: "nearest" });
  }, [hi, open]);

  const pick = (id) => { onChange(id); setOpen(false); };
  const onKey = (e) => {
    if (!open && ["ArrowDown", "Enter", " "].includes(e.key)) { e.preventDefault(); setOpen(true); return; }
    if (!open) return;
    if (e.key === "Escape") { setOpen(false); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(items.length - 1, h + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(0, h - 1)); }
    if (e.key === "Enter") { e.preventDefault(); pick(items[hi].id); }
  };

  return (
    <div className="picker" ref={ref}>
      <button type="button" className="select picker-btn" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)} onKeyDown={onKey}>
        <span className={`picker-ic ${cur.tone}`}><SubjectIcon icon={cur.icon} size={16} /></span>
        <span className="grow">{cur[lang]}</span>
        {has(cur.id) && <BookCheck size={16} className="picker-book" />}
        <ChevronDown size={16} className="picker-chev" />
      </button>
      {open && (
        <ul className="picker-list" role="listbox" ref={listRef}>
          {items.map((s, i) => (
            <li key={s.id} role="option" aria-selected={s.id === value}
                className={`${i === hi ? "hi" : ""}${s.id === value ? " on" : ""}`}
                onPointerEnter={() => setHi(i)} onClick={() => pick(s.id)}>
              <span className={`picker-ic ${s.tone}`}><SubjectIcon icon={s.icon} size={16} /></span>
              <span className="grow">{s[lang]}</span>
              {has(s.id) && <span className="picker-tag"><BookCheck size={13} />{t("picker.book")}</span>}
              {s.id === value && <Check size={15} className="picker-check" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
