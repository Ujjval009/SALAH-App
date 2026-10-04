# Salah App

Daily prayer times, reminders, and tracking. Runs fully on the phone, no backend.

## Run it

```bash
npm install
npx expo install --fix     # aligns package versions with your Expo Go
npx expo start
```

Scan the QR code with the Expo Go app.

## What's inside

- `App.tsx` – screen: next prayer, today's checklist, streak, 7-day chart, settings
- `src/prayerTimes.ts` – prayer time maths (adhan), methods, Asr option
- `src/notifications.ts` – schedules the next 7 days of reminders
- `src/storage.ts` – saves checked prayers, streak, settings, location

## Notes

- Reminders are rescheduled each time the app opens, so open it at least once a week.
- Expo Go is fine for testing. For reliable background alarms and a custom adhan sound, make a development build: `npx eas build --profile development`.
- Pick the calculation method your local mosque follows in Settings.
- Change `com.example.salah` in `app.json` before publishing.
