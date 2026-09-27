# CODE REVIEW

- Task: V2.1 多语言功能（F1–F5：i18n 词典 / LanguageContext / 设置页 / 组件改造 / 持久化）
- Commit: 本轮 builder 未提交，按工作区现场审查（16 个新增/修改文件）
- Reviewer: code-reviewer
- Result: 过（PASS）

> Dispatch / Evidence ID 系字段 2.0 已废弃，不填。

## P0 / P1 Findings

- 无。

逐项核验记录（审查要点覆盖）：

1. **架构合理性**
   - 串行写链 + 末次请求保护正确：`persist()`（src/i18n/LanguageContext.tsx:83-94）以 `writeChain` 串接写入、`lastWrite` 序号保证只有最后一次请求能改写 `saveError`；快速切换时最终持久值与界面最后选择一致，且有专门测试覆盖（__tests__/language-context.test.tsx:136-151）。
   - 启动优先级正确：有效持久化偏好 > 设备语言映射 > zh-CN 兜底（src/i18n/index.ts:48-54）；初始化未完成时用户先切换以本次选择为准，迟到的读取不会覆盖（`userChosen` 保护，LanguageContext.tsx:73，有测试）。
   - `isReady` 前不挂含翻译文案的控件有效：画布无文案可先渲染（app/index.tsx:27 `{state.isSheetOpen && isReady && <ControlSheet />}`），设置页 ready 前返回空白壳（app/settings.tsx:23-29）。补光状态 HYDRATE 强制 `isSheetOpen=false`，首帧不会出现"该挂没挂"的 Sheet。
   - `FillLightProvider` 提升至 _layout.tsx 无副作用：语言 Context 与补光状态零耦合（Provider 不暴露补光字段，有测试 language-context.test.tsx:187-191）；expo-router Stack 下 index 页保持挂载，状态跨页面存续，行为不变。
2. **代码质量**
   - Locale 类型严格：`SUPPORTED_LOCAS as const` 派生 `Locale` 字面量联合（src/i18n/index.ts:9-10），`isSupportedLocale` 做运行时收窄，存储值只认精确枚举。
   - 错误处理完备：AsyncStorage 读失败→按无偏好处理（LanguageContext.tsx:68-72）；`getLocales()` 抛错/空列表/首项缺 languageCode→null→回退 zh-CN（LanguageContext.tsx:35-44，均有测试）。
   - `findMissingKeys` 双向校验（缺+多）+ 开发期 console.error 门禁（index.ts:80-98）。
   - 组件改造最小侵入：ControlSheet/ColorWheelPanel/PresetPalette 仅替换文案来源与新增设置入口，手势/节流/持久化逻辑未动；`PRESETS` 移除 label 后无 `p.label` 残留引用（已 grep 确认）。
3. **Builder 额外决定**
   - `--force` 安装：本仓 react-dom/react peer 冲突是既有状态，`--legacy-peer-deps` 会静默删 peer 包导致 Metro 打包挂掉，`--force` 是本仓既定做法——认可。
   - `settings.retry` 词条：settings.tsx:87 实际使用，词典双语齐备——认可。
   - `numberOfLines` 1→2 + 居中：英文 "Ambient purple" 需要两行，中文仍单行视觉不变；改动仅 2 行——认可。
   - app.json 增 `expo-localization` 插件：expo-localization ~57 的标准配置，依赖已在 package.json（~57.0.2，与 expo ~57 对齐）——认可。
4. **验证结果（审查者本机复跑）**
   - `jest`（i18n + language-context 两套件）：21/21 通过。
   - `tsc --noEmit`：0 错误。
   - `eslint`（全部改动文件）：0 告警。
   - 硬编码中文扫描：src/app 下 UI 字符串无中文残留（仅注释与词典文件，属正常）；en 词典有测试保证不混入中文。

## P2 / P3 Backlog Findings

- **P2｜词典门禁未覆盖 PRESETS id 与词典的对应**：`findMissingKeys()`（src/i18n/index.ts:80-90）只校验"词典 vs 词典"，不校验 `PRESETS` 的 id 是否都有 `presets.<id>` 词条；目前靠测试（__tests__/i18n.test.ts:54-63）兜底。若后续新增预设且漏配词条，生产上会渲染 i18n-js 的 missing 译文串。建议：把 `PRESETS` id 检查并入开发期门禁（index.ts:93-98 同一处 console.error）。
- **P2｜`presets.${p.id}` 动态键无编译期保障**：PresetPalette.tsx:20 的模板字符串键绕过了 TS 的键检查。与上一条同根，随门禁补齐即可，无需单独改组件。
- **P2｜保存失败后离开设置页，偏好静默回退**：`saveError` 只在设置页展示（app/settings.tsx:79-89）；写入失败后用户直接返回，本次语言选择仅本次会话生效，下次启动回旧值且无任何提示。可接受的降级（有 retry 通道），记 backlog：可在画布页也挂轻提示，或失败时本地缓存待下次启动重写。
- **P3｜设置页错误条与卡片宽度不一致**：error 条复用 `cardWide`（maxWidth 560，settings.tsx:84）而语言卡片 maxWidth 480（settings.tsx:116,124），宽屏下两者右缘不齐。纯视觉，不影响功能。
- **P3｜测试缺口（backlog，不阻塞）**：① `retrySave` 再次失败路径未测（仅测了成功路径，language-context.test.tsx:153-165）；② 设置页/PresetPalette 无组件级语言切换渲染测试；③ `translate` 带参数插值未测（当前业务无参数词条，暂无风险）。
- **P3｜`translate()` 每次调用改写全局 `i18n.locale`**（src/i18n/index.ts:60-63）：JS 单线程下按"设 locale→取词"同步执行无竞态，但这是模块级可变共享状态；将来若引入并发取词或多 Provider 会踩坑。当前规模无需改，记为已知约束。

## 结论

多语言链路（词典 → 检测 → 决策 → 持久化 → 竞态 → 失败重试 → 组件消费）实现正确且测试充分，4 项 builder 额外决定均有依据，审查者本机复跑测试/typecheck/lint 全绿。PASS，P2 项不阻塞，转入 backlog 由后续任务消化。
