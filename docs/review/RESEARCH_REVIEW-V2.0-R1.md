# RESEARCH_REVIEW（Phase1 专用；内部 role ID `product-reviewer` 不变）

- Plan Version（评的是哪版 PRODUCT_PLAN）：`V2.0`（`PRODUCT_PLAN_V2.0`）
- Review Round（第几轮）：`Round 1`
- Result：**PASS** — 计划文案清点完整（14 项全部核实）、技术方案可行（i18n-js 兼容 Expo SDK 57、Provider 提升方案正确）、外部验证充分；发现 2 项 P1（非 blocking）和 1 项 P2，不阻塞开发。

- P0 / P1 / P2：
  - **P0**：0 项
  - **P1**（非 blocking）：
    1. AsyncStorage 竞态处理方案方向正确但实现细节不足：计划提到"串行化或末次写入保护"，未明确具体模式（队列串行 vs 序号标记末次写入）。开发阶段需确定实现方案并覆盖竞态测试。
    2. i18n-js 的 React 集成需自行实现 Context：i18n-js 是纯 JS 库，不绑定 React。计划已提到 LanguageContext 设计，但需确保 `t` 函数在 Context 变化时能正确触发重渲染，避免仅改全局 `i18n.locale` 却无 React 重渲染的问题。
  - **P2**：
    1. expo-localization 的 per-app language selection（Android/iOS 系统设置中的 App 语言选项）本版不实现，但值得记录为未来扩展点。若后续需要"跟随系统"或系统级语言切换，需引入 expo-localization 并配置 `supportedLocales`。

- Key Assumptions（逐条列＋是否成立）：
  1. **"用户口中的'中文'按简体中文 `zh-CN` 交付"** — 成立。计划明确 `zh-CN` 为默认语言，`en` 为英语，不区分地区变体。
  2. **"用户希望手动且持久控制语言，首次打开固定中文"** — 成立。User Flow 第 1 步明确"首次安装或无有效语言偏好时，直接进入原补光画布，界面使用简体中文，不因系统语言为英语而自动切换"。
  3. **"现有 14 项是扫描时 `src/` 与 `app/` 的全部应用内固定语义文案"** — **成立，已独立验证**。源码扫描确认：ControlSheet.tsx 5 项、presets.ts 8 项、ColorWheelPanel.tsx 1 项，合计 14 项，无遗漏。所有中文字符串均在注释中（不渲染）或已计入清点表。
  4. **"`i18n-js` 在现有 Expo SDK 57 / React Native / TypeScript 环境可用"** — **成立，已外部验证**。i18n-js 最新版本 4.5.3（2026-03 发布），Snyk 评级 "SUSTAINABLE"，无已知安全漏洞，每周 512k 下载，自带 TypeScript 类型声明。Expo 官方文档明确推荐 `npx expo install i18n-js`。Expo SDK 57 使用 React Native 0.86 + React 19.2，无 breaking changes。
  5. **"现有预设的稳定 `id` 不随显示语言改变"** — 成立。presets.ts 中 8 个预设 id（warm-white, neutral-white, cool-white, cream, peach-pink, rose-pink, ambient-purple, ice-blue）是稳定的机器值，不随语言切换改变。

- Verified Facts（已验证事实＋证据）：
  1. **文案清点完整**：计划列出的 14 项文案全部在源码中定位：
     - ControlSheet.tsx:117 "颜色强度"、:127 "屏幕亮度"、:177 "预设颜色"、:178 "色轮"、:208 "恢复暖白默认"
     - presets.ts:4-11 八个预设 label（暖白、中性白、冷白、奶油、桃粉、玫瑰粉、氛围紫、冰蓝）
     - ColorWheelPanel.tsx:123 "色相色盘"
     - 无遗漏：`src/` 和 `app/` 中所有中文字符串均在注释中（不渲染）或已计入清点表。`app.json` 的 "name": "夜间补光灯" 是启动器名称，计划已正确排除。
  2. **i18n-js 兼容 Expo SDK 57**：npm 最新版本 4.5.3（2026-03-04 发布），Snyk 维护评级 "SUSTAINABLE"，无安全漏洞，512k 周下载。Expo 官方文档（docs.expo.dev/guides/localization）明确推荐 `npx expo install i18n-js`。Expo SDK 57 changelog 确认 React Native 0.86 无 breaking changes。
  3. **expo-localization 非必需**：官方文档将 expo-localization 定位为"读取设备 locale"的工具。计划选择"手动选择 + 固定中文首启"，不读取设备 locale，判断正确。expo-localization 的 `supportedLocales` 配置用于 Android/iOS 系统设置中的 per-app language selection，本版不需要。
  4. **FillLightProvider 提升至路由根正确且必要**：当前 FillLightProvider 在 `app/index.tsx` 中。新增设置页（`app/settings.tsx`）后，设置页无法访问 FillLightContext。Expo Router 官方文档明确：`_layout.tsx` 是放 context providers 的地方（"This file is where you would put initialization code... such as loading fonts, interacting with the splash screen, or adding context providers"）。提升到 `_layout.tsx` 后，所有路由页面共享同一个 Provider 实例，导航不会重新初始化状态。
  5. **预设 id 稳定**：presets.ts 中 8 个预设 id 是稳定的机器值，不随语言切换改变。计划中 `presets.<id>` 的翻译 key 设计合理。
  6. **AsyncStorage 竞态处理方向正确**：AsyncStorage 所有方法返回 Promise，无内置串行化机制。计划提到"串行化或末次写入保护"方向正确，但需开发阶段确定具体实现模式。
  7. **英语文案可接受**："Ambient purple" 在 4 列网格中可能较长，计划已识别风险并给出缓解措施（允许两行、调整格高、实测验证）。其他翻译如 "Color intensity"、"Screen brightness"、"Reset to warm white" 都是标准用语。

- External Sources（Web Search / Web Fetch / 官方文档 / 官方 GitHub / 第三方 / 社区反馈，附链接）：
  1. **Expo 官方 Localization 指南**：https://docs.expo.dev/guides/localization/ — 明确推荐 `npx expo install i18n-js`，使用 `expo-localization` 读取设备 locale。
  2. **Expo SDK 57 Changelog**：https://expo.dev/changelog/sdk-57 — 确认 React Native 0.86 无 breaking changes，React 19.2 不变。
  3. **Expo SDK 57 版本参考**：https://docs.expo.dev/versions/latest/ — SDK 57.0.0 对应 RN 0.86 / React 19.2.3。
  4. **i18n-js npm 页面**：https://www.npmjs.com/package/i18n-js — 最新版本 4.5.3，2026-03-04 发布，自带 TypeScript 类型声明。
  5. **i18n-js Snyk 安全报告**：https://security.snyk.io/package/npm/i18n-js — 维护评级 "SUSTAINABLE"，无已知安全漏洞，512k 周下载。
  6. **Expo Router Layout 官方文档**：https://docs.expo.dev/router/basics/navigation-layouts/ — 明确 `_layout.tsx` 是放 context providers 的地方。
  7. **Expo Localization API 文档**：https://docs.expo.dev/versions/latest/sdk/localization — expo-localization 用于读取设备 locale，`supportedLocales` 用于 per-app language selection。
  8. **AsyncStorage FAQ**：https://github.com/react-native-async-storage/async-storage/blob/main/docs/faq.md — AsyncStorage 只存字符串，所有方法返回 Promise，无内置串行化机制。

- Competitor Findings（竞品现状＋对本 Plan 的启示）：
  - 本轮是现有 App 的局部能力扩展，不依赖竞品功能判断。
  - 外部技术研究以 Expo 官方文档为依据：Expo 建议用 JS 翻译库（如 i18n-js）处理界面文案，`expo-localization` 用于读取设备 locale。
  - 2026 年常见做法是 i18next + react-i18next + expo-localization 组合（见 Medium 文章），但 i18n-js 更轻量，适合本项目的简单中英切换场景。
  - 启示：i18n-js 的轻量特性适合本项目（仅两种语言、无复数/日期格式化需求），但需自行实现 React Context 集成。

- Counter-evidence（反对证据＋成功的相反做法）：
  1. **反对证据：i18n-js 维护频率较低** — Snyk 显示最后一次发布在 2026 年 3 月（约 6 个月前），GitHub 有 9 个 open issues、4 个 open PR。但 Snyk 仍评级 "SUSTAINABLE"，且对于纯前端翻译库来说足够稳定。
  2. **成功的相反做法：i18next + react-i18next** — 更流行的方案是 i18next + react-i18next，提供开箱即用的 React 集成（useTranslation hook）、Suspense 支持、命名空间等。但本项目仅两种语言、无复杂需求，i18n-js 的轻量特性更合适。
  3. **反对证据：expo-localization 的 per-app language selection** — 如果不装 expo-localization，Android/iOS 系统设置中不会出现 App 语言选项。但本版计划明确不跟随系统语言，因此不影响。

- Unverified Items（未验证项＋验证方法）：
  1. **i18n-js 在 Expo Go 中的实际运行** — 验证方法：开发阶段在 Expo Go 中测试语言切换功能。
  2. **FillLightProvider 提升后设置页的补光状态保持** — 验证方法：开发阶段真机测试导航前后亮度与画布状态。
  3. **英文 "Ambient purple" 在 4 列网格中的实际渲染** — 验证方法：开发阶段在 360×800dp 竖屏、800×360dp 横屏、1280×800dp 宽视口及系统大字体场景中实测。
  4. **AsyncStorage 竞态处理的具体实现** — 验证方法：开发阶段确定实现模式（队列串行 vs 序号标记）并编写竞态测试。

- Required Fixes（Planner 必须改项，打回依据）：
  - **无 P0 阻塞项，计划可进入 Human Gate。**
  - 建议 Planner 在开发阶段关注以下 P1 项（不阻塞计划审批）：
    1. AsyncStorage 竞态处理：开发阶段需确定具体实现模式（队列串行化 or 序号标记末次写入），并覆盖竞态测试。
    2. i18n-js React 集成：确保 LanguageContext 的 `t` 函数在 Context 变化时能正确触发重渲染。

- Plan Readiness Score（分项打分＋合计，口径以 PRODUCT_PLAN.template.md 为准）：
  - 产品目标与用户需求（20）：19 — 目标、首启默认、即时切换和持久化均明确；中文地区变体待 Human Gate 确认。
  - 核心方案完整性（20）：19 — User Flow、页面入口、翻译边界和状态边界明确；设置页细部视觉由既有设计系统落地。
  - 外部事实与竞品验证（20）：19 — Expo 官方技术资料已核对，i18n-js 兼容性已独立验证，expo-localization 必要性已确认。
  - 技术可行性（15）：14 — 与现有 Expo Router、Context、AsyncStorage 结构匹配；依赖安装和真机仍属 Phase2 验证。
  - 风险与异常场景（10）：9 — 覆盖启动闪屏、竞态、存储失败、可读性与导航回归。
  - 开发范围与 DoD（10）：10 — 14 项现有词条逐项定位，F1–F6 与可执行验收对应。
  - 未决问题（5）：4 — 仅有 Human Gate 对默认语言定义与范围的正式确认，无未定义的 blocking 产品问题。
  - 合计：**94 / 100**
  - Gate 判断：Readiness >= 90 AND P0 = 0 AND blocking P1 = 0 AND 关键事实已验证 AND 核心假设已合理验证 — **满足进 Human Review 条件**。

- Human-only Decisions（只需人类拍板项）：
  1. Human Gate 确认本版将"中文"定义为简体中文，并固定首次默认中文，不自动跟随设备语言。
  2. Human Gate 确认设置入口置于控制面板、语言偏好独立于补光参数，以及"恢复暖白默认"不重置语言。
  3. Human Gate 确认 V2.0 仅交付 Android 应用内中英界面，原生名称与其他语言留后续版本。

- Next Action：**进 WAITING_HUMAN_APPROVAL 找人** — 计划 Readiness Score 94/100，P0=0，blocking P1=0，关键事实已验证，核心假设已合理验证，满足 Gate 条件。
