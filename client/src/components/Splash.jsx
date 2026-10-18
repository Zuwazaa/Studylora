import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import BookLoader from "./BookLoader";

const MIN_MS = 1800;
const KEY = "studylora.splash";

/* Saytga birinchi kirganda (har bir tab sessiyasida bir marta) chiqadigan to'liq ekran yuklanish. */
export default function Splash() {
  const { booting } = useApp();
  const [show, setShow] = useState(() => {
    try { return !sessionStorage.getItem(KEY); } catch { return true; }
  });
  const [minDone, setMinDone] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!show) return;
    const id = setTimeout(() => setMinDone(true), MIN_MS);
    return () => clearTimeout(id);
  }, [show]);

  useEffect(() => {
    if (!show || !minDone || booting) return;
    try { sessionStorage.setItem(KEY, "1"); } catch { /* storage yopiq bo'lishi mumkin */ }
    setLeaving(true);
    const id = setTimeout(() => setShow(false), 400);
    return () => clearTimeout(id);
  }, [show, minDone, booting]);

  if (!show) return null;
  return (
    <div className={`splash${leaving ? " leaving" : ""}`}>
      <BookLoader />
    </div>
  );
}
