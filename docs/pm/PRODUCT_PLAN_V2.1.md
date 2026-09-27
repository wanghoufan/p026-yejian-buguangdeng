# PRODUCT_PLAN｜夜间补光灯多语言界面支持

- Plan Version：`V2.1`（`PRODUCT_PLAN_V2.1`）
- PROJECT_PHASE：`PLAN`
- Product Goal：让夜间补光灯的应用内界面支持简体中文与英语，首启按设备语言选择中英界面，用户可在设置页手动切换，切换立即生效且下次启动保留选择；翻译结构允许后续增加语言。
- Target Users：使用第二台 Android 手机补光的中文用户，以及需要英语界面的用户；沿用 V1.1 的单机、离线使用场景。
- Problem：当前可见文字和无障碍名称散落在组件与预设配置中，全部为中文；没有设置页或语言偏好。英语用户难以理解控制项，后续增添语言也容易遗漏文案。
- Core Value：保留“打开即补光”的操作路径，同时让所有当前应用内文案随语言选择一致切换；语言偏好离线可恢复。
- User Flow：
  1. 首次安装或无有效语言偏好时，直接进入原补光画布：设备首选语言为英语时显示英语，其他语言（含中文）回退简体中文。
  2. 点击画布打开控制面板，从面板内的“设置 / Settings”入口进入设置页；设置页显示当前语言及“简体中文 / English”两个选项。
  3. 点击另一语言后，设置页文字与无障碍名称立即更新；返回控制面板时，Tab、预设、滑条、恢复默认及设置入口均使用新语言。无需重启、重新加载或网络。
  4. 关闭并重启 App 后仍使用上次选择；“恢复暖白默认”仅恢复补光参数，不改变语言。

- Functional Scope：
  - **F1｜两种语言**：正式支持 `zh-CN`（简体中文，非英语设备首启回退）与 `en`（英语设备首启默认）。每一项当前应用内可见文字及无障碍名称都有对应翻译。数字百分比与颜色 HEX、稳定 ID 无需翻译。
  - **F2｜设置页**：在控制面板提供可发现、可触达的设置入口；新设置页包含标题、返回操作、语言分组、两个语言选项及当前选中状态。横竖屏和宽视口均可操作；返回后原颜色、强度、亮度与 Tab 不变。
  - **F3｜即时切换**：选中语言即同步更新 Provider 状态和已挂载组件；异步写入 AsyncStorage。快速连续切换以最后一次选择为准，不能被较早的读取或写入覆盖。
  - **F4｜持久化与回退**：独立存储语言偏好，读取空值、损坏值或不支持的语言码时按设备语言选择启动默认（英语→`en`，其他→`zh-CN`）；设备语言检测失败时回退 `zh-CN`；读取或写入失败不得使补光画布崩溃。写入失败应向用户显示可翻译的简短提示，并允许重试；成功写入后重启必须恢复。
  - **F5｜扩展结构**：集中维护受支持语言清单、语义化翻译键及每种语言的词典；增加日韩语时只需增加词典与选择项，不修改补光业务状态或各组件的条件分支。
  - **F6｜现有行为回归**：语言切换不得重置颜色、预设、色轮选择、滑条数值、亮度、Sheet 自动收起逻辑或现有持久化数据。

  **当前代码文案清点（扫描 `src/components/`、`src/constants/`、`src/state/`、`src/hooks/`、`app/`；按不同语义文案计 14 项，V2.1 首启规则不增加现有词条）：**

  | 来源 | 翻译键建议 | 当前简体中文 | 英语建议 | 数量 |
  |---|---|---|---|---:|
  | `ControlSheet.tsx` | `controls.colorIntensity`、`controls.screenBrightness` | 颜色强度、屏幕亮度 | Color intensity、Screen brightness | 2 |
  | `ControlSheet.tsx` | `tabs.presets`、`tabs.colorWheel`、`controls.resetWarmWhite` | 预设颜色、色轮、恢复暖白默认 | Presets、Color wheel、Reset to warm white | 3 |
  | `ColorWheelPanel.tsx` | `accessibility.colorWheel` | 色相色盘 | Hue color wheel | 1 |
  | `presets.ts` → `PresetPalette.tsx` | `presets.<稳定 ID>` | 暖白、中性白、冷白、奶油、桃粉、玫瑰粉、氛围紫、冰蓝 | Warm white、Neutral white、Cool white、Cream、Peach pink、Rose pink、Ambient purple、Ice blue | 8 |
  | **合计** | | | | **14** |

  `PresetPalette` 的屏幕文字与 `accessibilityLabel` 目前复用同一 `p.label`，故上表按一个语义文案计数，而非两个渲染位置。`LabeledSlider` 与 `SegmentedTabs` 只消费父组件传入的标签，无自身固定词条；`DragHandle`、`LightCanvas`、`app/index.tsx`、state 与 hooks 当前无可见文案。`app.json` 的启动器名称“夜间补光灯”属于系统壳文案，不计入上述 14 项，见 Out of Scope。

  **新设置页至少新增的语义文案（数量与 V2.0 相同）**：`settings.title`（设置 / Settings）、`settings.language`（语言 / Language）、`settings.back`（返回 / Back）、`settings.entry`（设置 / Settings，可与标题共用键）、`settings.saveFailed`（语言未能保存，请重试 / Language couldn't be saved. Try again）。语言选项用自称“简体中文 / English”，两种界面均保持可识别的自称；无障碍选中状态使用 React Native 的 `accessibilityState.selected`，不拼接硬编码中文。首启语言由设备信息决定，不增加新的界面词条。

- Out of Scope：
  - 本版不交付日语、韩语、繁体中文或其他语言的正式翻译；只为它们保留扩展位置。
  - 不在运行中实时跟随系统语言变化，也不提供“跟随系统”第三选项；设备语言仅在无有效持久化偏好时决定启动默认语言。
  - 不本地化 Android/iOS 启动器名称、系统设置中的 App 名、原生权限弹窗、商店文案或 README；以后如需覆盖原生资源，再单独评估 Expo 配置与平台资源。
  - 不改补光算法、预设 HEX/ID、布局视觉方案或 V1.1 的产品定位；不引入账号、后端、联网翻译、云同步或额外运行时权限。
  - 不对 iOS、Web 作本轮正式发布验收承诺；代码结构避免依赖 Android 专属语言 API。

- Technical Approach：
  - **方案选择**：依照 [Expo 官方本地化指南](https://docs.expo.dev/guides/localization/)，采用 JS 层 `i18n-js` 词典与 React Context/Provider。Android 的 `values/strings.xml` 适合原生资源，不能直接让当前 TSX 文案实时重渲染。新增 `expo-localization` 读取设备 locale，仅用于没有有效持久化语言偏好时的启动默认值；手动选择后以持久化偏好为准。按项目 Expo SDK 兼容版本执行 `npx expo install expo-localization i18n-js`，确认锁文件及离线打包。
  - **建议目录**：`src/i18n/locales/zh-CN.ts`、`src/i18n/locales/en.ts` 存放同构词典；`src/i18n/index.ts` 配置 `I18n`、默认 `zh-CN`、受支持语言及回退；`src/i18n/LanguageContext.tsx` 提供 `{ locale, setLocale, t, isReady }`；`src/hooks/useLanguage.ts` 只做消费入口；`app/settings.tsx` 呈现设置页。`LanguageProvider` 挂在 `app/_layout.tsx`，使主画布和设置页共享语言状态；`FillLightProvider` 也提升至路由根，确保页面导航不会重新初始化补光状态。
  - **状态边界**：语言是独立的应用偏好，不加入 `FillLightState`、`fillLightReducer` 或 `RESET_DEFAULTS`。Provider 使用受限 `Locale = 'zh-CN' | 'en'` 和稳定翻译函数；切换时先更新内存语言与 i18n 实例 locale，再触发 Context 重渲染。翻译函数在 Provider 上下文中读取当前 locale，避免仅改全局 `i18n.locale` 却没有 React 重渲染。
  - **组件最小改造**：`ControlSheet` 将 5 个固定文案改为 `t(key)` 并增加设置入口；`ColorWheelPanel` 的无障碍标签改为 `t(key)`；`PresetPalette` 用 `p.id` 查 `presets.<id>`，同一结果用于可见标签和无障碍标签。`PRESETS` 保留 `id` 与 `color`，移除作为显示真源的中文 `label`；`SegmentedTabs`、`LabeledSlider` 的通用 `label` prop 接口保持原样。`LightCanvas`、色轮手势、滑条手势、亮度与补光状态逻辑不动。
  - **设置呈现**：在 Expo Router 中增加设置页，保持主补光页的状态与返回路径；设置页入口放在 Sheet 固定可见区域，不因预设/色轮内容滚动而消失。进入设置页时关闭 Sheet 并清除自动收起计时；返回时保持 Sheet 关闭，由用户再点画布打开。设置页自身须适配横屏、小高度与字体放大。
  - **设备语言映射与启动顺序**：调用 `getLocales()`，取首项 `languageCode`；值为 `en` 映射 `en`，值为 `zh` 映射 `zh-CN`，其他值回退 `zh-CN`。先读取语言偏好：有有效的 `zh-CN` / `en` 持久化值时直接使用；无值或值无效时使用上述设备语言映射。`getLocales()` 抛错、返回空列表、首项缺失或 `languageCode` 为 `null` / 异常值时回退 `zh-CN`。画布继续立即渲染；翻译控件在偏好读取和必要的设备语言检测完成前暂缓呈现，避免语言闪屏。深链或异常路径若在初始化未完成前触发用户切换，以本次用户选择优先，异步读取与设备检测均不得覆盖它。手动切换成功持久化后，之后启动始终以持久化选择为准，不再用设备语言覆盖。
  - **回退与校验**：词典键在中英两份中保持集合一致，缺失翻译在开发/测试门禁报错，运行时回退简体中文。语言码只接受支持清单里的精确值。快速切换的 AsyncStorage 写入按顺序串行化或使用最后一次请求保护，确保最终持久值与界面一致。

- Data / API：
  - 不使用远程 API。新增独立 AsyncStorage 键（建议 `fill-light:v2:language`），值为字符串 `zh-CN` 或 `en`；键值名称在实现阶段冻结并有单元测试。现有 `fill-light:v1:last-state` 原样读取与写入，不迁移、清空或混入语言字段。
  - 读取异常、空值、非法 JSON（若实现采用 JSON 包装）或未知值按设备语言选择启动默认；设备检测失败或返回异常值时回退 `zh-CN`。语言选项点击后即时更新 UI，写入失败显示本地化提示并允许再次选择重试；不把失败伪装成已持久化成功。
  - `presetId`、`activeTab`、测试 ID、颜色值始终使用稳定机器值，不保存本地化显示词。

- Key Assumptions：
  - 用户口中的“中文”按简体中文 `zh-CN` 交付，英语按通用 `en` 交付；不区分地区英语。
  - 用户希望无有效持久化偏好时以设备首选语言作为启动默认：英语映射 `en`，其他语言回退 `zh-CN`；用户手动选择并成功持久化后，该选择覆盖设备语言。
  - 现有 14 项是扫描时 `src/` 与 `app/` 的全部应用内固定语义文案；新增设置页的文案也须入词典，开发时再次执行全量扫描。
  - `i18n-js` 与 `expo-localization` 在现有 Expo SDK 57 / React Native / TypeScript 环境可用；Provider 与当前 Context 可并存。此为有官方文档支持的可行性判断，仍需开发阶段安装与真机验证。
  - 现有预设的稳定 `id` 不随显示语言改变，因此语言切换不会改变选色或已存补光数据。

- Competitor / Research Summary：
  - 本轮是现有 App 的局部能力扩展，不依赖竞品功能判断。外部技术研究以 [Expo Localization 指南](https://docs.expo.dev/guides/localization/) 与 [Expo localization API 文档](https://docs.expo.dev/versions/latest/sdk/localization/) 为依据：Expo 建议用 JS 翻译库处理界面文案，`expo-localization` 用于读取设备 locale；官方示例使用 `i18n-js`。本版按官方 `getLocales()` / `languageCode` 接口检测首选设备语言，仅在无有效持久化偏好时使用；手动语言偏好保持最高优先级。
  - 尚未做英语母语用户文案评测；上表英语为实现基线草案，Research Reviewer 应检查术语与设置入口可发现性。

- Risks：
  - **启动闪屏**：异步读取偏好或判定设备语言时先显示错误语言的控件。缓解：画布先显示，翻译控件等语言初始化完成后再挂载。
  - **设备 locale 异常**：`getLocales()` 失败、列表或 `languageCode` 异常时无法判断启动语言。缓解：安全读取首项，只识别 `en` / `zh`，其他情况统一回退 `zh-CN`；覆盖异常测试。
  - **状态竞态**：连续点选、未完成读取和乱序写入会导致显示语言与下次启动语言不一致。缓解：用户点击优先、串行或末次写入保护，并覆盖竞态测试。
  - **词条遗漏**：预设无障碍标签或新增设置页文案可能保持中文。缓解：词典键集合校验、源码硬编码检查和双语真机逐屏验收。
  - **英语长度与大字体**：预设名如 `Ambient purple` 可能在 4 列网格被截断；现有预设文字固定 `numberOfLines={1}`。缓解：允许标签最多两行并调整格高，为英文与系统大字体做窄屏、横屏实测，同时保持 4×2 排列、8 色可辨与可点击。
  - **设置页干扰补光**：新增导航可能卸载画布或改变亮度/常亮状态。缓解：Provider 置于路由根，设置返回保留补光状态，并在真机测导航前后亮度与画布。
  - **存储失败**：设备存储不可用时无法兑现重启记忆。缓解：即时切换仍可用，明确提示保存失败，并保留重试入口；不阻断核心补光。

- DoD：
  - 首次安装或无有效持久化语言偏好时，设备首选语言为英语则应用内显示英语；设备首选语言为中文或其他语言则显示简体中文。语言键为空、非法或读取失败时采用同一设备检测规则；设备检测失败、返回空列表或异常值时回退简体中文。
  - 从控制面板能进入设置页，看到两个选项和正确选中状态；在设置页切换中英后当前页立即变化，返回控制面板的 14 项现有文案及其无障碍名称全部对应新语言，无需重启。
  - `zh-CN` 与 `en` 词典键集合完全一致；无 `missing translation` 占位、中文残留或英文页混用中文标签。新增设置入口、设置页、错误提示也覆盖两种语言。
  - 选择英语并冷启动后仍为英语；再选中文并冷启动后仍为中文。连续快速切换与异常路径下“启动加载偏好中切换”以最后一次用户选择为准。
  - 点击“恢复暖白默认”后语言不变；切换语言前后的颜色、强度、亮度、Tab、预设选择和历史补光持久数据不变。设置页返回后主画布仍可补光，Sheet 自动收起不发生异常。
  - 存储读取/写入异常不崩溃、不白屏；写入失败显示当前语言下的提示并可重试。飞行模式下全部语言操作可用，发布权限清单维持 V1.1 的零权限目标。
  - 英文 `Ambient purple` 等较长标签在 `360×800dp` 竖屏、`800×360dp` 横屏、`1280×800dp` 宽视口及至少一次系统大字体场景中可辨、可点击；设置页选项和返回操作可达，不发生关键文案裁切或控件重叠。
  - 代码验收执行 `npm run lint`、`npm run typecheck`、`npm test -- --runInBand` 并通过；新增有意义的测试覆盖语言键校验、英语/中文/其他设备语言启动映射、无效偏好与设备检测异常回退、手动偏好覆盖设备语言、即时切换、持久化恢复、快速切换竞态及 `RESET_DEFAULTS` 不影响语言。至少一台 Android 真机逐项验证切换、重启、横竖屏、设置导航、滑条/色轮回归与无障碍名称；若现行 V1.1 总体验收要求两台真机，V2.1 发布仍遵守该要求。
  - Phase1 只交付并评审本计划；Human Gate 批准后才可将 `PRODUCT_PLAN_V2.1` 设为开发基线并进入 Phase2。

- P0 / P1 / P2：
  - P0（非做不可）：当前计划层面 0 项未解决；开发阶段 F1–F4 与相应 DoD 为必须完成的 P0 功能。
  - P1（blocking / 非 blocking 注明）：blocking 0 项。非 blocking：Research Reviewer 校对英语词汇、设置页入口和 4 列预设在英文大字体下的可读性；其结论若发现无法达到 DoD，再升级为 blocking。正式发布仍需满足真机和 V1.1 既有质量门禁。
  - P2：日语、韩语、繁体中文词典；运行中实时跟随系统语言/“跟随系统”第三选项；原生启动器名称及商店元数据本地化；专业翻译管理平台。

- Human Decisions Needed：
  - Human Gate 已就 V2.0 第 1 项决定“随设备语言”：V2.1 首启英语设备显示英语，其他语言回退简体中文；仍待 Research Review 后按新计划完成 Human Gate 审批。
  - 已确认设置入口置于控制面板 Sheet 内固定区域，不随预设/色轮滚动消失；语言偏好独立于补光参数，“恢复暖白默认”不重置语言。
  - 已确认 V2.1 仅交付 Android 应用内中英界面；App 启动器名称不本地化，日韩等其他语言留后续版本。新计划获批前不开始业务开发。

- Readiness Score（Plan Readiness Score / 计划成熟度，满分 100）：
  - 产品目标与用户需求（20）：19。目标、设备语言首启映射、即时切换和持久化均明确；新增决策尚待 V2.1 Human Gate 正式批准。
  - 核心方案完整性（20）：19。User Flow、页面入口、设备检测与偏好优先级、翻译边界均明确；设置页细部视觉由既有设计系统落地。
  - 外部事实与竞品验证（20）：18。Expo 官方 `getLocales()` / `languageCode` 与安装指令已核对；英语术语尚待 Research Reviewer 校对。
  - 技术可行性（15）：13。与现有 Expo Router、Context、AsyncStorage 结构匹配；新增 `expo-localization` 的安装、异常处理和真机行为仍属 Phase2 验证。
  - 风险与异常场景（10）：9。覆盖启动闪屏、设备 locale 异常、竞态、存储失败、可读性与导航回归。
  - 开发范围与 DoD（10）：10。14 项现有词条及设置页新增词条已清点，设备语言与持久化优先级有可执行验收。
  - 未决问题（5）：4。已记录用户的首启语言和范围决定，仍待 V2.1 Research Review 与 Human Gate；无未定义的 blocking 产品问题。
  - 合计：`92 / 100`。
  - Gate（进 Human Review 条件）：Readiness >= 90 AND P0 = 0 AND blocking P1 = 0 AND 关键事实已验证 AND 核心假设已合理验证。
  - Gate 判断：V2.1 自评满足分数与当前 P0/P1 条件，关键工程事实由 V2.0 代码扫描核实，设备语言 API 有 Expo 官方文档支持；仍待 Research Reviewer 独立审查，现阶段不能标记为 `READY_FOR_HUMAN_REVIEW`。
- Research Review Round（第几轮/Reviewer 结论摘要）：`Round 1 / PASS（92/100，P0=0，blocking P1=0；3 项 P1 非阻塞：getLocales() 真机异常行为、闪屏方案体验、运行中语言切换边界测试；2 项 P2：中文 languageCode 只返回 zh、per-app language selection 未实现）`。
- PLAN_GATE：`READY_FOR_HUMAN_REVIEW`
