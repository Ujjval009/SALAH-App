import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from "adhan";

export const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
export type PrayerName = (typeof PRAYERS)[number];
export type Prayer = { name: PrayerName; time: Date };

export const METHODS = {
  MuslimWorldLeague: { label: "Muslim World League", make: () => CalculationMethod.MuslimWorldLeague() },
  Karachi: { label: "Karachi", make: () => CalculationMethod.Karachi() },
  NorthAmerica: { label: "North America (ISNA)", make: () => CalculationMethod.NorthAmerica() },
  Egyptian: { label: "Egyptian", make: () => CalculationMethod.Egyptian() },
  UmmAlQura: { label: "Umm al-Qura", make: () => CalculationMethod.UmmAlQura() },
} as const;
export type MethodKey = keyof typeof METHODS;
export type AsrKey = "Shafi" | "Hanafi";

export type Coords = { lat: number; lon: number };

export function getTimes(c: Coords, method: MethodKey, asr: AsrKey, date = new Date()): Prayer[] {
  const params = METHODS[method].make();
  params.madhab = asr === "Hanafi" ? Madhab.Hanafi : Madhab.Shafi;
  const t = new PrayerTimes(new Coordinates(c.lat, c.lon), date, params);
  return [
    { name: "Fajr", time: t.fajr },
    { name: "Dhuhr", time: t.dhuhr },
    { name: "Asr", time: t.asr },
    { name: "Maghrib", time: t.maghrib },
    { name: "Isha", time: t.isha },
  ];
}

export function nextPrayer(c: Coords, method: MethodKey, asr: AsrKey, now = new Date()): Prayer {
  const today = getTimes(c, method, asr, now).find((p) => p.time > now);
  if (today) return today;
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return getTimes(c, method, asr, tomorrow)[0];
}

export function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatCountdown(target: Date, now = new Date()) {
  const mins = Math.max(0, Math.round((target.getTime() - now.getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
