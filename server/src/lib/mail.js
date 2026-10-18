// Brevo HTTPS API orqali email (Render SMTP portlarini bloklaydi).
import { config } from "../config.js";

export const mailEnabled = () => Boolean(config.mail.brevoKey && config.mail.from);

export async function sendMail({ to, subject, html, text }) {
  if (!mailEnabled()) throw new Error("Email sozlanmagan (BREVO_KEY / MAIL_USER)");
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": config.mail.brevoKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { name: "Studylora", email: config.mail.from },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });
  if (!res.ok) throw new Error(`Brevo ${res.status}: ${await res.text().catch(() => "")}`);
}
