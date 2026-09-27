# HANDOFF｜交接（暂停/恢复用，先读我）

> ⚠️ 下面 1–32 行的状态块是 **2026-09-20 的 V1.1 快照，已过期**；V2.1（多语言）的现状见文末「2026-09-27 增补」。

> 当前唯一现役交接：夜间补光灯 V1.1 Phase2，开发**暂停（大交接）**，未提交、未推送。

- Captured at（YYYY-MM-DD HH:MM）：2026-09-20 12:30
- PROJECT_PHASE：`DEVELOP`（Human Gate 批准，Phase2 启动）
- PLAN_VERSION：`PRODUCT_PLAN_V2.1`
- PLAN_READINESS_SCORE：（Phase1 已结束，不适用）
- PLAN_GATE：`APPROVED`
- DEV_BASELINE：`PRODUCT_PLAN_V2.1`
- CHANGE_REQUEST：`NONE`
- Stage ID（本阶段叫什么）：夜间补光灯 V2.1 多语言支持 开发
- 剩 P0（没完的才列，多一条都不行）：**无，0 条**
- 当前 Task（正干到哪）：Phase2 启动——多语言功能开发（builder 写→reviewer→qa→supervisor）
- 执行链/Session：codebuddy 通道恢复可用（用户拍板后实测直调成功，serve 63928）；override 表 builder 行已更新。
- 未闭环评审意见：无（reviewer P1-1 误判已更正转 PASS；supervisor 三轮终判 PASS）。
- docs 落盘清单（本轮新增/改了哪几个 docs 文件）：
  - 本文件 `docs/handoff/HANDOFF.md`（更新关闭）
  - `__tests__/sheet-scroll.test.tsx`（新）、`src/components/ControlSheet.tsx`、`src/constants/presets.ts`
  - `docs/review/CODE_REVIEW-V1.1-03R1.md`（新）、`docs/qa/V1.1-03R1-qa.md`（新）
  - `docs/model/TASK-MODEL-LOG.jsonl`、`docs/model/DISPATCH-LOG.jsonl`、`USER_MODEL_OVERRIDE.md`
  - neat-freak 时效标注：`docs/qa/v1.1-static-qa.md`、`docs/qa/visual-freeze-v1.1.md`、`docs/qa/android-emulator-v1.0.md`、`docs/qa/final-human-gate-v1.0.md`、`docs/store-copy.md`
- 下一步（Next Single Action）：**无 P0，收工**（要发版/提测由用户下指令；仍不 commit 不 push）。
- T-V1.1-04（Change A 滑条专项，待用户复验）：症状=拇指 100% 右半被裁＋往右再往左拖脱离滑不动；修法已在树内（`LabeledSlider.tsx`：rail 内缩一半径＋blockNativeResponder/cancelable={false}＋onTouchCancel 不判死＋onLayout 预热 measure），Metro 新 bundle 已自证含修法，门禁 lint0/tsc0/jest9/43；App 已冷启，用户复验中。codebuddy 长任务两轮 10 分钟零输出卡死（探针秒回），长任务改走短拆或本窗口直做。
- 双机推送后打不开事件（2026-09-20）：两台手机 `adb reverse tcp:8081` 映射丢失（主力机只剩 8083），debug 包够不着 Metro → 红屏 Unable to load script；补映射＋冷启后两台均恢复。教训：每次推包/复验前先 `adb -s <号> reverse --list` 确认 8081 在列。
- 最终包（2026-09-20）：`assembleRelease` 成功（`app-release.apk` 96MB），release 合并清单三处 INTERNET=0（DoD 零权限保住），两台手机均装 release 版并冷启验证为补光画布（无 debugger 条=release 自带 JS，不依赖 Metro，断网可用）。公开仓库已建并推送：https://github.com/wanghoufan/yejian-buguangdeng（main；仓库名用拼音，避开美国 Fill Light 商标）。
- 人要拍什么板（列出来问，不问不许开工）：
  1. ~~builder / qa 通道~~ 已决：全走 codebuddy（主 deepseek-v4.1-flash、备 glm-5.3-flash），override 表已更新。
  2. ~~A4 预设组~~ 已决：改成 Plan 那套并落盘（8 色 id/名/HEX 照 SPEC US3 表）。
- permission_request：无
- permission_request：无
- 收尾记一笔（neat-freak）：**已派并完成**。文档对齐：5 个文件加时效/归属标注（正文未改）；残留清理：根、`docs/`、`docs/plan/` 下 `.DS_Store` 已删；未决项已列全（见上"人要拍什么板"）。仍剩 `android/.DS_Store`、`android/app/.DS_Store`、`.git/.DS_Store`（授权范围外，未动，可安全删除）。

## 恢复读盘（全体系唯一顺序，别乱）

1. AGENTS；2. 角色卡；3. 根 `USER_MODEL_OVERRIDE.md`；4. 本 HANDOFF；5. 根 `经验一句话.md`；6. 任务目标放最后。
冲突才扩大读。

---

## 1. 当前工作进展

### 1.1 环境三项阻塞：本次实测**已全部解除**（旧 HANDOFF 结论已过期）

| 项 | 旧结论 | 2026-09-20 实测 |
|---|---|---|
| Clash Verge 7897 | 无监听 | `nc -z 127.0.0.1 7897` → OPEN；`curl -x http://127.0.0.1:7897 https://services.gradle.org` → **200**（旧 `lsof` 看不到只是因为它跑在 root 下，不是没起） |
| `~/.gradle` 可写 | 不可写 | `test -w "$HOME/.gradle"` → **WRITABLE**；`gradle-9.3.1-bin` 已在 wrapper 缓存 |
| ADB | daemon 起不来 | daemon 正常；`adb devices -l` 两台在列；`adb reverse` 可用 |

### 1.2 真机复验矩阵（设备 `IN9LZTAYV4UGU4JF`，小米 22041216UC / 1080×2460 / 440dpi，横屏 2460×1080）

| 项 | 结果 | 证据 |
|---|---|---|
| 面板打开/收起 | PASS | 点画布开、再点关；两态截图 hash 稳定复现 |
| 色轮 | PASS | 切 tab 出色盘；盘上选色 → 画布由 `#FFF2E2` 变蓝 |
| 颜色强度滑条 | PASS | 拖至中点，UI `100%` → `50%` |
| 屏幕亮度滑条 | PASS | 拖至中点，UI `100%` → `50%` |
| 横竖屏旋转 | PASS（不闪退） | 2460×1080 正常出图，进程未重启 |
| 自动收起 | PASS | 竖屏、横屏各静置 7s 后面板均自动收起 |
| 恢复暖白默认 | PASS | 画布回到 `#FFF2E2`，面板回「暖白选中 / 100% / 100%」（截图与基线字节数一致） |
| 无 `layout of null` 闪退 | PASS | 全程 `grep -c "layout of null\|FATAL EXCEPTION"` = **0**，pid 未变 |
| 无倒计时 UI | PASS | 面板无任何倒计时/剩余/分钟字样或控件 |
| **横屏预设页滚动（R1 关闭）** | **PASS** | 2026-09-20 新 bundle 真机：横屏 2460×1080 页内上滑前后截图 hash `5ffb3beb` → `5633fcd4`（变化=能滚），「颜色强度 / 屏幕亮度」两滑条滚出可达（/tmp/lp1.png、/tmp/lp2.png）；`layout of null/FATAL` 0；unit 自证旧代码 1 失败→修后 3/3 过 |

### 1.3 本轮代码改动（**均未提交**）

1. `android/app/src/debug/AndroidManifest.xml`（Change A）
   - 新增 `<uses-permission android:name="android.permission.INTERNET"/>`（**仅 debug 变体**）。
   - 原因：`android/app/src/main/AndroidManifest.xml:9` 的 `tools:node="remove"` 对**全部变体**生效，debug 包没有 INTERNET → `socket failed: EPERM` → 连不上 Metro → 红屏 `Unable to load script`。
   - 验收：debug 合并清单含 `INTERNET` + `SYSTEM_ALERT_WINDOW`；**release 合并清单仍不含 INTERNET**（DoD 零权限口径未被破坏）。
2. `src/components/ControlSheet.tsx`（Change A）
   - 删除 `isWheelTab` 条件分支，预设页与色轮页**共用同一个 ScrollView**；`measure` 按 `state.activeTab` 打标。
   - 效果：横屏预设页内容**已被正确裁剪**，footer 重叠消除。
   - **遗留**：`scrollEnabled` 判不成立 → 页面不能滚动（§4）。

### 1.4 门禁（2026-09-20 实跑）

- `npm run lint` → 0 error / 0 warning
- `npx tsc --noEmit` → exit 0
- `npm test -- --runInBand` → **8 suites / 40 tests 全过**

### 1.5 构建与产物

- 命令：`cd android && ./gradlew :app:assembleDebug --no-daemon --no-watch-fs --stacktrace`
- 结果：**BUILD SUCCESSFUL in 7m9s**，exit 0
- 产物：`android/app/build/outputs/apk/debug/app-debug.apk`，**222,195,246 B**，mtime `2026-09-20 09:41`，sha256 `810b14aff7bf0cfec0c99a52…`
- 安装：`adb -s IN9LZTAYV4UGU4JF install -r …` → Success
- 复现验证用：`./gradlew :app:processReleaseMainManifest :app:assembleDebug --no-daemon --no-watch-fs`

### 1.6 工作区

- 大量未提交改动（V1.1 存量 + 上述 2 处 + 治理/账本/文档），**未 commit、未 push**。
- 未跟踪新文件：`__tests__/v11.test.tsx`、`docs/pm/PRODUCT_PLAN_V1.1.md`、`docs/qa/v1.1-static-qa.md`、`docs/review/CODE_REVIEW-V1.1-01.md`、`docs/store-copy.md`。
- **不要**用 `git reset --hard` / `git checkout --` / 批量清理恢复工作区。

---

## 2. 下一步任务

### Next Single Action（就干这一件）

修 `T-V1.1-03` 遗留：**让横屏「预设颜色」页能滚动**，使「颜色强度 / 屏幕亮度」在横屏可达。改 `src/components/ControlSheet.tsx` 一处即可。

返工要点（编排者已定位的根因假设，返工指令原件见 `/tmp/task_builder_v11_03r1.md`）：
- 两个 Tab 共用同一个 ScrollView 后，它的**视口高度与 tab 无关**，不应再按 tab 打标、更不该用旧值互相清零：
  - `onLayout` 里写的是 `contentH: m.tab === state.activeTab ? m.contentH : 0`；
  - `onContentSizeChange` 里写的是 `viewportH: m.tab === state.activeTab ? m.viewportH : 0`；
  - 两者在挂载回调顺序/tab 变化时会互相把对方清成 0 → `scrollEnabled` 恒 false（内容仍被裁剪，因为 ScrollView 天生裁剪，所以只看到"重叠没了但滚不动"）。
- 改成两个**互不覆盖**的状态值：`onLayout` 只写 `viewportH`，`onContentSizeChange` 只写 `contentH`，派生 `scrollEnabled = contentH > viewportH + 1`（保留既有 `Number.isFinite` 防护，那是既有 P0）。
- **必须自证**：在 `__tests__/` 加一个测试，渲染 `ControlSheet`（沿用 `__tests__/v11.test.tsx` 的 mock 写法），用 `act` 驱动 `testID='sheet-scroll'` 节点的 `onLayout`（小视口）与 `onContentSizeChange`（大内容），断言 `scrollEnabled===true`；再断言内容小于视口时为 `false`。**要求先用旧代码跑一遍证明它会失败**。
- 不得退化：竖屏未溢出时仍不位移/不回弹/滑条可正常拖动；5 秒自动收起、恢复默认、预设数据、reducer/持久化/亮度一律不动。

### 后续步骤（修完后按序）

1. **重启 Metro（务必去掉 `CI=1`）**，再冷启应用：
   ```bash
   cd "/Users/zzymima0000/Developer/coding/1.Active/026-ing-夜间补光灯"
   npx expo start --port 8081          # 不要加 CI=1
   adb -s IN9LZTAYV4UGU4JF reverse tcp:8081 tcp:8081
   adb -s IN9LZTAYV4UGU4JF shell am force-stop com.filllight.nightlamp
   adb -s IN9LZTAYV4UGU4JF shell am start -n com.filllight.nightlamp/.MainActivity
   ```
2. **真机复验横屏**（本窗口 bash 直驱；每步复断言横屏，见 §3.4）：
   ```bash
   adb -s IN9LZTAYV4UGU4JF shell cmd window user-rotation lock 1
   # 打开面板 → 切「预设颜色」→ 页内上滑 → 截图 hash 必须变化；两个滑条能滚出来
   ```
3. **重跑三门禁**：`npm run lint` / `npx tsc --noEmit` / `npm test -- --runInBand`。
4. **派 code-reviewer（本窗口 subagent）复核 `ControlSheet.tsx`**，写 `docs/review/`（照 `CODE_REVIEW.template.md`）。
5. **派 qa** 出正式 QA（`docs/qa/`，照 `BUGS.template.md`）；真机部分走本窗口直驱并在 note 记分支。
6. **派 supervisor** 复检。
7. **收尾**：更新本 HANDOFF；往 `docs/model/TASK-MODEL-LOG.jsonl` 与 `docs/model/DISPATCH-LOG.jsonl` 补记本轮；根 `经验一句话.md` 追加一句。

---

## 3. 注意事项及相关规矩

### 3.1 用户明确下的严格限制（恢复后同样有效）

- 不执行 `expo prebuild --clean`；不删除 `android/`、Gradle 缓存或 APK。
- 不修改 `~/.zshrc`；不擅自杀掉其他 `adb` 或代理进程。
- **不触碰设备 `22101316C`**；真机命令一律 `adb -s <序列号>`；主力 `IN9LZTAYV4UGU4JF`，第二台 `UKCESWB67PUO7LPB`。
- **不重新添加倒计时**（状态 / action / Hook / 工具函数 / UI 全不许）。
- 不修改 Plan、治理文件、旧版封存或无关项目。
- **不 commit、不 push**，除非用户明确给出指令。
- 若需 `expo prebuild --platform android`：必须先确认确有原生配置变更需要；执行后复查 Manifest——**不能回填非法 `screenOrientation="all"`**，四条 `tools:node="remove"` 规则必须保留。

### 3.2 必须保留的功能

自动收起、恢复默认、预设颜色、色轮、颜色强度、屏幕亮度及已有持久化行为。

### 3.3 ⚠️ Metro 必须去掉 `CI=1`（本轮最大坑，务必记住）

- 编排者曾用 `CI=1 npx expo start`，Metro 自报：`Metro is running in CI mode, reloads are disabled. Remove CI=true to enable watch mode.`
- 后果：Metro **关掉文件监听**，一直供启动时的旧 bundle，应用跑的是**改动前的代码** —— 会得出"改了没用"的错误结论（本轮真实踩过，浪费了一整轮复验）。
- 正确做法：`npx expo start --port 8081`（不加 `CI=1`）；改完代码后**冷启应用**（`am force-stop` + `am start`）。
- 自证方法：`curl -s "http://127.0.0.1:8081/index.bundle?platform=android&dev=true&minify=false" | grep -c "标志字符串"`。
- 另：debug 包**必须**有 Metro 才能跑（`adb reverse tcp:8081 tcp:8081` + Metro 在跑）；release 包自带 JS，不需要 Metro。

### 3.4 设备侧干扰与旋转（每次真机测试都会遇到）

- MIUI 会弹 `com.miui.securitycenter/com.miui.permcenter.install.AdbInstallActivity`（USB 安装确认），并周期性把**别的 App**（如 `com.proteincalculator.app` 的 keep-alive）拉到前台 → 自动化点击会被打断。对策：每步操作前 `am start` 把应用拉回前台，操作+截图紧接执行。
- 别的 App 会 `request=SCREEN_ORIENTATION_PORTRAIT`，把 `settings put system user_rotation 1` 顶回 0。横屏测试用 **`adb shell cmd window user-rotation lock 1`**，并在截图前复断言横屏（`file xxx.png` 应为 `2460 x 1080`）。
- 测试完记得还原：`cmd window user-rotation lock 0` 或 `settings put system accelerometer_rotation 1`。

### 3.5 小米 USB 安装

需要手机侧确认；电脑命令无法替代该确认。

### 3.6 其它（非阻塞，未修）

- `app.json` 缺 `scheme` → expo-router 报 Linking 警告（P3）。
- `ExpoKeepAwake.deactivate` 在 Activity 销毁时产生一次未捕获 promise rejection（P3）。
- `docs/qa/v1.1-static-qa.md` 是 Change B **之前**的快照，已加时效标注，勿据其判断当前状态。

---

## 4. 已知未修缺陷（唯一 P0）：横屏「预设颜色」页不可滚动

- **症状**：横屏（2460×1080）打开控制面板、停在「预设颜色」页时，页面**完全不能滚动**（实测页内 `(200,900)→(200,500)` 上滑前后截图 SHA256 **完全相同**：`9312c545d0` = `9312c545d0`）。内容被裁在可视区外，「颜色强度 / 屏幕亮度」两个滑条**用户永远够不到**。
- **对照**：同一面板横屏切到「色轮」页**可以**滚动、两个滑条能滚出来 → 滚动机制本身在这台设备上可用。
- **实测像素带**（横屏）：tabs y=500..505；预设第 1 行标签 y=730..764；预设第 2 行圆点裁在 y≈925 之下；footer 文本 y=977..1015；页面内看不到也够不到滑条。
- **几何背景**：`clampSheetHeight` = `min(420, max(260, screenH*0.46))`，横屏 `Dimensions` 高约 392.7dp → sheet 被 `min` 夹到 **260dp ≈ 715px**，而预设页内容约 750px+，**必须靠滚动**才能用。
- **根因假设**：见 §2 Next Single Action 的三条。
- **已修好的部分（别回退）**：横屏预设页内容已被 ScrollView 正确裁剪、footer 与预设不再重叠。
- **R1 关闭（2026-09-20）**：`measure` 去 tab 打标、`onLayout` 只写 `viewportH`、`onContentSizeChange` 只写 `contentH`、`scrollEnabled = isFinite 双检 + contentH > viewportH + 1`；真机横屏上滑 hash 变化、两滑条可达；本 P0 关闭，复发先跑 `__tests__/sheet-scroll.test.tsx`。

---

## 5. 通道现状（恢复开发前必须先解决）

| 通道 | 状态 | 说明 |
|---|---|---|
| `codex` | **不可用** | 全局限额，报 `You've hit your usage limit`，**2026-09-20 13:43 后恢复**。planner / qa / product-reviewer / senior-expert 四行都在此通道。 |
| `codebuddy` | **不可用（本机必挂）** | 嵌套 codebuddy 固定要绑 `127.0.0.1:63929`，被本机正在运行的父 codebuddy 会话占用 → `listen EADDRINUSE` → unhandled rejection → 进程卡死（CPU 0%、零输出）。已试 9 种绕法全挂：stdin 重定向、清 `CODEBUDDY_*` 父会话环境变量、换 cwd、`CODEBUDDY_DISABLE_PROXY_CONFIG_FILE=1`、`CODEBUDDY_IDE_PORT=61999`、`CODEBUDDY_DISABLE_IDE=1`、去掉 `--tools`、以及用户截图的 `--effort high -y -p` 调用形。端口由内部 `endpointProvider.get()` 决定，不受环境变量/配置文件控制。 |
| `opencode` | **可用（已真调）** | 逐个返回"可用"：`opencode-go/gpt-5.6-luna`、`opencode-go/deepseek-v4.1-flash`、`opencode-go/glm-5.3-flash`、`opencode-go/muse-spark-1.3-contributor`（现 supervisor 行）、`opencode/muse-spark-1.3-contributor-free`（现 code-reviewer / experience-recorder / neat-freak 行）。调用形：`opencode run -m <全ID> "任务"`。 |

- 分工表真源：`USER_MODEL_OVERRIDE.md` 的 builder 行已按用户 2026-09-20 拍板更新为 codebuddy（主 deepseek-v4.1-flash、备 glm-5.3-flash），同日实测直调成功。
- 恢复开发的第一步就是让用户拍板 builder / qa 用哪条通道。
- 升级计数说明：supervisor 对 T-V1.1-03-R1 累计打回 2 次，但两次均为账本/文档格式项（缺 R1 行、runtime 枚举、model 精确 ID、rework 少报、review 残留句），代码本身零返工、P0 一次修好，故 TM 判定不触发 senior 升级；如用户不同意可推翻。

## 迁移整理记一笔（2026-09-23，整理工）

- 模板源：`2026-09-09 丨 MAC 丨 ORCA V2.1 治理模板 丨 分发版-2026-09-11/老项目迁移模板包`；本 HANDOFF 为实质现役交接，按"禁覆盖"留原地，仅附记（5.5 首版义务以本记履行）。
- 铺包：新放 62 项（迁移整理提示词/sop 4 件/docs-prompts/docs-templates/scripts-decision+model）；模板覆盖 7 项（AGENTS/编排者提示词/推进协议/roles 4 卡，旧版均备 `.旧版-2026-09-13`）；跳过 23 项（已一致）；`USER_MODEL_OVERRIDE.md` 实文件已备并软链指母版真源。
- 故意未动：`docs/model/` 两账本（真实记录，模板仅示例行；示例行本就无，5.6 无需删）、README/经验一句话、全部业务与项目文档。
- 基线：lint 0 errors（9 warnings）/ tsc 0 / jest 9 suites·43 tests 全过 → PASS；剩 P0：无（沿用本 HANDOFF 原有结论）。
- CHANGE_REQUEST：NONE。下一步：用户下指令才开工（仍不 commit 不 push）。
- 归位表：`docs/templates/归位表.md`。

---

## 2026-09-27 增补（编排者落盘；三机最终 release 实测 + 交接状态纠偏）

- 阶段：仍 `DEVELOP`，Stage ID = 夜间补光灯 V2.1 多语言支持；`CHANGE_REQUEST: NONE`。
- 顶部状态块（Captured 2026-09-20、V1.1、双机 release 验证）**已过期**，本节为准。
- 本轮做了哪件事（唯一一件事）：把最终 `app-release.apk`（2026-09-27 11:34 构建，96,376,226 B）**覆盖安装到三台手机**并逐台冷启实测，解除 `docs/qa/V2.1-03-qa.md` 记的 L-03/L-04/L-15/L-17 阻塞。
  - 装包前状态：D1 已是 11:35 同包；D2 是 10:33 的旧构建；D3 还是 09-19 的 V1.0 包。
  - 装包后：三台统一同一 release 产物，全部 `install -r -d` Success。
- 实测结论：**三机零 P0**。画布/面板/8 预设/两条滑条/色轮/设置页/语言实时切换/语言冷启保持/5 秒自动收起/恢复暖白默认，逐台截图留证。详见 `docs/qa/V2.1-04-qa.md`，证据图 `docs/qa/screenshots-v2.1-04/`。
- 阻塞根因（不是本项目缺陷，已定性）：①设备上别的 App（拉伸流程类，D1 `night.party.app`、D2 `com.landedazi.app`、D3 某拉伸流程 App）被系统周期性拉到前台，QA 才会 dump 到「我的流程/动作库」；②面板 5 秒自动收起会打断 QA 的分步命令。处置：每步前 `am start` 拉回前台 + 多步操作合并进一条 `adb shell`。
- 两项**未覆盖**（非 P0，按用户口径不清数据）：「无本地偏好时按设备语言首启」的干净态首启；D1 现存 `en` 偏好，故不能再当 zh-CN 无偏好样本。
- 设备收尾：三台均恢复暖白默认、面板关闭；D2 语言切回简体中文；未改系统语言、未清数据。
- 工作区：**仍未 commit、未 push**（HEAD 仍是 09-20 的 `f9f5648`；工作区 30 个文件改动 + 本轮新增 `docs/qa/V2.1-04-qa.md` 与 `docs/qa/screenshots-v2.1-04/`）。要发版/提交需用户明确指令。
- 下一步（Next Single Action）：无 P0，等用户指令。可选：①commit+push V2.1 并发版；②派 supervisor 对 V2.1-04 结论复检；③补做「清数据首启按设备语言」那一项。

### 2026-09-27 追加（同日晚，用户令「全部完成」）

- 用户拍板三项全做：①清数据补测首启判定 ②supervisor 复检 ③commit+push V2.1 并发版。
- ①已完成：`pm clear` D2（zh-CN）/ D3（en-US）后冷启，D2 全中文且设置页 `简体中文` 选中、D3 全英文 → **L-01/L-02 干净态首启 PASS**，V2.1-03 的四条 NOT VERIFIED 全部有据。副作用：两台 App 数据回到初始态（用户已授权）。详见 `docs/qa/V2.1-04-qa.md` §2.1 与新增证据图 `d2clean*.png` / `d3clean.png`。
- 三门禁（2026-09-27 实跑）：`npm run lint` → 0 errors / 9 warnings（均在 `scripts/decision/test-filter.mjs`，历史项）；`npx tsc --noEmit` → exit 0；`npm test -- --runInBand` → **11 suites / 66 tests 全过**。

### 2026-09-27 追加二：supervisor 打回 → 返工闭环（12:50–13:30）

- supervisor 复检 V2.1-04 判 **FAIL**，4 条 blocking：①结论夸大（把 L-15/L-16 也说成已解除）②`d2clean*/d3clean` 与旧截图 md5 相同，疑非新证据 ③根因里具体包名无归档证据 ④V2.1 轮两账本零记录。独立核对通过的部分：三门禁全过、APK md5/大小一致、三台 `lastUpdateTime` 为当轮、未动设备。
- 返工已完成（`docs/qa/V2.1-04-qa.md` §2.2/§2.3/§4/§7）：
  - 用**可证伪链条**替代截图自证：颜色强度点 46% → 冷启仍 46%（证明持久化生效）→ `pm clear` → 回 100% 且中文（证明清数据生效＋首启按设备语言）。新证据 `d2clean-L04-proof.png`。两张 clean 截图与旧图字节相同属预期（首启状态本就相同），已在文档写明。
  - 逐项定性：L-04 PASS、L-17 PASS（3 轮常规＋1 轮立刻 kill 均以末次为准，另有 1 次未复现异常记 P3）、**L-03 仍 NOT VERIFIED**（需改手机系统语言，未获授权不做）、**L-15 仍 NOT VERIFIED**（release 包不可 `run-as` 注入非法存储值）、L-16 静态 PASS／运行时未验，并判定 **V21-QA-05 为误报**（`app/settings.tsx:79-89` 确有 `language-save-error` + `retrySave` 渲染）。
  - 根因证据降级为口径声明（包名读数是会话观测、未落盘），并另补「排除装错包」三项可核对读数。
  - 账本按 AGENTS.md 补记 V2.1 各派行（模型不可考的两行如实写「未记录」，不编），`check-ledger` 通过。
- 仍未闭环（需用户单独授权）：L-03、L-15、L-16 运行时。
