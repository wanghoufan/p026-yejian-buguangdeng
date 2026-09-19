# 安卓补光灯 PLAN

> SDD 基线版本：V1.1  
> 目标产品版本：V1.0  
> 日期：2026-09-18  
> 状态：Implementation Ready / UI Freeze  
> 上游：Constitution V1.1 + SPEC V1.1  
> UI Reference：`2026-09-18 丨 macOS 丨 ChatGPT 丨 安卓补光灯-方案C UI Freeze设计板 丨 V1.1.png`

---

## 1. Technical Context

### 技术栈
- Expo
- React Native
- TypeScript
- npm
- Expo Router（单主页面）
- React Context + reducer
- AsyncStorage

### Expo 模块
- `expo-brightness`
- `expo-keep-awake`
- `expo-navigation-bar`
- `expo-status-bar`
- `react-native-reanimated`
- `react-native-gesture-handler`
- `@react-native-async-storage/async-storage`

### 色轮
首选：
- `reanimated-color-picker`

必须先通过 Expo Go Compatibility Gate。

---

## 2. Constitution Check

| Gate | Result |
|---|---|
| Expo + React Native + TypeScript | PASS |
| Android First | PASS |
| Expo Go First | PASS |
| Local First | PASS |
| Scheme C UI Freeze | PASS |
| 打开即补光 | PASS |
| Tap → Bottom Sheet | PASS |
| 色彩强度 / 屏幕亮度分离 | PASS |
| Activity brightness only | PASS |
| Emulator 开发 / 真机最终验证 | PASS |
| 无 AI/相机/Torch/后端 | PASS |
| Internal Gates 不暂停 | PASS |

---

## 3. Visual Design Tokens

建议集中放置：

`src/theme/tokens.ts`

### Core

```ts
export const ui = {
  accent: '#4C8DFF',
  textPrimary: '#14213A',
  textSecondary: 'rgba(20,33,58,0.62)',
  glassBg: 'rgba(248,252,255,0.76)',
  glassBorder: 'rgba(255,255,255,0.72)',
  inactivePill: 'rgba(255,255,255,0.36)',
  activePill: 'rgba(255,255,255,0.90)',
  trackInactive: 'rgba(35,64,96,0.16)',
  shadow: 'rgba(25,45,75,0.18)',
};
```

### Radius

```text
sheetTopRadius = 28dp
segmentedRadius = 22dp
presetRadius = 999dp
thumbRadius = 999dp
```

### Spacing

```text
screenPadding = 20dp
sheetHorizontal = 20dp
xs = 6dp
sm = 10dp
md = 16dp
lg = 20dp
xl = 28dp
```

### Typography

Android 使用系统默认 sans-serif。

```text
Tab = 15sp / Medium
Preset Label = 12sp / Regular
Slider Label = 14sp / Medium
Slider Value = 13sp / Medium
```

不引入自定义字体文件。

---

## 4. Responsive Layout

### Reference Viewport

设计参考：

```text
360 × 800 dp portrait
```

但实现必须响应式。

### Sheet Height

```text
target = screenHeight * 0.46
min = 340dp
max = 420dp
```

最终高度：

```text
clamp(target, 340, 420)
```

若内容因字体缩放/小屏导致溢出：
- 优先压缩垂直间距；
- 必要时 Sheet 内部轻量滚动；
- 不得把主功能裁出屏幕。

### Light Canvas

- absolute fill；
- 背景 = displayColor；
- Sheet Closed 时占满全屏；
- Sheet Open 时仍作为整个背景存在。

---

## 5. Component Architecture

```text
app/
├── _layout.tsx
└── index.tsx

src/
├── components/
│   ├── LightCanvas.tsx
│   ├── ControlSheet.tsx
│   ├── SegmentedTabs.tsx
│   ├── PresetPalette.tsx
│   ├── ColorWheelPanel.tsx
│   ├── LabeledSlider.tsx
│   ├── DragHandle.tsx
│   └── AppSplashVisual.tsx
├── constants/
│   ├── defaults.ts
│   └── presets.ts
├── hooks/
│   ├── useAppBrightness.ts
│   ├── useFillLightPersistence.ts
│   └── useSystemUi.ts
├── state/
│   ├── FillLightContext.tsx
│   └── fillLightReducer.ts
├── theme/
│   └── tokens.ts
├── types/
│   └── fillLight.ts
└── utils/
    ├── color.ts
    └── validation.ts

assets/
└── icon.png

__tests__/
├── color.test.ts
├── reducer.test.ts
├── brightness.test.ts
└── persistence.test.ts

docs/
└── qa/
    ├── android-emulator-v1.0.md
    ├── visual-freeze-v1.1.md
    └── final-human-gate-v1.0.md
```

---

## 6. State Model

```ts
type ColorSource = 'preset' | 'custom';
type ControlTab = 'preset' | 'wheel';

type FillLightState = {
  targetColor: string;
  colorSource: ColorSource;
  presetId: string | null;
  colorIntensity: number;
  screenBrightness: number;
  activeTab: ControlTab;
  isSheetOpen: boolean;
  isHydrated: boolean;
};
```

默认：

```text
targetColor = #FFF2E2
presetId = warm-white
colorSource = preset
colorIntensity = 1
screenBrightness = 1
activeTab = preset
isSheetOpen = false
```

持久化 Key：

`fill-light:v1:last-state`

---

## 7. Color Rendering

```text
display = round(255 × (1 - t) + target × t)
```

其中：
`t = clamp(colorIntensity, 0, 1)`

- 0 → white
- 1 → Target Color

---

## 8. Control Sheet Visual Specification

### Container
- 高度：responsive clamp；
- 顶部圆角：28dp；
- 背景：`glassBg`；
- 顶部 1dp 高光边框；
- Android elevation 建议 10–14；
- 不依赖真正 background blur 才能成立；
- 因底层大多是纯色，半透明玻璃层即可达到稳定效果。

### Drag Handle
- 36 × 4dp；
- radius 999；
- `rgba(20,33,58,0.18)`；
- 顶部 8dp。

### Segmented Tabs
- 高 44dp；
- 双列各 50%；
- 外层半透明；
- active 为高不透明度白色；
- active 文字/图标使用 `#4C8DFF`；
- inactive 使用 `textSecondary`。

### Presets
- 4 × 2；
- 圆形色块 48dp；
- 选中态 2dp Accent ring + 2dp gap；
- Label 居中；
- 列间距响应式分配。

### Color Wheel
- 目标直径 200–220dp；
- 小屏允许降到 180dp；
- 选择 indicator 18–22dp；
- 不改变 Slider 布局结构。

### Sliders
- 每项一行 Label + Value；
- Track 4dp；
- Thumb 20dp；
- active track = Accent；
- inactive track = token；
- 两个 Slider 垂直间距 18–22dp。

---

## 9. Motion

统一动画：

```text
Sheet open = 220ms easeOut
Sheet close = 200ms easeIn
Tab indicator = 160ms
Preset selection = 120ms
```

减少动画：
- 不做弹跳；
- 不做粒子；
- 不做光晕飞行动画；
- 不因选颜色而闪黑。

### Sheet Gesture
建议关闭阈值：

```text
drag distance >= 72dp
OR
downward velocity >= 900dp/s
```

未达到阈值则回弹展开。

---

## 10. Tap / Gesture Arbitration

优先级：

1. Slider gesture
2. Color wheel gesture
3. Sheet drag
4. Preset / Tab tap
5. Canvas tap

Sheet 内部交互必须 stop/隔离背景 tap。

---

## 11. System UI

### Status Bar
补光主界面隐藏。

### Navigation Bar
尽可能隐藏。

系统强制手势提示条允许保留。

### Splash
使用方案 C 视觉，但必须是系统级/极短启动过渡：
- 不加“继续”按钮；
- 不加入额外等待；
- 初始化完成立即进入主页面。

---

## 12. App Icon

视觉要求：

- Rounded-square Android launcher source；
- 柔和浅蓝 / 薄荷 / 粉紫渐变；
- 中央白色灯泡或光源 glyph；
- 低细节；
- 小尺寸仍清晰；
- 不放文字；
- 不复制竞品资产。

视觉稿作为方向参考；最终图标资源应由项目自己的 asset 提供。

---

## 13. Brightness Lifecycle

### active
- hydrate；
- apply app brightness；
- keep awake。

### background/inactive
- restore system brightness control。

### active again
- reapply saved brightness。

禁止 system-wide setter。

---

## 14. Persistence

保存：
- targetColor
- colorSource
- presetId
- colorIntensity
- screenBrightness
- activeTab

不保存：
- isSheetOpen
- isHydrated

色轮实时更新 UI，但仅 interaction end 持久化。

---

## 15. Testing Strategy

### Unit
- color interpolation；
- validation；
- reducer；
- persistence；
- brightness lifecycle mocks。

### Emulator
- UI；
- Sheet；
- gestures；
- presets；
- wheel；
- sliders；
- persistence；
- lifecycle；
- offline；
- responsive layout；
- Visual Freeze。

### Visual Freeze QA
在至少以下 viewport 截图对比：

```text
360×800dp
393×873dp（或最接近可用模拟器）
```

检查：
- 毛玻璃气质；
- Sheet 比例；
- 4×2 presets；
- 两个 Slider；
- 色轮；
- Tab；
- 无多余页面元素。

不要求像素级复制 AI 图。

### Physical Android
只在最终一次 Human Gate：
- brightness；
- keep awake；
- system UI；
- light-on-face；
- heat。

---

## 16. Continuous Development Strategy

T001–T064 均由 Orca 连续推进。

每个 Gate：

```text
Implement
→ Review
→ Test
→ Fix
→ Retest
→ Continue
```

不得暂停等用户。

T065 是唯一正常的人类验收点。

---

## 17. Risks

### R1 色轮 Expo Go 不兼容
M0 早期验证；失败则换兼容实现。

### R2 玻璃效果性能/兼容问题
不强依赖 blur；以半透明背景 + 边框 + elevation 模拟。

### R3 手势冲突
明确 arbitration；自动回归快速点击与 drag。

### R4 AI UI 图中的不现实细节
以本 PLAN token/尺寸为准。

### R5 Scope Creep
Constitution Freeze；不允许“顺手加功能”。

---

## 18. Definition of Done

自动阶段：

- [ ] T001–T064 PASS；
- [ ] tests PASS；
- [ ] lint PASS；
- [ ] typecheck PASS；
- [ ] Emulator QA PASS；
- [ ] Visual QA PASS；
- [ ] Scope Audit PASS；
- [ ] 交付 final human checklist。

最终：
- [ ] T065 真实 Android 手机 Final Human Acceptance PASS。

仅此时目标产品 V1.0 COMPLETE。
