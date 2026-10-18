import UserData from "../models/UserData.js";
import { today } from "./time.js";

const DAY = 86400000;
export const MAX_MISTAKES = 150;
export const MAX_HISTORY = 60;

/** Hujjatni yuklab, o'zgartirib saqlaydi (birinchi marta parallel so'rovlarda unique xatosiga bir marta qayta urinadi) */
export async function updateData(userId, fn) {
  const apply = async () => {
    const d = (await UserData.findOne({ userId })) || new UserData({ userId });
    fn(d);
    d.markModified("counters");
    d.markModified("mastery");
    d.markModified("bloom");
    await d.save();
    return d;
  };
  try {
    return await apply();
  } catch (e) {
    if (e?.code === 11000) return apply();
    throw e;
  }
}

function dayEntry(d, date) {
  let e = d.dayLog.find((x) => x.d === date);
  if (!e) {
    d.dayLog.push({ d: date, n: 0, m: 0 });
    if (d.dayLog.length > 90) d.dayLog = d.dayLog.slice(-90);
    e = d.dayLog.find((x) => x.d === date);
  }
  return e;
}

/** Haqiqiy faollik: streak + kunlik hisob + hisoblagich */
export function touch(d, kind, minutes = 0) {
  const date = today();
  if (!d.streakDates.includes(date)) {
    d.streakDates.push(date);
    if (d.streakDates.length > 400) d.streakDates = d.streakDates.slice(-400);
  }
  const e = dayEntry(d, date);
  if (kind) {
    e.n += 1;
    d.counters[kind] = (d.counters[kind] || 0) + 1;
  }
  if (minutes) {
    e.m += minutes;
    d.counters.minutes = (d.counters.minutes || 0) + minutes;
  }
}

export const activity = (userId, kind) => updateData(userId, (d) => touch(d, kind));

export function streakOf(dates) {
  const set = new Set(dates);
  let n = 0;
  let t = Date.parse(`${today()}T00:00:00Z`);
  if (!set.has(new Date(t).toISOString().slice(0, 10))) t -= DAY; // bugun hali faollik yo'q bo'lsa kechadan sanaymiz
  while (set.has(new Date(t).toISOString().slice(0, 10))) { n++; t -= DAY; }
  return n;
}

export const publicData = (d) => {
  const now = Date.now();
  const mistakes = (d?.mistakes || []).slice().reverse();
  return {
    streak: streakOf(d?.streakDates || []),
    streakDates: (d?.streakDates || []).slice(-120),
    mistakes: mistakes.map((m) => ({ ...m.toObject?.() ?? m, id: String(m._id), isDue: (m.due ?? 0) <= now })),
    dueMistakes: mistakes.filter((m) => (m.due ?? 0) <= now).length,
    quizHistory: (d?.quizHistory || []).slice(-30).reverse(),
    mastery: d?.mastery || {},
    bloom: d?.bloom || {},
    dayLog: (d?.dayLog || []).slice(-60),
    dailyGoal: d?.dailyGoal ?? 3,
    today: (d?.dayLog || []).find((x) => x.d === today()) || { n: 0, m: 0 },
    counters: d?.counters || {},
  };
};
