// SM-2 oraliqli takrorlash algoritmi (SuperMemo, P. Wozniak).
// quality: 0..5 (0-2 — esladi emas, 3 — qiyinchilik bilan, 4 — yaxshi, 5 — oson)
const DAY = 86400000;

export function initCard() {
  return { ef: 2.5, interval: 0, reps: 0, due: Date.now() };
}

export function review(card, quality, now = Date.now()) {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  let { ef = 2.5, interval = 0, reps = 0 } = card;

  if (q < 3) {
    reps = 0;
    interval = 1;
  } else {
    reps += 1;
    interval = reps === 1 ? 1 : reps === 2 ? 3 : Math.round(interval * ef);
  }
  ef = Math.max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  return { ef: Number(ef.toFixed(2)), interval, reps, due: now + interval * DAY };
}

export const isDue = (card, now = Date.now()) => (card?.due ?? 0) <= now;
