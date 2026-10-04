import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { Coords, getTimes, MethodKey, AsrKey } from "./prayerTimes";

const CHANNEL = "prayer-times";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function cancelAll() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Schedules the next `days` days of reminders. Call on every app open to keep the window full.
export async function scheduleUpcoming(c: Coords, method: MethodKey, asr: AsrKey, days = 7): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: "Prayer times",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") return false;

  await cancelAll();
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    for (const p of getTimes(c, method, asr, day)) {
      if (p.time <= now) continue;
      await Notifications.scheduleNotificationAsync({
        content: { title: `${p.name} time`, body: "It's time to pray." },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: p.time, channelId: CHANNEL },
      });
    }
  }
  return true;
}
