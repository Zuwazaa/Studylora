import { config } from "../config.js";

// Kun sanasi foydalanuvchilar zonasida (Toshkent), server UTC'da tursa ham
export const today = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: config.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
