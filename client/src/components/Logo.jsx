import { Link } from "react-router-dom";

export function LogoMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill="#24574E" />
      <path d="M17 25l15-7.5L47 25l-15 7.5z" fill="#F9D965" />
      <path d="M17 25v14l15 7.5V32.5z" fill="#5BC0AF" />
      <path d="M47 25v14l-15 7.5V32.5z" fill="#D3997F" />
    </svg>
  );
}

export default function Logo({ to = "/", light = false }) {
  return (
    <Link to={to} className={`logo${light ? " light" : ""}`} aria-label="Studylora">
      <LogoMark />
      <span>STUDYLORA</span>
    </Link>
  );
}
