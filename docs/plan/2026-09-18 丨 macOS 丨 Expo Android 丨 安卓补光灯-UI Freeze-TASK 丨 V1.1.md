# 安卓补光灯 TASK

> SDD 基线版本：V1.1  
> 目标产品版本：V1.0  
> 日期：2026-09-18  
> 状态：Ready for Continuous Implementation  
> 上游：Constitution V1.1 / SPEC V1.1 / PLAN V1.1  
> UI Reference：`2026-09-18 丨 macOS 丨 ChatGPT 丨 安卓补光灯-方案C UI Freeze设计板 丨 V1.1.png`  
> 执行规则：T001–T064 连续自动推进；所有 Gate 仅内部检查；T065 是唯一正常 Human Gate。

---

## 0. Traceability

| User Story | 主要 Requirement | Task |
|---|---|---|
| US1 打开即补光 | FR-001~006, 029~031, 037~038 | T021~T026 |
| US2 Sheet | FR-007~018 | T027~T033 |
| US3 预设 | FR-019~020 | T034~T037 |
| US4 色轮 | FR-021~022 | T038~T041 |
| US5 色彩强度 | FR-023~024 | T042~T044 |
| US6 屏幕亮度 | FR-025~031 | T045~T050 |
| US7 本地/离线 | FR-032~034 | T051~T056 |
| UI Freeze | FR-012~018, 035~038 | T007~T014, T057~T061 |

---

# Phase 1 — Setup

- [ ] T001 初始化 Expo + React Native + TypeScript，确认 Android Emulator 可运行 `app/_layout.tsx`, `app/index.tsx`, `package.json`
- [ ] T002 使用 `npx expo install` 安装 `expo-brightness`, `expo-keep-awake`, `expo-navigation-bar`, `expo-status-bar`, `react-native-reanimated`, `react-native-gesture-handler`, `@react-native-async-storage/async-storage` `package.json`, lockfile
- [ ] T003 安装 `reanimated-color-picker`，不得手动改 Expo Go 内置 native 版本去迁就它 `package.json`, lockfile
- [ ] T004 [P] 配置 lint/typecheck/test scripts `package.json`, `tsconfig.json`, eslint config
- [ ] T005 [P] 移除模板无关页面与 demo `app/`, `assets/`
- [ ] T006 建立 `docs/qa/` 输出目录与 QA 模板 `docs/qa/android-emulator-v1.0.md`, `docs/qa/visual-freeze-v1.1.md`, `docs/qa/final-human-gate-v1.0.md`

**Internal Gate 1：不得暂停**
- Emulator PASS
- Expo Go PASS
- 项目脚本 PASS
- Continue

---

# Phase 2 — UI Freeze Foundation

- [ ] T007 [P] 建立 Scheme C Design Tokens，固定 Accent=`#4C8DFF` `src/theme/tokens.ts`
- [ ] T008 [P] 实现统一线性图标选用规范，不新增独立图标风格 `src/theme/tokens.ts`, related components
- [ ] T009 [P] 准备方案 C App Icon asset；保持浅蓝/薄荷/粉紫 + 白色光源 glyph，禁止文字 `assets/icon.png`, `app.json`
- [ ] T010 [P] 配置系统 Splash 为方案 C 视觉，不添加业务等待页 `app.json`, `assets/`
- [ ] T011 [P] 实现 `DragHandle` `src/components/DragHandle.tsx`
- [ ] T012 [P] 实现 `SegmentedTabs` 视觉骨架 `src/components/SegmentedTabs.tsx`
- [ ] T013 [P] 实现统一 `LabeledSlider` 视觉骨架 `src/components/LabeledSlider.tsx`
- [ ] T014 对照 UI Reference 与 PLAN token 做一次静态 UI Freeze Review，记录不允许偏离项 `docs/qa/visual-freeze-v1.1.md`

**Internal Gate 2：不得暂停**
- Scheme C token 已集中
- Icon/Splash 路径确定
- 控件风格统一
- Continue

---

# Phase 3 — Foundational State & Color

- [ ] T015 [P] 定义 `FillLightState`, `FillLightPreset`, `ColorSource`, `ControlTab` `src/types/fillLight.ts`
- [ ] T016 [P] 定义默认状态 `src/constants/defaults.ts`
- [ ] T017 [P] 定义冻结 8 个预设 `src/constants/presets.ts`
- [ ] T018 [P] 实现 HEX/颜色插值/clamp `src/utils/color.ts`
- [ ] T019 [P] 添加颜色工具测试 `__tests__/color.test.ts`
- [ ] T020 实现 reducer + Context `src/state/fillLightReducer.ts`, `src/state/FillLightContext.tsx`, `__tests__/reducer.test.ts`

**Internal Gate 3：不得暂停**
- 0%=white
- 100%=Target
- brightness 与 color 分离
- Continue

---

# Phase 4 — US1 打开即补光

- [ ] T021 [US1] 实现全屏 `LightCanvas`，背景仅由 `displayColor` 决定 `src/components/LightCanvas.tsx`
- [ ] T022 [US1] 主路由直接进入 LightCanvas，无欢迎页/设置页 `app/_layout.tsx`, `app/index.tsx`
- [ ] T023 [P] [US1] Keep Awake `app/index.tsx`
- [ ] T024 [P] [US1] 隐藏 StatusBar `app/index.tsx`
- [ ] T025 [P] [US1] 实现 Navigation Bar 尽可能隐藏 `src/hooks/useSystemUi.ts`
- [ ] T026 [US1] 验证 Splash 完成后无额外停留直接进入补光画布 `app.json`, `app/index.tsx`

**Internal Gate US1：不得暂停**

---

# Phase 5 — US2 Scheme C Control Sheet

- [ ] T027 [US2] 实现响应式 Sheet 容器：`height=clamp(46vh,340,420)`, top radius 28dp, translucent glass, border/elevation `src/components/ControlSheet.tsx`
- [ ] T028 [US2] 接入 DragHandle 与 Sheet 220ms 开启动画/200ms 关闭动画 `src/components/ControlSheet.tsx`
- [ ] T029 [US2] LightCanvas Tap → Open Sheet `src/components/LightCanvas.tsx`, `app/index.tsx`
- [ ] T030 [US2] Sheet 外 Canvas Tap → Close Sheet `src/components/LightCanvas.tsx`, `app/index.tsx`
- [ ] T031 [US2] 向下拖拽：72dp 或 900dp/s 阈值关闭 `src/components/ControlSheet.tsx`
- [ ] T032 [US2] 建立手势优先级，Sheet 内控件不得误触背景关闭 `src/components/ControlSheet.tsx`
- [ ] T033 [US2] Closed 状态确认无常驻业务按钮 `app/index.tsx`, `src/components/LightCanvas.tsx`

**Internal Gate US2：不得暂停**

---

# Phase 6 — US3 Presets

- [ ] T034 [US3] 实现 4×2 Preset Palette，48dp 圆形色块 `src/components/PresetPalette.tsx`
- [ ] T035 [US3] 选中态实现 2dp Accent ring + gap `src/components/PresetPalette.tsx`
- [ ] T036 [US3] 点击预设即时更新 targetColor/source/presetId，保留 intensity `src/components/PresetPalette.tsx`, reducer
- [ ] T037 [US3] 将 Presets 接入 Scheme C Sheet，验证常见 360dp 宽不溢出 `src/components/ControlSheet.tsx`

**Internal Gate US3：不得暂停**

---

# Phase 7 — US4 Color Wheel

- [ ] T038 [US4] 执行 Expo Go 色轮 Compatibility Smoke Test；不兼容则替换实现，不切技术栈 `src/components/ColorWheelPanel.tsx`, package files
- [ ] T039 [US4] 实现 180–220dp 响应式色轮与 18–22dp indicator `src/components/ColorWheelPanel.tsx`
- [ ] T040 [US4] 接入 Scheme C SegmentedTabs「预设颜色 / 色轮」 `src/components/ControlSheet.tsx`
- [ ] T041 [US4] 色轮实时更新 custom color；切 Tab 不修改当前颜色 `src/components/ColorWheelPanel.tsx`, reducer

**Internal Gate US4：不得暂停**

---

# Phase 8 — US5 Color Intensity

- [ ] T042 [US5] 接入「颜色强度」Slider，统一 Scheme C 样式 `src/components/ControlSheet.tsx`
- [ ] T043 [US5] Slider 0–100% 即时更新 displayColor `src/components/LabeledSlider.tsx`, reducer
- [ ] T044 [US5] 测试 Color Intensity 不修改 Screen Brightness `__tests__/color.test.ts`, `__tests__/reducer.test.ts`

**Internal Gate US5：不得暂停**

---

# Phase 9 — US6 Screen Brightness

- [ ] T045 [US6] 实现 Activity-only brightness hook，禁止 system-wide setter `src/hooks/useAppBrightness.ts`
- [ ] T046 [US6] 接入「屏幕亮度」Slider，统一 Scheme C 样式 `src/components/ControlSheet.tsx`
- [ ] T047 [US6] slider 拖动即时应用 current Activity brightness `src/hooks/useAppBrightness.ts`
- [ ] T048 [US6] AppState background/inactive → restore system control `src/hooks/useAppBrightness.ts`
- [ ] T049 [US6] AppState active → reapply saved app brightness `src/hooks/useAppBrightness.ts`
- [ ] T050 [US6] brightness lifecycle mock tests + 禁止全局 setter 静态检查 `__tests__/brightness.test.ts`

**Internal Gate US6：不得暂停**

---

# Phase 10 — US7 Persistence & Offline

- [ ] T051 [US7] 实现 persistence schema/key `fill-light:v1:last-state` `src/hooks/useFillLightPersistence.ts`
- [ ] T052 [US7] 实现数据校验和默认回退 `src/utils/validation.ts`
- [ ] T053 [US7] hydrate 状态但强制 Sheet Closed `src/state/FillLightContext.tsx`
- [ ] T054 [US7] 预设/Tab/Slider end/Color Wheel end 持久化 `src/hooks/useFillLightPersistence.ts`
- [ ] T055 [US7] persistence edge tests `__tests__/persistence.test.ts`
- [ ] T056 [US7] 飞行模式/断网模拟回归并记录 `docs/qa/android-emulator-v1.0.md`

**Internal Gate US7：不得暂停**

---

# Phase 11 — UI Freeze Visual QA + Emulator Full Regression

- [ ] T057 在 360×800dp 模拟器完成 State A Pure Light 截图核对 `docs/qa/visual-freeze-v1.1.md`
- [ ] T058 在 360×800dp 完成 State B Preset Sheet 截图核对 `docs/qa/visual-freeze-v1.1.md`
- [ ] T059 在 360×800dp 完成 State C Color Wheel Sheet 截图核对 `docs/qa/visual-freeze-v1.1.md`
- [ ] T060 在第二种常见 Android viewport 完成响应式核对：Sheet 比例、4×2 Presets、Slider、Color Wheel 不溢出 `docs/qa/visual-freeze-v1.1.md`
- [ ] T061 对照 `2026-09-18 丨 macOS 丨 ChatGPT 丨 安卓补光灯-方案C UI Freeze设计板 丨 V1.1.png` 检查毛玻璃气质、圆角、轻量层级、蓝色 Accent；不做像素级抄图 `docs/qa/visual-freeze-v1.1.md`

**Internal Visual Gate：不得暂停**

---

# Phase 12 — Automated Quality & Release Preparation

- [ ] T062 运行 lint + typecheck + unit tests，自动修复后重复直到 PASS `package.json`, source, tests
- [ ] T063 完成 Android Emulator US1–US7 全回归：快速 Tap、drag、Tab、wheel、sliders、restart、background、offline `docs/qa/android-emulator-v1.0.md`
- [ ] T064 执行 Scope Audit + Constitution/SPEC/PLAN/TASK/Implementation 一致性审查，并生成最终 Human Gate 清单 `docs/qa/final-human-gate-v1.0.md`

**Internal Release Gate：不得暂停**
- T001–T064 全 PASS
- 仅此时进入 T065

---

# Phase 13 — T065 Final Human Acceptance Gate（唯一正常人工验收）

- [ ] **T065 [HUMAN]** 请用户在真实 Android 手机上一次性完成完整 V1 Gate：
  1. 打开 App 是否立即补光；
  2. 轻点是否显示/隐藏 Scheme C 毛玻璃面板；
  3. 8 个预设是否正常；
  4. 色轮是否正常；
  5. 颜色强度是否正常；
  6. 屏幕亮度是否真实变化；
  7. 离开 App 后系统亮度是否恢复；
  8. 返回 App 后 App 补光亮度是否恢复；
  9. 连续补光 10 分钟是否保持常亮；
  10. 状态栏/导航栏体验是否可接受；
  11. 暖白/桃粉/紫/蓝/自定义色实际照人是否可用；
  12. 连续 10 分钟是否有崩溃、触摸失效或不可接受的异常发热；
  13. UI 是否整体符合方案 C 毛玻璃方向。

用户 T065 PASS 后：

> **Target Product V1.0 = COMPLETE**

---

## Dependency

```text
T001 → ... → T064
                 ↓
       Final Human Gate T065
```

开发过程中任何普通 Bug：

```text
FAIL → FIX → RETEST → PASS → CONTINUE
```

不得变成：

```text
FAIL → 停下来问用户
```

除非属于无法继续的外部硬阻塞。

---

## MVP Stop Rule

T001–T064 只实现冻结范围。

严禁顺手加入：

- AI
- 相机
- Torch
- 多手机
- 登录
- 云同步
- 支付
- iOS

完成冻结功能后直接 QA，不扩功能。
