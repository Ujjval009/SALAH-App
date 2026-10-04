import AsyncStorage from "@react-native-async-storage/async-storage";
import { PRAYERS, PrayerName, MethodKey, AsrKey, Coords } from "./prayerTimes";

export type Settings = { method: MethodKey; asr: AsrKey; reminders: boolean };
export const DEFAULT_SETTINGS: Settings = { method: "MuslimWorldLeague", asr: "Shafi", reminders: true };

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const key = (d: Date) => `prayed:${dayKey(d)}`;
const daysAgo = (n: number) => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - n);
};

export async function getDone(date = new Date()): Promise<PrayerName[]> {
  const raw = await AsyncStorage.getItem(key(date));
  return raw ? JSON.parse(raw) : [];
}

export async function toggle(name: PrayerName, date = new Date()): Promise<PrayerName[]> {
  const done = await getDone(date);
  const next = done.includes(name) ? done.filter((n) => n !== name) : [...done, name];
  await AsyncStorage.setItem(key(date), JSON.stringify(next));
  return next;
}

export type DayStat = { key: string; label: string; count: number };

export async function getWeek(): Promise<DayStat[]> {
  const days = [6, 5, 4, 3, 2, 1, 0].map(daysAgo);
  const rows = await AsyncStorage.multiGet(days.map(key));
  return days.map((d, i) => ({
    key: dayKey(d),
    label: d.toLocaleDateString([], { weekday: "short" }),
    count: rows[i][1] ? (JSON.parse(rows[i][1] as string) as string[]).length : 0,
  }));
}

// Consecutive days with all five prayers. Today only counts once it is complete.
export async function getStreak(): Promise<number> {
  const days = Array.from({ length: 365 }, (_, i) => daysAgo(i));
  const rows = await AsyncStorage.multiGet(days.map(key));
  const full = rows.map(([, v]) => (v ? (JSON.parse(v) as string[]).length >= PRAYERS.length : false));
  let streak = 0;
  for (let i = 0; i < full.length; i++) {
    if (full[i]) streak++;
    else if (i === 0) continue;
    else break;
  }
  return streak;
}

export async function loadSettings(): Promise<Settings> {
  const raw = await AsyncStorage.getItem("settings");
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
}
export const saveSettings = (s: Settings) => AsyncStorage.setItem("settings", JSON.stringify(s));

export async function loadCoords(): Promise<Coords | null> {
  const raw = await AsyncStorage.getItem("coords");
  return raw ? JSON.parse(raw) : null;
}
export const saveCoords = (c: Coords) => AsyncStorage.setItem("coords", JSON.stringify(c));
