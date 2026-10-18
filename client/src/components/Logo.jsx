import { Link } from "react-router-dom";

export function LogoMark({ size = 34 }) {
  return <img src="/logo.png" width={size} height={size} alt="" aria-hidden="true" className="logo-mark" />;
}

export default function Logo({ to = "/", light = false }) {
  return (
    <Link to={to} className={`logo${light ? " light" : ""}`} aria-label="Studylora">
      <LogoMark />
      <span className="logo-word">STUDY<b>LORA</b></span>
    </Link>
  );
}
