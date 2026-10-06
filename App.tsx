import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View,
} from "react-native";
import * as Location from "expo-location";
import { colors } from "./src/theme";
import {
  AsrKey, Coords, formatCountdown, formatTime, getTimes, METHODS, MethodKey, nextPrayer, Prayer, PRAYERS, PrayerName,
} from "./src/prayerTimes";
import {
  DayStat, DEFAULT_SETTINGS, getDone, getStreak, getWeek, loadCoords, loadSettings, migrateLocalData, saveCoords, saveSettings, Settings, toggle,
} from "./src/storage";
import { cancelAll, scheduleUpcoming } from "./src/notifications";
import { AuthProvider, useAuth } from "./src/AuthContext";
import SignInScreen from "./src/SignInScreen";
import SignUpScreen from "./src/SignUpScreen";

const MAKKAH: Coords = { lat: 21.4225, lon: 39.8262 };

function AuthNavigator() {
  const [isSignUp, setIsSignUp] = useState(false);
  return isSignUp
    ? <SignUpScreen onSwitchToSignIn={() => setIsSignUp(false)} />
    : <SignInScreen onSwitchToSignUp={() => setIsSignUp(true)} />;
}

function AppContent() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(new Date());
  const [done, setDone] = useState<PrayerName[]>([]);
  const [week, setWeek] = useState<DayStat[]>([]);
  const [streak, setStreak] = useState(0);
  const [notifBlocked, setNotifBlocked] = useState(false);

  const uid = user?.uid;

  useEffect(() => {
    if (!uid) return;
    (async () => {
      await migrateLocalData(uid);
      setSettings(await loadSettings(uid));
      const saved = await loadCoords(uid);
      if (saved) setCoords(saved);
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status === "granted") {
          const pos = await Location.getCurrentPositionAsync({});
          const fresh = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setCoords(fresh);
          setUsingFallback(false);
          await saveCoords(uid, fresh);
        } else if (!saved) {
          setCoords(MAKKAH);
          setUsingFallback(true);
        }
      } catch {
        if (!saved) {
          setCoords(MAKKAH);
          setUsingFallback(true);
        }
      }
      setReady(true);
    })();
  }, [uid]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const refreshTracking = useCallback(async () => {
    if (!uid) return;
    setDone(await getDone(uid));
    setWeek(await getWeek(uid));
    setStreak(await getStreak(uid));
  }, [uid]);
  useEffect(() => { refreshTracking(); }, [refreshTracking]);

  useEffect(() => {
    if (!coords || !uid) return;
    (async () => {
      if (settings.reminders) {
        const ok = await scheduleUpcoming(coords, settings.method, settings.asr);
        setNotifBlocked(!ok);
      } else {
        await cancelAll();
        setNotifBlocked(false);
      }
    })();
  }, [coords, settings.method, settings.asr, settings.reminders, uid]);

  const update = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    if (uid) saveSettings(uid, next);
  };

  const onToggle = async (name: PrayerName) => {
    if (!uid) return;
    setDone(await toggle(uid, name));
    setWeek(await getWeek(uid));
    setStreak(await getStreak(uid));
  };

  if (authLoading) {
    return (
      <View style={[s.screen, s.center]}>
        <ActivityIndicator color={colors.accent} />
        <Text style={[s.muted, { marginTop: 12 }]}>Loading…</Text>
      </View>
    );
  }

  if (!user) {
    return <AuthNavigator />;
  }

  if (!ready || !coords) {
    return (
      <View style={[s.screen, s.center]}>
        <ActivityIndicator color={colors.accent} />
        <Text style={[s.muted, { marginTop: 12 }]}>Finding your location…</Text>
      </View>
    );
  }

  const times: Prayer[] = getTimes(coords, settings.method, settings.asr, now);
  const next = nextPrayer(coords, settings.method, settings.asr, now);

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <View style={s.headerRow}>
        <Text style={s.welcome}>Welcome, {user.displayName || user.email?.split("@")[0] || "User"}</Text>
        <TouchableOpacity onPress={() => signOut()} style={s.signOutBtn}>
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.muted}>Next prayer</Text>
      <Text style={s.hero}>{next.name}</Text>
      <Text style={s.heroSub}>
        {formatTime(next.time)} · in {formatCountdown(next.time, now)}
      </Text>

      {usingFallback && (
        <Text style={s.notice}>Location is off, so times are for Makkah. Enable location to get yours.</Text>
      )}
      {notifBlocked && settings.reminders && (
        <Text style={s.notice}>Notifications are blocked. Allow them in your phone settings to get reminders.</Text>
      )}

      <View style={s.card}>
        {times.map((p, i) => {
          const checked = done.includes(p.name);
          const isNext = p.name === next.name && p.time.getTime() === next.time.getTime();
          return (
            <Pressable
              key={p.name}
              onPress={() => onToggle(p.name)}
              style={[s.row, i > 0 && s.rowBorder]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              accessibilityLabel={`${p.name}, ${formatTime(p.time)}`}
            >
              <View style={[s.check, checked && s.checkOn]}>
                {checked && <Text style={s.tick}>✓</Text>}
              </View>
              <Text style={[s.prayer, isNext && { color: colors.accent }]}>{p.name}</Text>
              <Text style={[s.time, checked && { color: colors.muted }]}>{formatTime(p.time)}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={s.statRow}>
        <View>
          <Text style={s.stat}>{done.length}/{PRAYERS.length}</Text>
          <Text style={s.muted}>prayed today</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={s.stat}>{streak} {streak === 1 ? "day" : "days"}</Text>
          <Text style={s.muted}>full-day streak</Text>
        </View>
      </View>

      <Text style={s.section}>Last 7 days</Text>
      <View style={s.week}>
        {week.map((d) => (
          <View key={d.key} style={s.day}>
            <View style={s.bar}>
              <View style={[s.barFill, { height: `${(d.count / PRAYERS.length) * 100}%` }]} />
            </View>
            <Text style={s.dayLabel}>{d.label}</Text>
            <Text style={s.dayCount}>{d.count}</Text>
          </View>
        ))}
      </View>

      <Text style={s.section}>Settings</Text>
      <View style={s.card}>
        <View style={[s.row, { justifyContent: "space-between" }]}>
          <Text style={s.prayer}>Prayer reminders</Text>
          <Switch
            value={settings.reminders}
            onValueChange={(v) => update({ reminders: v })}
            trackColor={{ true: colors.done, false: colors.line }}
          />
        </View>
      </View>

      <Text style={s.label}>Calculation method</Text>
      <View style={s.chips}>
        {(Object.keys(METHODS) as MethodKey[]).map((k) => (
          <Chip key={k} text={METHODS[k].label} on={settings.method === k} onPress={() => update({ method: k })} />
        ))}
      </View>

      <Text style={s.label}>Asr calculation</Text>
      <View style={s.chips}>
        {(["Shafi", "Hanafi"] as AsrKey[]).map((k) => (
          <Chip key={k} text={k} on={settings.asr === k} onPress={() => update({ asr: k })} />
        ))}
      </View>
    </ScrollView>
  );
}

function Chip({ text, on, onPress }: { text: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, on && s.chipOn]} accessibilityRole="button" accessibilityState={{ selected: on }}>
      <Text style={[s.chipText, on && { color: colors.onAccent }]}>{text}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: 20, paddingTop: (Platform.OS === "android" ? StatusBar.currentHeight ?? 24 : 56) + 12, paddingBottom: 48 },
  muted: { color: colors.muted, fontSize: 14 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  welcome: { color: colors.text, fontSize: 20, fontWeight: "600" },
  signOutBtn: { backgroundColor: colors.card, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  signOutText: { color: colors.accent, fontSize: 14, fontWeight: "600" },
  hero: { color: colors.text, fontSize: 52, fontWeight: "700", marginTop: 4 },
  heroSub: { color: colors.accent, fontSize: 18, marginTop: 2, marginBottom: 20 },
  notice: { color: colors.accent, backgroundColor: colors.card, padding: 12, borderRadius: 10, marginBottom: 12, fontSize: 14 },
  card: { backgroundColor: colors.card, borderRadius: 16, paddingHorizontal: 16 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 16 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  check: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.line, alignItems: "center", justifyContent: "center", marginRight: 14 },
  checkOn: { backgroundColor: colors.done, borderColor: colors.done },
  tick: { color: colors.onAccent, fontWeight: "800", fontSize: 15 },
  prayer: { color: colors.text, fontSize: 18, flex: 1 },
  time: { color: colors.text, fontSize: 18, fontVariant: ["tabular-nums"] },
  statRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 24 },
  stat: { color: colors.text, fontSize: 28, fontWeight: "700" },
  section: { color: colors.text, fontSize: 20, fontWeight: "600", marginTop: 32, marginBottom: 12 },
  week: { flexDirection: "row", justifyContent: "space-between" },
  day: { alignItems: "center", flex: 1 },
  bar: { width: 22, height: 80, backgroundColor: colors.card, borderRadius: 6, justifyContent: "flex-end", overflow: "hidden" },
  barFill: { backgroundColor: colors.done, width: "100%" },
  dayLabel: { color: colors.muted, fontSize: 12, marginTop: 6 },
  dayCount: { color: colors.text, fontSize: 12 },
  label: { color: colors.muted, fontSize: 14, marginTop: 20, marginBottom: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: colors.card },
  chipOn: { backgroundColor: colors.accent },
  chipText: { color: colors.text, fontSize: 14 },
});

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}