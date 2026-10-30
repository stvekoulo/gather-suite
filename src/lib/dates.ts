// Pure date helpers. Days are "YYYY-MM-DD" keys in local time so nothing
// drifts across time zones or between server and client renders.

export const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];
export const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export const MONTHS_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Dec"];
export const WEEKDAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
export const WEEKDAYS_SHORT = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];

const pad = (n: number) => String(n).padStart(2, "0");

export function toKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, n: number): string {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function addMonths(key: string, n: number): string {
  const d = fromKey(key);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return toKey(d);
}

export function dayOfWeek(key: string): number {
  return fromKey(key).getDay();
}

export function startOfWeek(key: string, weekStartsOn: 0 | 1 = 0): string {
  const dow = dayOfWeek(key);
  const diff = (dow - weekStartsOn + 7) % 7;
  return addDays(key, -diff);
}

export function weekDays(key: string, weekStartsOn: 0 | 1 = 0): string[] {
  const start = startOfWeek(key, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function isoWeek(key: string): number {
  const d = fromKey(key);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day + 3);
  const firstThursday = d.getTime();
  d.setMonth(0, 1);
  if (d.getDay() !== 4) d.setMonth(0, 1 + ((4 - d.getDay() + 7) % 7));
  return 1 + Math.ceil((firstThursday - d.getTime()) / 604800000);
}

export function diffDays(a: string, b: string): number {
  return Math.round((fromKey(b).getTime() - fromKey(a).getTime()) / 86400000);
}

export function rangeKeys(from: string, to: string): string[] {
  const out: string[] = [];
  const n = diffDays(from, to);
  for (let i = 0; i <= n; i++) out.push(addDays(from, i));
  return out;
}

export function startOfMonth(key: string): string {
  const d = fromKey(key);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
}

export function daysInMonth(key: string): number {
  const d = fromKey(key);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function monthGrid(key: string, weekStartsOn: 0 | 1 = 0): string[] {
  const first = startOfMonth(key);
  const start = startOfWeek(first, weekStartsOn);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function isWeekend(key: string): boolean {
  const d = dayOfWeek(key);
  return d === 0 || d === 6;
}

export function monthName(key: string): string {
  return MONTHS[fromKey(key).getMonth()];
}

export function formatLong(key: string): string {
  const d = fromKey(key);
  return `${d.getDate()} ${MONTHS[d.getMonth()].toLowerCase()} ${d.getFullYear()}`;
}

export function formatShort(key: string): string {
  const d = fromKey(key);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

export function formatWeekday(key: string): string {
  return WEEKDAYS[dayOfWeek(key)];
}

export function formatRange(from: string, to: string): string {
  const a = fromKey(from);
  const b = fromKey(to);
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return `${MONTHS_SHORT[a.getMonth()]} ${a.getDate()} – ${b.getDate()}`;
  }
  return `${formatShort(from)} – ${formatShort(to)}`;
}

export function formatTime(minutes: number, format: "24h" | "12h" = "24h"): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (minutes === 1440) return format === "24h" ? "24:00" : "12:00 AM";
  if (format === "24h") return `${pad(h)}:${pad(mm)}`;
  const suffix = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(mm)} ${suffix}`;
}

export function formatTimeRange(start: number, end: number, format: "24h" | "12h" = "24h") {
  return `${formatTime(start, format)} – ${formatTime(end, format)}`;
}

export function parseTime(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function timeInputValue(minutes: number): string {
  const m = Math.min(minutes, 1439);
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export function relativeTime(iso: string, now: number): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Il y a ${d} j`;
  const date = new Date(iso);
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}
