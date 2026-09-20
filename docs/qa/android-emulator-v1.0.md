> **归属与时效（neat-freak 追加，正文未改）**：**V1.0（历史快照，非当前有效证据）**。所依据为 V1.0 门禁（4 suites / 18 tests）与 T056/T063 静态核对，早于基线 PRODUCT_PLAN_V1.1 及 Change B（移除倒计时）。当前有效证据以 V1.1 系列报告与真机验收为准，本文件仅作历史留痕，不删除。

# Android Emulator 验证记录 v1.0

- 日期：2026-09-18
- 方式：静态代码路径核对（本机无可用模拟器；结论标注为静态核对，待真机/模拟器复核）
- 自动化：`npm run lint` 0 error / `npx tsc --noEmit` PASS / `npm test` 4 suites 18 tests PASS（2026-09-18 实测）

## T056 离线回归（US7）

- 代码全本地：`rg fetch|axios|XMLHttpRequest|WebSocket|http://|https:// app src __tests__ app.json package.json` → 0 命中（2026-09-18 实测）。
- 持久化仅用 `@react-native-async-storage/async-storage`（`src/hooks/useFillLightPersistence.ts`，key `fill-light:v1:last-state`）；亮度/常亮/系统 UI 均为端侧 Expo 模块，无网络调用。
- 结论：**PASS（静态）**——断网/飞行模式不影响任何功能；待真机开飞行模式复核一次。

## T063 全回归 US1–US7（静态代码路径核对）

| # | 用例 | PASS 依据 | 结论 |
|---|---|---|---|
| US1 | 打开即补光 | `app/index.tsx` 直接渲染 `LightCanvas`，无欢迎页；背景仅由 `displayColor` 决定（`LightCanvas.tsx`）；`useKeepAwake` + `StatusBar hidden` + `useSystemUi(true)` | PASS（静态） |
| US2-1 | Tap 开/关 Sheet | `LightCanvas onPress → toggle SET_SHEET_OPEN`；Sheet 内 `onTouchStart stopPropagation` 隔离背景 tap | PASS（静态） |
| US2-2 | 向下拖拽关闭 | `ControlSheet.tsx` 阈值 `dy>72dp 或 v>900dp/s`，未达回弹；开 220ms / 关 200ms | PASS（静态） |
| US2-3 | Closed 无常驻按钮 | `app/index.tsx` closed 时只剩 `LightCanvas`，无业务按钮 | PASS（静态） |
| US3 | 预设 4×2/选中环/点击即换 | `PresetPalette` 48dp 圆 + 2dp accent ring；点击 dispatch `SET_TARGET_COLOR` 保留 intensity；`PRESETS` 8 个冻结 | PASS（静态） |
| US4 | Tab 切换/色轮 | `SegmentedTabs` 预设/色轮；`ColorWheelPanel` 自研 HSV（180–220dp 响应式）；切 Tab 不改颜色（仅 `SET_ACTIVE_TAB`）；色轮 `onChange` 实时 + `onEnd` 持久化 | PASS（静态） |
| US5 | 颜色强度 0–100% | `LabeledSlider` → `SET_COLOR_INTENSITY` → `displayColor` 即时；reducer `clamp01`；与 `screenBrightness` 独立字段 | PASS（静态） |
| US6 | 屏幕亮度/前后台 | `useAppBrightness` 仅 `setBrightnessAsync`（Activity），禁 system-wide setter（`brightness.test.ts` 静态断言）；background/inactive → `restoreSystemBrightnessAsync`，active → 重应用 | PASS（静态） |
| US7-restart | 重启恢复 | `FillLightContext` 启动 `load()` → `HYDRATE`；reducer 强制 `isSheetOpen=false`；非法数据 `sanitizePersistedState` 回退默认；`persistence.test.ts` 7 用例覆盖 | PASS（静态+单测） |
| US7-offline | 断网 | 见 T056，0 网络调用 | PASS（静态） |

- 总体：**T063 PASS（静态核对）**；真机/模拟器手测留待 T065 前补做。
