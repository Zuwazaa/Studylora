import { useApp } from "../context/AppContext";
import { LogoMark } from "./Logo";

const Lines = ({ n = 4, hl = -1 }) => (
  <div className="bl-lines">{Array.from({ length: n }, (_, i) => <i key={i} className={i === hl ? "hl" : ""} />)}</div>
);

/* Kitob varaqlanadigan yuklanish ekrani. Tungi rejimda ham kunduzgi ko'rinishda qoladi. */
export default function BookLoader({ text }) {
  const { t } = useApp();
  return (
    <div className="book-loader" role="status">
      <div className="logo"><LogoMark size={30} /><span className="logo-word">STUDY<b>LORA</b></span></div>
      <div className="bl-book" aria-hidden="true">
        <div className="bl-cover" />
        <div className="bl-half l"><Lines n={5} hl={2} /></div>
        <div className="bl-half r"><Lines n={5} /></div>
        <div className="bl-leaf"><div className="f"><Lines /></div><div className="b bl-mark"><LogoMark size={34} /></div></div>
        <div className="bl-leaf"><div className="f"><Lines hl={1} /></div><div className="b"><Lines n={3} /></div></div>
        <div className="bl-leaf"><div className="f"><Lines n={3} /></div><div className="b"><Lines /></div></div>
        <div className="bl-spine" />
      </div>
      <b className="bl-text">{text || t("loader.books")}<span className="bl-dots" /></b>
      <div className="bl-bar"><i /></div>
    </div>
  );
}
