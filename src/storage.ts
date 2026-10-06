import AsyncStorage from "@react-native-async-storage/async-storage";
import { PRAYERS, PrayerName, MethodKey, AsrKey, Coords } from "./prayerTimes";

export type Settings = { method: MethodKey; asr: AsrKey; reminders: boolean };
export const DEFAULT_SETTINGS: Settings = { method: "MuslimWorldLeague", asr: "Shafi", reminders: true };

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const ns = (userId: string, suffix: string) => `user:${userId}:${suffix}`;
const prayedKey = (userId: string, d: Date) => ns(userId, `prayed:${dayKey(d)}`);
const settingsKey = (userId: string) => ns(userId, "settings");
const coordsKey = (userId: string) => ns(userId, "coords");
const daysAgo = (n: number) => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - n);
};

export async function getDone(userId: string, date = new Date()): Promise<PrayerName[]> {
  const raw = await AsyncStorage.getItem(prayedKey(userId, date));
  return raw ? JSON.parse(raw) : [];
}

export async function toggle(userId: string, name: PrayerName, date = new Date()): Promise<PrayerName[]> {
  const done = await getDone(userId, date);
  const next = done.includes(name) ? done.filter((n) => n !== name) : [...done, name];
  await AsyncStorage.setItem(prayedKey(userId, date), JSON.stringify(next));
  return next;
}

export type DayStat = { key: string; label: string; count: number };

export async function getWeek(userId: string): Promise<DayStat[]> {
  const days = [6, 5, 4, 3, 2, 1, 0].map(daysAgo);
  const keys = days.map((d) => prayedKey(userId, d));
  const rows = await AsyncStorage.multiGet(keys);
  return days.map((d, i) => ({
    key: dayKey(d),
    label: d.toLocaleDateString([], { weekday: "short" }),
    count: rows[i][1] ? (JSON.parse(rows[i][1] as string) as string[]).length : 0,
  }));
}

export async function getStreak(userId: string): Promise<number> {
  const days = Array.from({ length: 365 }, (_, i) => daysAgo(i));
  const keys = days.map((d) => prayedKey(userId, d));
  const rows = await AsyncStorage.multiGet(keys);
  const full = rows.map(([, v]) => (v ? (JSON.parse(v) as string[]).length >= PRAYERS.length : false));
  let streak = 0;
  for (let i = 0; i < full.length; i++) {
    if (full[i]) streak++;
    else if (i === 0) continue;
    else break;
  }
  return streak;
}

export async function loadSettings(userId: string): Promise<Settings> {
  const raw = await AsyncStorage.getItem(settingsKey(userId));
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
}
export const saveSettings = (userId: string, s: Settings) => AsyncStorage.setItem(settingsKey(userId), JSON.stringify(s));

export async function loadCoords(userId: string): Promise<Coords | null> {
  const raw = await AsyncStorage.getItem(coordsKey(userId));
  return raw ? JSON.parse(raw) : null;
}
export const saveCoords = (userId: string, c: Coords) => AsyncStorage.setItem(coordsKey(userId), JSON.stringify(c));

export async function migrateLocalData(userId: string): Promise<void> {
  const oldPrayedKeys: string[] = [];
  const oldSettingsKey = "settings";
  const oldCoordsKey = "coords";

  const allKeys = await AsyncStorage.getAllKeys();
  for (const key of allKeys) {
    if (key.startsWith("prayed:")) oldPrayedKeys.push(key);
  }

  if (oldPrayedKeys.length > 0 || (await AsyncStorage.getItem(oldSettingsKey)) || (await AsyncStorage.getItem(oldCoordsKey))) {
    for (const oldKey of oldPrayedKeys) {
      const raw = await AsyncStorage.getItem(oldKey);
      if (raw) {
        const dateStr = oldKey.replace("prayed:", "");
        const [year, month, day] = dateStr.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        await AsyncStorage.setItem(prayedKey(userId, date), raw);
        await AsyncStorage.removeItem(oldKey);
      }
    }

    const oldSettings = await AsyncStorage.getItem(oldSettingsKey);
    if (oldSettings) {
      await AsyncStorage.setItem(settingsKey(userId), oldSettings);
      await AsyncStorage.removeItem(oldSettingsKey);
    }

    const oldCoords = await AsyncStorage.getItem(oldCoordsKey);
    if (oldCoords) {
      await AsyncStorage.setItem(coordsKey(userId), oldCoords);
      await AsyncStorage.removeItem(oldCoordsKey);
    }
  }
}