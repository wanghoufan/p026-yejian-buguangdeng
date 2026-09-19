# 安卓补光灯 SPEC

> SDD 基线版本：V1.1  
> 目标产品版本：V1.0  
> 日期：2026-09-18  
> 状态：UI Freeze / Ready for Implementation  
> 上游：Constitution V1.1  
> UI 方向：方案 C「质感毛玻璃风」  
> 权威视觉参考：`2026-09-18 丨 macOS 丨 ChatGPT 丨 安卓补光灯-方案C UI Freeze设计板 丨 V1.1.png`

---

## 1. 产品目标

用户需要临时给朋友补光时，可以：

> **打开 App → 立即得到全屏光源 → 轻点补光区域 → 毛玻璃控制面板从底部滑出 → 选择预设或色轮 → 调节色彩强度/屏幕亮度 → 收起面板 → 继续全屏补光。**

目标不是做专业摄影系统，而是把手机快速变成一块好用的随身补光屏。

---

## 2. V1.0 非目标

不包含：

- 相机；
- 拍照；
- 美颜；
- Torch；
- AI；
- 自动场景推荐；
- 多手机灯组；
- 登录/账号；
- 云同步；
- 后端；
- Supabase；
- 支付/广告；
- iOS 发布。

---

## 3. UI Freeze

### 3.1 主视觉

采用方案 C：

> **质感毛玻璃风 / Soft Glass**

关键词：

- 浅色；
- 半透明；
- 大圆角；
- 轻阴影；
- 细描边；
- 低视觉噪声；
- 补光颜色仍是页面绝对主角。

### 3.2 UI 参考与规范冲突

视觉稿负责“看起来像什么”；本 SPEC 和 PLAN 负责“行为和尺寸”。

若视觉稿出现：
- 示例文字；
- 非 Android 状态栏；
- 示意比例；
- AI 生成细节误差；

不得照搬错误细节。

---

## 4. 核心术语

### Light Canvas
承担主要补光的全屏颜色区域。

### Control Sheet
底部滑出的毛玻璃控制面板。

### Target Color
预设色或色轮选中的原始颜色。

### Color Intensity
目标颜色相对白色的浓度。

### Screen Brightness
当前 App Activity 的物理屏幕亮度覆盖。

---

## 5. User Stories

## US1 [P1] — 打开即补光

**作为**要给朋友补光的人，  
**我希望**打开 App 后立即看到上次的补光颜色，  
**从而**不经过首页和设置页。

### Acceptance

#### 首次启动
- 默认 Target Color = 暖白；
- 默认色彩强度 = 100%；
- 默认屏幕亮度 = 100%；
- Control Sheet = Closed；
- 屏幕保持常亮；
- 状态栏尽可能隐藏。

#### 再次启动
- 恢复上一次 Target Color；
- 恢复色彩强度；
- 恢复屏幕亮度；
- Sheet 仍默认 Closed。

#### Splash
允许系统级 Splash 使用方案 C 图标/背景，但：
- 不得要求点击；
- 不得成为额外业务页面；
- 启动完成必须直接进入 Light Canvas。

---

## US2 [P1] — 轻点显示/隐藏控制面板

**作为**正在补光的人，  
**我希望**轻点屏幕即可调灯，  
**从而**不用一直让控件占据光源面积。

### Acceptance

- Sheet 隐藏时，轻点 Light Canvas → Sheet 自底部滑入；
- Sheet 显示时，轻点 Sheet 外 Light Canvas → Sheet 收起；
- Sheet 支持向下拖拽关闭；
- 操作 Tab、预设、色轮、Slider 时不得误关闭；
- Sheet 展开后上方仍持续显示补光颜色；
- Sheet 收起后不保留常驻按钮。

---

## US3 [P1] — 预设颜色

用户可直接点击 8 个冻结预设。

| ID | 名称 | HEX |
|---|---|---|
| warm-white | 暖白 | `#FFF2E2` |
| neutral-white | 中性白 | `#FFFFFF` |
| cool-white | 冷白 | `#EEF5FF` |
| cream | 奶油 | `#FFE9C7` |
| peach-pink | 桃粉 | `#FFD2CE` |
| rose-pink | 玫瑰粉 | `#FFB3C7` |
| ambient-purple | 氛围紫 | `#C9B6FF` |
| ice-blue | 冰蓝 | `#BBD7FF` |

### Acceptance

- 4 × 2 圆形色块布局；
- 点击后立即生效；
- 不出现确认按钮；
- 当前预设有清晰但轻量的选中环；
- 切预设不重置 Color Intensity。

---

## US4 [P1] — 色轮自定义颜色

### Acceptance

- Tab 可从「预设颜色」切换到「色轮」；
- 色轮拖动实时改变 Target Color；
- 当前选择位置有明显指示；
- 切换 Tab 本身不改变当前颜色；
- 自定义色选择后 `colorSource=custom`。

---

## US5 [P1] — 色彩强度

### 定义

`0% = #FFFFFF`  
`100% = Target Color`

### Acceptance

- 0–100% 连续可调；
- 调节即时反馈；
- 不影响 Screen Brightness；
- Label 显示「颜色强度」；
- 右侧显示百分比。

---

## US6 [P1] — 屏幕亮度

### Acceptance

- 0–100% 连续可调；
- Label 显示「屏幕亮度」；
- 右侧显示百分比；
- 只作用于当前 App Activity；
- 不修改系统全局亮度；
- App background/inactive 时系统重新接管；
- 返回 App 后恢复保存的 App 亮度。

---

## US7 [P2] — 本地状态恢复与离线

保存：

- targetColor；
- colorSource；
- presetId；
- colorIntensity；
- screenBrightness；
- activeTab。

不保存：

- isSheetOpen；
- 手势临时状态；
- 系统全局亮度。

### Acceptance

- 重启恢复最后状态；
- 本地数据损坏时安全回退；
- 飞行模式完全可用；
- 不发起网络请求。

---

## 6. Functional Requirements

### 启动
- **FR-001** 启动完成后必须直接进入 Light Canvas。
- **FR-002** 首次默认暖白。
- **FR-003** 首次 Color Intensity = 100%。
- **FR-004** 首次 Screen Brightness = 100%。
- **FR-005** 启动时 Sheet 必须 Closed。
- **FR-006** Splash 不得成为交互页面。

### Sheet
- **FR-007** 轻点 Light Canvas 打开 Sheet。
- **FR-008** 轻点 Sheet 外 Light Canvas 关闭 Sheet。
- **FR-009** 支持向下拖拽关闭。
- **FR-010** Sheet 内交互不得冒泡关闭。
- **FR-011** Sheet 展开时上方 Light Canvas 继续发光。

### 视觉
- **FR-012** Sheet 必须采用方案 C 浅色毛玻璃视觉。
- **FR-013** UI 固定 Accent = `#4C8DFF`。
- **FR-014** Sheet 顶部必须有 Drag Handle。
- **FR-015** Tab 必须是两段胶囊式 segmented control。
- **FR-016** 预设色必须为 4×2 圆形色块。
- **FR-017** Slider 必须使用统一组件样式。
- **FR-018** Sheet Closed 时不得存在常驻底部控制按钮。

### 颜色
- **FR-019** 必须包含冻结的 8 个预设。
- **FR-020** 预设由集中配置提供。
- **FR-021** 必须有「预设颜色 / 色轮」两个 Tab。
- **FR-022** 色轮必须实时改变 Target Color。
- **FR-023** Color Intensity 按白色→Target Color 插值。
- **FR-024** 切换预设/自定义颜色不得自动修改 Color Intensity。

### 亮度与系统
- **FR-025** Screen Brightness 仅控制当前 Activity。
- **FR-026** 不得写系统全局亮度。
- **FR-027** background/inactive 必须恢复系统控制。
- **FR-028** active 必须重新应用保存值。
- **FR-029** 补光期间保持屏幕常亮。
- **FR-030** 状态栏必须隐藏。
- **FR-031** 导航栏在 Android 允许范围内尽可能隐藏。

### 状态
- **FR-032** 最后状态必须本地持久化。
- **FR-033** 读取失败安全回退。
- **FR-034** 无网络完整运行。

### App Icon / Splash
- **FR-035** App Icon 采用方案 C：浅蓝/薄荷/粉紫柔和渐变 + 白色发光灯泡/光源符号。
- **FR-036** 图标不得直接复制任何竞品图标。
- **FR-037** Splash 与 App Icon 使用同一视觉语言。
- **FR-038** Splash 应尽可能短，不人为增加等待时间。

---

## 7. UI Dimensions & States

精确实现值由 PLAN 定义；以下是行为冻结：

### State A — Pure Light
- Sheet Closed；
- Light Canvas 全屏；
- 无业务按钮常驻。

### State B — Preset Sheet
- Sheet Open；
- Tab = 预设颜色；
- 4×2 预设；
- Color Intensity；
- Screen Brightness。

### State C — Color Wheel Sheet
- Sheet Open；
- Tab = 色轮；
- 色轮；
- Color Intensity；
- Screen Brightness。

---

## 8. Non-Functional Requirements

- **NFR-001** 调色视觉反馈无明显延迟。
- **NFR-002** Sheet 动画目标 220ms，允许 180–280ms。
- **NFR-003** 10 分钟连续操作不崩溃。
- **NFR-004** 完全离线。
- **NFR-005** 不采集用户数据。
- **NFR-006** 预设/Design Tokens/颜色算法集中管理。
- **NFR-007** Android First。
- **NFR-008** Expo Go 优先。
- **NFR-009** 无系统亮度修改权限。
- **NFR-010** Android 360dp 宽及以上常见手机不得出现横向溢出。
- **NFR-011** UI 必须通过 Scheme C Visual QA，不允许“功能对但视觉完全不同”。

---

## 9. Edge Cases

- 本地状态缺失/损坏 → 默认状态；
- HEX 非法 → 暖白；
- 强度/亮度越界 → clamp；
- 快速连续 Tap → 不重复叠加 Sheet；
- 色轮/Slider 手势 → 不关闭 Sheet；
- 系统强制手势提示条 → 可保留；
- 模拟器 Navigation Bar 异常 → 真机复核；
- 极矮屏幕 → Sheet 内容必须可完整操作，不允许按钮被裁死。

---

## 10. Final V1 Gate

自动阶段必须先完成：

- US1–US7 自动可验证项；
- lint/typecheck/tests；
- Android Emulator QA；
- Visual QA；
- Scope Audit。

然后且只在最后一次请求用户进行真实 Android 手机验收：

- 实际亮度；
- 亮度恢复；
- 常亮；
- 系统栏；
- 真正照人效果；
- 发热；
- 完整交互。

真机最终 Gate PASS 后，目标产品 V1.0 才可标记 COMPLETE。
