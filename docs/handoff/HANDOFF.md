# HANDOFF｜交接（暂停/恢复用，先读我）

> 旧版字段（governance-state / Evidence / Human Gate / Promotion / Dispatch ID）已废弃，不填。

- Captured at（YYYY-MM-DD HH:MM）：2026-09-19 00:45
- PROJECT_PHASE：DEVELOP
- PLAN_VERSION：（无，Phase2 直接按 docs/plan UI Freeze V1.1 连续开发，未走 Phase1）
- PLAN_READINESS_SCORE：（空）
- PLAN_GATE：APPROVED（用户口头放行 T001→T065 连续开发，T065 人验收完结）
- DEV_BASELINE：docs/plan UI Freeze V1.1（Constitution/SPEC/PLAN/TASK + 方案C设计板）
- CHANGE_REQUEST：NONE
- Stage ID（本阶段叫什么）：夜间补光灯 V1.0（Expo Android）
- 剩 P0（没完的才列，多一条都不行）：0。V1.0 COMPLETE，用户亲口“搞定”。
- 当前 Task（正干到哪）（累计打回 n/2，supervisor每次打回时TM同步更新）：T065 收工；累计 supervisor 打回 0。
- 执行链/Session（可选，仅真 resume 通道填，普通 subagent 可空；TM 只记录/引用，ID 由基础设施返回，不手造、不要求用户复制；返工确认是否原链；senior 升级开新链后更新）：本窗口 subagent（前期）+ codebuddy 直调 builder（后期，`codebuddy --model deepseek-v4.1-flash`）；codex/opencode 通道未实际使用。senior 未触发。
- 未闭环评审意见（code-reviewer/qa 留的还没改的）：无。code-reviewer/qa 按 AGENTS 跳步记：单轮连续开发，review+test 由 builder 自检与 TM 真机复验承担，HANDOFF 记一句原因。
- docs 落盘清单（本轮新增/改了哪几个 docs 文件）：README.md（模板包说明→项目实况重写）；经验一句话.md（+2026-09-19 一条）；docs/qa/android-emulator-v1.0.md、visual-freeze-v1.1.md、final-human-gate-v1.0.md（开发期填充）；本 HANDOFF.md（新建）。
- 下一步（Next Single Action）：无代码待办。有新需求时走 `变更请求：……`（A/B 留 DEVELOP，C 进 PLAN_REOPEN_REQUIRED）。
- 人要拍什么板（列出来问，不问不许开工）：无。
- permission_request（可选：原文/决策/回执一句，首版可先记自然语言一句）：无。
- 收尾记一笔（neat-freak：文档对齐了没、临时文件清了没、未决列完没；neat 派完后 TM 补记，若已落盘则追加修订行）：neat-freak 轻量路径已执行：README 对齐代码实况；/tmp 下录屏截图为本机临时证据，不进仓库；`USER_MODEL_OVERRIDE.md` 为实文件（断链拷贝，非软链，动因见下）；未决：git 尚无远端，push 待用户给远端地址。

## 恢复读盘（全体系唯一顺序，别乱）

1. AGENTS；2. 角色卡；3. 根 `USER_MODEL_OVERRIDE.md`；4. 本 HANDOFF；5. 根 `经验一句话.md`；6. 任务目标放最后。
冲突才扩大读。

## 本工程关键事实（恢复开发先看这段）

- 应用：Expo SDK57 + RN + TS，包名 `com.filllight.nightlamp`，桌面名「夜间补光灯」（app.json；package.json 的 name 仍是 `fill-light-tmp`，仅 npm 名，不影响 App，可改可不改）。
- 安装包：`android/app/build/outputs/apk/release/app-release.apk`（本地编译，debug keystore 签名）。编译 env：`JAVA_HOME=$HOME/android-toolchain/jdk-17.0.20.1+1/Contents/Home`，`ANDROID_HOME=$HOME/android-toolchain/sdk`；改 app.json 后先 `npx expo prebuild --platform android`（必须在项目根跑，在 android/ 下跑会报错）。
- 装过的手机：Note 11T Pro=22041216UC（USB，`IN9LZTAYV4UGU4JF`，主力验证机）；Note 12T Pro=23054RA19C pearl（USB 来过一次又断开）；22101316C=Note 12 Pro（别碰，另一个项目在用；无线 `192.168.31.31` 即它，曾误装一次）。小米机首次 USB 安装/无线调试需手机侧一次确认。
- 修过的 P0（都在包里了）：①切 Tab 重置颜色（挂载回写）→ 只 SET_ACTIVE_TAB；②色轮碎裂 → PNG 贴图 HSV 色盘（`scripts/generate-color-wheel.js` 生成 `assets/color-wheel.png`）+ indicator；③亮度条闪跳 → locationX 相对子 View 塌值，改 measure 缓存 + pageX 换算，另加 dispatch 32ms 节流 + 原生 80ms 节流（`src/utils/throttle.ts`）。
- 门禁现状：`npm run lint` 0 warn，`npx tsc --noEmit` PASS，`npm test` 7 suites / 35 tests PASS。
- 分工表现状：builder=`codebuddy/deepseek-v4.1-flash`（限额切 glm-5.3-flash），qa 普通走 codex Luna、真机走本窗口 bash；表为实文件（用户 09-19 口令要求按模板分发版*)同步，母版在 `4.Templates（PC）/2026-09-09…分发版-2026-09-11/USER_MODEL_OVERRIDE.md`，禁改别处。
- 未做：git 无仓库（neat 时建）；远端无，push 待定；`docs/model/*LOG.jsonl` 仍是模板示例行（开发期走本窗口+codebuddy 未记账，下次 Phase2 派工前按 AGENTS 补记或删示例行）。
