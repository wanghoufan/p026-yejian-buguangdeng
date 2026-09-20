# Night Fill Light

[简体中文](./README.md) | English

Night Fill Light turns a second Android phone into a standalone fill light: the main phone shoots, the second phone emits light. No pairing, no remote control. Open the app for a full-screen soft light; tap to adjust, idle 5 seconds to dismiss.

## What it does

- Full-screen light canvas: usable on launch, warm-white default (`#FFF2E2`), keeps the screen awake.
- 8 preset colors: warm white / neutral white / cool white / cream / peach pink / rose pink / ambient purple / ice blue, applied on tap.
- Custom color: pick any color from the HSV color wheel.
- Two adjustments: color intensity and in-app screen brightness, each 0–100%.
- Auto-dismiss: the panel closes after 5 seconds without interaction, so it never blocks the light.
- One-tap reset: back to the warm-white defaults.
- Landscape support: no crash on rotation, the landscape panel content scrolls.
- Local-first: state stays on the phone. No account, no pairing, no network (the release build requests zero permissions).

![Preset color panel](./docs/screenshots/preset-colors.png)

![Color intensity and screen brightness](./docs/screenshots/sliders.png)

## Quickest start (install on your phone)

The release build bundles its own UI code and works offline. Build it and install (prerequisites below):

```bash
cd android
./gradlew :app:assembleRelease --no-daemon --no-watch-fs
adb install -r app/build/outputs/apk/release/app-release.apk
```

## Build from source

Prerequisites: Node.js (see `package.json`), JDK 17, Android SDK (including platform-tools).

```bash
npm install
npm start
```

Scan the code with Expo Go, or use an Android emulator / device. Saving code hot-reloads the app.

Quality gates (run before committing):

```bash
npm run lint && npm run typecheck && npm test
```

### Release build notes

See "Quickest start". Additional notes:

- If you only changed Expo config such as `app.json` and the `android/` directory has no matching change yet, run `npx expo prebuild --platform android` first.
- The release build requests 0 permissions (a project requirement); the network permission needed for debugging is scoped to `android/app/src/debug/` and does not affect release.
- Package name `com.filllight.nightlamp`, launcher name「夜间补光灯」.

### Debug build cannot reach Metro

The debug build loads its UI from Metro on your computer. On a red `Unable to load script` screen:

```bash
npx expo start --port 8081   # do not add CI=1, it disables Metro file watching
adb -s <phone-serial> reverse tcp:8081 tcp:8081
```

Then cold-start the app on the phone (swipe it away first, then open). After every replug, run `adb -s <serial> reverse --list` to confirm the 8081 mapping is still there.

On Xiaomi phones, the first USB install needs an on-phone confirmation (Developer options → USB install); it cannot be bypassed from the computer.

## Docs

- Store copy (Chinese): [`docs/store-copy.md`](./docs/store-copy.md)
- Product plan (Chinese): [`docs/pm/PRODUCT_PLAN_V1.1.md`](./docs/pm/PRODUCT_PLAN_V1.1.md)
- Test records: [`docs/qa/`](./docs/qa/)
- Developer handoff, read first when taking over (Chinese): [`docs/handoff/HANDOFF.md`](./docs/handoff/HANDOFF.md)

## Tech notes

Single-page app with Expo (~57) + React Native + TypeScript, one home route via `expo-router`. State lives in `src/state`, the panel / color wheel / sliders in `src/components`, design tokens in `src/theme`. The color-wheel texture is generated with `npm run assets:wheel`.
