# Development Guide

## Commands
- Install dependencies: `npm install`
- Start the dev server: `npx expo start`
- Run on iOS: `npx expo start --ios`
- Run on Android: `npx expo start --android`
- Run on Web: `npx expo start --web`

## Dev Build Notes
- Expo Router is configured with `"main": "expo-router/entry"` in `package.json`.
- The app uses the new architecture (`newArchEnabled: true`).
- When testing notifications, use a physical device or a development build.
- SQLite access is local-only; no network permissions required.
