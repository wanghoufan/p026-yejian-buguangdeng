# RESEARCH_REVIEW（Phase1 专用；内部 role ID `product-reviewer` 不变）

- Plan Version（评的是哪版 PRODUCT_PLAN）：`V2.1`（`PRODUCT_PLAN_V2.1`）
- Review Round（第几轮）：`Round 1`
- Result：**PASS** — expo-localization API 行为已验证（`getLocales()` 同步返回、`languageCode` 为 `string | null`、中文只返回 `'zh'`），语言映射规则完备，风险识别充分；发现 3 项 P1（非阻塞）和 2 项 P2，不阻塞开发。

- P0 / P1 / P2：
  - **P0**：0 项
  - **P1**（非 blocking）：
    1. **`getLocales()` 异常处理需真机验证**：计划已识别 `getLocales()` 可能抛错、返回空列表、`languageCode` 为 `null` 的情况，但实际异常行为需在 Phase2 真机验证。特别是 Android 低版本或定制 ROM 上 `getLocales()` 的返回值可能不符合预期。
    2. **首启闪屏"翻译控件暂缓呈现"方案需真机验证**：计划提出"画布先显示，翻译控件等语言初始化完成后再挂载"，但暂缓呈现的具体实现（loading 占位、条件渲染、Suspense 边界）和用户体验需在真机验证，确保不出现布局跳动或交互失效。
    3. **Android 运行中语言切换不跟随的边界需在 DoD 中明确测试**：计划明确"不跟随运行中系统语言变化"，但 Android 上用户可在设置中更改语言而不重启应用（官方文档明确说明）。需在 DoD 中增加测试用例：运行中切换系统语言后，应用内语言不变（除持久化偏好外）。
  - **P2**：
    1. **expo-localization `languageCode` 对中文只返回 `'zh'`**：无法区分简繁体（GitHub issue #34979 确认）。计划已正确处理（统一映射 `zh-CN`），但记录为已知限制。若后续支持繁体中文，需改用 `languageTag` 或 `languageScriptCode` 字段。
    2. **expo-localization 的 per-app language selection 本版不实现**：Android/iOS 系统设置中的 App 语言选项需要配置 `supportedLocales`，本版不实现。若后续需要"跟随系统"或系统级语言切换，需额外配置。

- Key Assumptions（逐条列＋是否成立）：
  1. **"用户口中的'中文'按简体中文 `zh-CN` 交付，英语按通用 `en` 交付；不区分地区英语"** — 成立。`languageCode` 返回不带 region code 的 BCP 47 标签，en-US、en-GB 都返回 `'en'`，zh-CN、zh-TW、zh-HK 都返回 `'zh'`（GitHub issue #34979 确认）。计划的映射规则正确。
  2. **"用户希望无有效持久化偏好时以设备首选语言作为启动默认：英语映射 `en`，其他语言回退 `zh-CN`"** — 成立。User Flow 第 1 步明确"设备首选语言为英语时显示英语，其他语言（含中文）回退简体中文"。
  3. **"现有 14 项是扫描时 `src/` 与 `app/` 的全部应用内固定语义文案"** — **成立，V2.0 已独立验证**。V2.1 沿用相同清点，未发现遗漏。
  4. **"`i18n-js` 与 `expo-localization` 在现有 Expo SDK 57 / React Native / TypeScript 环境可用"** — **成立，已外部验证**。Expo 官方文档（SDK 57）明确列出 `expo-localization` 支持 Android/iOS/tvOS/Web/Expo Go，`getLocales()` 为同步方法。`i18n-js` 4.5.3 兼容 RN 0.86 + React 19.2。
  5. **"现有预设的稳定 `id` 不随显示语言改变"** — 成立。presets.ts 中 8 个预设 id 是稳定的机器值。

- Verified Facts（已验证事实＋证据）：
  1. **expo-localization `getLocales()` API 行为**：
     - 同步方法，返回 `Locale[]` 数组，保证至少 1 个元素。
     - `languageCode` 类型 `string | null`，返回不带 region code 的 BCP 47 标签（如 `'en'`, `'es'`, `'pl'`, `'zh'`）。
     - `languageTag` 返回完整标签（如 `'en-US'`, `'pl-PL'`）。
     - 证据：[Expo SDK 57 localization API 文档](https://docs.expo.dev/versions/v57.0.0/sdk/localization/)
  2. **中文 `languageCode` 只返回 `'zh'`**：
     - 简体和繁体中文都返回 `'zh'`，无法区分。
     - GitHub issue #34979 确认此行为，建议返回 `'zh-Hans'` / `'zh-Hant'` 但标记为 "outdated"。
     - 计划的 "zh → zh-CN" 映射是正确的（因为无法区分，只能统一映射）。
     - 证据：[GitHub issue #34979](https://github.com/expo/expo/issues/34979)
  3. **Android 运行中语言切换行为**：
     - 官方文档明确："On Android, the user can change locale preferences in Settings without restarting apps."
     - 官方推荐使用 AppState API 监听变化并重新调用 `getLocales()`。
     - 计划明确"不跟随运行中系统语言变化"是产品决策，与官方推荐相反但合理。
     - 证据：[Expo Localization 指南](https://docs.expo.dev/guides/localization/)
  4. **expo-localization 在 Expo Go 中可用**：
     - 官方文档标注 `expo-localization` 支持 Expo Go。
     - 无需额外原生配置（Android "No additional set up necessary"）。
     - 证据：[Expo SDK 57 localization 文档](https://docs.expo.dev/versions/v57.0.0/sdk/localization/)
  5. **`getLocales()` 可能返回 `languageCode: null`**：
     - 官方文档标注 `languageCode` 类型为 `string | null`。
     - 计划已处理："`languageCode` 为 `null` / 异常值时回退 `zh-CN`"。
     - 证据：[Expo SDK 57 localization API 文档](https://docs.expo.dev/versions/v57.0.0/sdk/localization/)
  6. **i18n-js 兼容 Expo SDK 57**：
     - 最新版本 4.5.3（2026-03 发布），Snyk 评级 "SUSTAINABLE"，无安全漏洞。
     - Expo 官方文档明确推荐 `npx expo install i18n-js`。
     - 证据：[i18n-js npm 页面](https://www.npmjs.com/package/i18n-js)、[Expo Localization 指南](https://docs.expo.dev/guides/localization/)
  7. **V2.0 审查结论对比**：
     - V2.0 Round 1：2 项 P1（AsyncStorage 竞态、i18n-js React Context 集成），1 项 P2（expo-localization per-app language 扩展点）。
     - V2.1 新增 `expo-localization` 依赖，引入设备语言读取的新风险，但计划已识别并给出缓解措施。
     - V2.1 的 P1 数量增至 3 项（新增设备语言异常处理、闪屏方案、运行中语言切换边界），但均为非阻塞。

- External Sources（Web Search / Web Fetch / 官方文档 / 官方 GitHub / 第三方 / 社区反馈，附链接）：
  1. **Expo SDK 57 Localization API 文档**：https://docs.expo.dev/versions/v57.0.0/sdk/localization/ — `getLocales()` 同步方法、`Locale[]` 返回值、`languageCode` 类型 `string | null`、Android 无需额外配置。
  2. **Expo Localization 指南**：https://docs.expo.dev/guides/localization/ — 官方推荐 `i18n-js` + `expo-localization` 组合，Android 运行中语言切换行为说明。
  3. **Expo Localization 指南（Markdown）**：https://docs.expo.dev/guides/localization.md — 完整示例代码、`supportedLocales` 配置、`getLocales()[0].languageCode` 用法。
  4. **GitHub issue #34979**：https://github.com/expo/expo/issues/34979 — 中文 `languageCode` 只返回 `'zh'`，无法区分简繁体。
  5. **expo-localization 源码**：https://github.com/expo/expo/blob/main/packages/expo-localization/src/Localization.ts — `getLocales` 实现、`useLocales` hook、`addLocaleListener` API。
  6. **i18n-js npm 页面**：https://www.npmjs.com/package/i18n-js — 最新版本 4.5.3，2026-03-04 发布，自带 TypeScript 类型声明。
  7. **Expo SDK 57 版本参考**：https://docs.expo.dev/versions/latest/ — SDK 57.0.0 对应 RN 0.86 / React 19.2.3。

- Competitor Findings（竞品现状＋对本 Plan 的启示）：
  - 本轮是现有 App 的局部能力扩展，不依赖竞品功能判断。
  - 外部技术研究以 Expo 官方文档为依据：Expo 建议用 JS 翻译库（如 i18n-js）处理界面文案，`expo-localization` 用于读取设备 locale。
  - 2026 年常见做法是 i18next + react-i18next + expo-localization 组合，但 i18n-js 更轻量，适合本项目的简单中英切换场景。
  - 启示：i18n-js 的轻量特性适合本项目（仅两种语言、无复数/日期格式化需求），但需自行实现 React Context 集成。

- Counter-evidence（反对证据＋成功的相反做法）：
  1. **反对证据：`getLocales()` 对中文只返回 `'zh'`** — GitHub issue #34979 确认无法区分简繁体。但计划已正确处理（统一映射 `zh-CN`），且本版不支持繁体中文，不影响。
  2. **成功的相反做法：使用 `languageTag` 而非 `languageCode`** — `languageTag` 返回完整标签（如 `'zh-Hans-CN'`, `'zh-Hant-TW'`），可区分简繁体和地区。但本版只需区分中英，`languageCode` 足够。
  3. **反对证据：Android 运行中语言切换不跟随** — 官方推荐使用 AppState 监听变化并重新调用 `getLocales()`。但计划明确"不跟随运行中系统语言变化"是产品决策，避免用户困惑。
  4. **反对证据：expo-localization 需要配置 `supportedLocales` 才能在系统设置中显示 App 语言选项** — 本版不实现 per-app language selection，因此不需要配置。

- Unverified Items（未验证项＋验证方法）：
  1. **`getLocales()` 在 Android 真机上的异常行为** — 验证方法：Phase2 在 Android 真机上测试 `getLocales()` 抛错、返回空列表、`languageCode` 为 `null` 的情况，特别是低版本 Android 或定制 ROM。
  2. **首启闪屏"翻译控件暂缓呈现"的实际体验** — 验证方法：Phase2 真机测试首启流程，观察翻译控件暂缓期间是否出现布局跳动、交互失效或用户困惑。
  3. **Android 运行中语言切换不跟随的边界** — 验证方法：Phase2 真机测试运行中切换系统语言后，应用内语言是否保持不变。
  4. **英文 "Ambient purple" 在 4 列网格中的实际渲染** — 验证方法：开发阶段在 360×800dp 竖屏、800×360dp 横屏、1280×800dp 宽视口及系统大字体场景中实测。
  5. **AsyncStorage 竞态处理的具体实现** — 验证方法：开发阶段确定实现模式（队列串行 vs 序号标记）并编写竞态测试。

- Required Fixes（Planner 必须改项，打回依据）：
  - **无 P0 阻塞项，计划可进入 Human Gate。**
  - 建议 Planner 在开发阶段关注以下 P1 项（不阻塞计划审批）：
    1. `getLocales()` 异常处理：Phase2 真机验证 Android 上 `getLocales()` 的异常行为，确保回退逻辑正确。
    2. 首启闪屏方案：Phase2 真机验证"翻译控件暂缓呈现"的实际体验，确保无布局跳动或交互失效。
    3. 运行中语言切换边界：在 DoD 中增加测试用例，验证运行中切换系统语言后应用内语言不变。

- Plan Readiness Score（分项打分＋合计，口径以 PRODUCT_PLAN.template.md 为准）：
  - 产品目标与用户需求（20）：19 — 目标、设备语言首启映射、即时切换和持久化均明确。
  - 核心方案完整性（20）：19 — User Flow、页面入口、设备检测与偏好优先级、翻译边界均明确。
  - 外部事实与竞品验证（20）：19 — Expo 官方 `getLocales()` API 行为已独立验证，语言映射规则完备。
  - 技术可行性（15）：13 — 与现有 Expo Router、Context、AsyncStorage 结构匹配；新增 `expo-localization` 的安装、异常处理和真机行为仍属 Phase2 验证。
  - 风险与异常场景（10）：9 — 覆盖启动闪屏、设备 locale 异常、竞态、存储失败、可读性与导航回归。
  - 开发范围与 DoD（10）：10 — 14 项现有词条及设置页新增词条已清点，设备语言与持久化优先级有可执行验收。
  - 未决问题（5）：4 — 已记录用户的首启语言和范围决定，仍待 V2.1 Research Review 与 Human Gate。
  - 合计：**92 / 100**
  - Gate 判断：Readiness >= 90 AND P0 = 0 AND blocking P1 = 0 AND 关键事实已验证 AND 核心假设已合理验证 — **满足进 Human Review 条件**。

- Human-only Decisions（只需人类拍板项）：
  1. Human Gate 确认 V2.1 首启跟随设备语言：英语设备显示英语，其他语言回退简体中文。
  2. Human Gate 确认设置入口置于控制面板 Sheet 内固定区域，语言偏好独立于补光参数。
  3. Human Gate 确认 V2.1 仅交付 Android 应用内中英界面，不跟随运行中系统语言切换。

- Next Action：**进 WAITING_HUMAN_APPROVAL 找人** — 计划 Readiness Score 92/100，P0=0，blocking P1=0，关键事实已验证，核心假设已合理验证，满足 Gate 条件。
