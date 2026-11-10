# Fish Freshness Detector

Fish freshness detection with a live camera feed and a hosted gate/crop/grade
pipeline. The app assesses
two parts — the **eye** (`clear` / `cloudy` / `sunken`) and the **skin**
(`firm_shiny` / `slimy` / `discolored`) — from real-time video and combines
them into a single binary verdict: **FRESH** or **NOT FRESH**.

Useful when a supermarket/fishmonger guideline needs instant, repeatable
feedback: point the camera at the fish head/gills and let the result auto-lock.

## Features

- **Live scan** of eye and skin with auto-lock stability gating (a verdict only
  locks after N consecutive agreeing frames above a confidence threshold).
- **Binary overall verdict** — always `fresh` or `not_fresh` — with per-part
  condition, severity and confidence breakdown.
- **Result screen** with per-part cards, confidence meter and a consumption
  timeline.
- **On-device inference** (optional): TFLite via `react-native-fast-tflite`
  driven by a VisionCamera frame processor worklet.
- **Hosted pipeline** (recommended): polls a gateway at about 1–2 checks per
  second, gates eye/skin detections, and sends one sharp frame for grading.
- **Scan history** persisted locally (AsyncStorage) with CSV export / optional
  survey submission.
- **Onboarding** walkthrough, **Settings** screen (backend info, toggles).

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Expo SDK 57, React Native 0.86, React 19.2, TypeScript 6 |
| Navigation | React Navigation 7 (native-stack + bottom-tabs) — **not** expo-router |
| State | Zustand 5 (persisted) |
| Storage | `@react-native-async-storage/async-storage` |
| Tests | Jest + jest-expo + `@testing-library/react-native` |
| Lint/Format | ESLint (`eslint-config-expo`), Prettier |
| Real-time stack (native only) | VisionCamera v5, worklets, Nitro, fast-tflite v3 |

> The real-time native stack requires a development client. Hosted mode
> requires a physical device and a reachable gateway. See
> [`assets/models/README.md`](assets/models/README.md).

Hosted mode keeps the Roboflow API key on the gateway. The phone sends camera
snapshots to `/gate` until three consecutive frames pass, then sends one
high-resolution snapshot to `/grade`.

## Getting started

```sh
npm install
cp .env.example .env.local
npm start
```

- **Real inference:** drop the trained model into `assets/models/`, set
  `EXPO_PUBLIC_MODEL_BACKEND=tflite`, then:

  ```sh
  npx expo prebuild
  npx expo run:android   # or run:ios on macOS
  ```

  The model currently in `assets/models/` is a **placeholder**; swap in the
  real TFLite export and verify the tensor layout against
  `src/config/modelConfig.ts` (see `assets/models/README.md`).

- **Hosted inference:** set `EXPO_PUBLIC_MODEL_BACKEND=roboflow`,
  `EXPO_PUBLIC_GATEWAY_URL`, and optionally `EXPO_PUBLIC_GATEWAY_APP_TOKEN` in
  `.env.local`. The gateway must expose `POST /gate` and `POST /grade` with a
  multipart `image` field and `required=eye|skin`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the Metro dev server |
| `npm run android` / `ios` / `web` | Start in a specific target |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | `expo lint` |
| `npm test` / `npm run test:watch` | Run Jest suites |
| `npm run format` | Prettier on `src` |

## Configuration

Copy `.env.example` to `.env.local` and adjust. Values prefixed
`EXPO_PUBLIC_` are inlined at bundle time.

| Variable | Default | Meaning |
| --- | --- | --- |
| `EXPO_PUBLIC_MODEL_BACKEND` | `roboflow` | `tflite` or `roboflow` |
| `EXPO_PUBLIC_GATEWAY_URL` | — | Hosted scan gateway base URL |
| `EXPO_PUBLIC_GATEWAY_APP_TOKEN` | — | Optional gateway app token |
| `EXPO_PUBLIC_COMBINE_STRATEGY` | `severe-wins` | `severe-wins` or `weighted` |
| `EXPO_PUBLIC_HISTORY_ENABLED` | `true` | Persist completed scans locally |
| `EXPO_PUBLIC_ONBOARDING_ENABLED` | `true` | Show the first-run walkthrough |
| `EXPO_PUBLIC_SURVEY_ENDPOINT` | — | POST survey responses (else async CSV export) |
| `EXPO_PUBLIC_APP_VERSION` | `1.0.0` | App version shown in Settings |
| `EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK` | `1` | Opt out of the CLI's expo-router check (see Troubleshooting) |

## How a verdict is computed

1. Each scan **locks** its part when a reading stays stable for
   `stability.consecutiveFrames` frames at ≥ `stability.minConfidence`
   confidence (`src/features/scan/hooks/useStableReading.ts`).
2. Eye and skin conditions map to a severity 0–2
   (`src/config/modelConfig.ts` → `combine.severity`).
3. `combineResults.ts` merges them:
   - `severe-wins` (default): the location with the **worst** severity is
     decisive — a cloudy (or sunken) eye or slimy / discolored skin ⇒ **NOT
     FRESH**.
   - `weighted`: weighted severity score vs. `combine.thresholds`.
4. The overall `FreshnessLevel` is **always** one of two labels: `fresh` or
   `not_fresh` (see `src/shared/constants/freshness.ts`).

## Project structure

```
src/
  app/                 App root, providers, React Navigation setup
  config/              env.ts (runtime config), modelConfig.ts (single source of truth)
  features/
    detection/         Detection services and hosted/on-device backends
                       backends, model loader, frame processor, freshness combine
    scan/              Scan home, camera/simulator capture views, live overlay,
                       stability / live-detection / camera-permission hooks
    results/           Verdict screen, per-part cards, confidence meter, timeline
    history/           Persisted scan list + detail screen
    survey/            Survey form + async CSV / endpoint export
    settings/          App info and toggles
    onboarding/        First-run explainer
  shared/              theme (colors/typography/spacing), constants, components,
                       hooks, utils
  store/               Zustand app store (onboarding, history) with persistence
assets/
  models/              TFLite model (placeholder) — see its README
```

## Tests

Pure, dependency-light logic is unit tested:

- `combineResults` — severity mapping, severe-wins / weighted strategies,
  binary level output
- `postprocess` — softmax/argmax and condition classification
- `useStableReading` — stability tracker lock/reset/part-filter behavior

```sh
npm test
```

## Troubleshooting

### "expo-router is no longer compatible with react-navigation" on `expo export` / `expo start`

This project deliberately uses **React Navigation**. Metro/Expo CLI auto-
detects `expo-router` presence in the module graph — including **stray global
installs** in your user-level `node_modules` (e.g. `~/node_modules/expo-router`
from another project) — and then refuses to bundle `@react-navigation/`
imports. The opt-out env var is already set in `.env` /
`.env.example`:

```sh
EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK=1
```

### Babel errors like "Unable to determine event arguments for onModeChange"

Same root cause: a stray global toolchain at `~/node_modules` (e.g.
`babel-preset-expo@12` + `@react-native/babel-preset@0.76`) can **shadow** the
project-local versions when a package isn't hoisted at the project root.
Node module resolution prefers the project's `node_modules`, but packages
missing there fall through to the user-level `node_modules`. This project pins
`babel-preset-expo@~57.0.9` as a devDependency specifically so resolution stays
local. If you see version-mismatched transform errors, verify with:

```sh
node -e "console.log(require.resolve('babel-preset-expo/package.json'))"
# → …\Fish_fresh_detect_app\node_modules\babel-preset-expo\package.json
```

### Real-time scan does nothing on device

The live camera path is native-only; use a development client and configure
either the hosted gateway or the TFLite backend.