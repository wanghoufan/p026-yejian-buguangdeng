# CODE REVIEW

- Task: T-V1.1-01（V1.1 增量开发复核，验收依据 PRODUCT_PLAN_V1.1.md）
- Commit: 未 commit（工作区 diff HEAD 复核；builder=codex/gpt-5.6-luna）
- Reviewer: code-reviewer
- Result: **FAIL（打回）**——2 项 blocking P1（倒计时档位选中态失效、ScrollView 滚动不暂停自动收起），均为局部 UI 状态逻辑，修复成本低；架构与门禁其余项全部通过，修复后复验即可 PASS。

## 逐项核查结论

### 1. 范围一致性：PASS
- 改动严格落在派工单 6 项内：横竖屏解锁（app.json `orientation: "all"`、Manifest `screenOrientation="all"`）、权限清零、自动收起、倒计时、响应式（clampSheetHeight / ColorWheelPanel 尺寸）、定位原句（README + docs/store-copy.md）。
- 治理文件（HANDOFF / DISPATCH-LOG / TASK-MODEL-LOG / USER_MODEL_OVERRIDE）为流程记录，非业务越范围。
- 无新增依赖、无相机/网络/遥控/后台常驻类越范围能力。
- 方案 C 视觉语言未重设计：新增 footer 倒计时控件复用现有 tokens（ui.accent / inactivePill / activePill），clampSheetHeight 与 MIN_SIZE 180→160 属 A9 允许的横屏必要调整。
- DoD 断言实测通过：
  - `grep -Fqx` 定位原句：README.md ✓、docs/store-copy.md ✓
  - 网络 grep 断言（app src scripts app.json package.json）：零命中 ✓
  - `rg '<uses-permission' android/app/src/main/AndroidManifest.xml`：零命中 ✓（原 6 项权限全部删除，含 INTERNET/WRITE_SETTINGS/SYSTEM_ALERT_WINDOW 等）

### 2. 禁令核查：PASS
- 无新增 uses-permission；扫描 node_modules 一方依赖库 manifest（react-native ReactAndroid、async-storage、expo-brightness、expo-keep-awake、expo），均无 `uses-permission`，release 合并后 0 权限预期成立（最终以 `apkanalyzer manifest permissions` 为准，属 QA 真机项）。
- `fetch/axios/XHR/WebSocket/EventSource/WebView/expo-network/netinfo`：src/app 零命中（DoD 断言通过）。
- 倒计时释放常亮用 `expo-keep-awake` 的 `deactivateKeepAwake`、关 Activity 用 `BackHandler.exitApp()`（finish 语义，非强杀进程），均为无权限应用内能力，符合方案。

### 3. A8 自动收起：FAIL（见 blocking #2）
- 5 秒重置逻辑正确（ControlSheet.tsx:35-39）：`open && !interacting` 才挂 setTimeout(5000)；`endInteraction()` 递增 `interactionTick` 重置计时；预设点击、切 Tab、选倒计时、恢复默认、Slider 起止、dragZone 起止、色轮 grant/release 均已接入 begin/end。
- 拖动中暂停正确：`interacting=true` 时 effect 提前 return，timer 被 cleanup 清除。
- 收起只 dispatch `SET_SHEET_OPEN`，reducer 不触碰颜色/强度/亮度/Tab/倒计时 ✓。
- **缺口**：wheel Tab 的 ScrollView（ControlSheet.tsx:191-214）未接入交互钩子，内容溢出滚动期间不暂停/不重置计时，面板可能在用户拖动滚动时自动收起 → blocking #2。
- 单测覆盖：v11.test.tsx 覆盖重置（4999ms 不触发）、交互暂停（触摸中 5001ms 不触发）、结束重算（5000ms 触发）✓。

### 4. A11 关闭倒计时：FAIL（见 blocking #1）
- 绝对截止时间为唯一真源 ✓（src/utils/countdown.ts：`deadlineForMinutes`/`remainingSeconds`/`isDeadlineExpired`，纯函数、边界 `now >= deadline` 判到期）。
- 旋转/收起不重置 ✓：deadline 在全局 state，SET_SHEET_OPEN/SET_ACTIVE_TAB 等不触碰；无任何旋转重置路径。
- 后台超期回前台立即关闭 ✓：useShutdownCountdown 监听 AppState `active` → expire；挂载与每秒 interval 也检查。
- 到期释放常亮 + 关 Activity ✓：`onClear()` → `deactivateKeepAwake()` → `BackHandler.exitApp()`（顺序正确；Activity 销毁后 window 级亮度属性随窗口消失，等效恢复系统亮度，且 useAppBrightness 后台/卸载路径也有 restore）。
- 恢复默认不覆盖倒计时 ✓：reducer `RESET_DEFAULTS` 显式保留 `shutdownDeadline`（fillLightReducer.ts:24），单测覆盖。
- 不跨冷启动持久化 ✓：toPersisted 仅 4 字段，HYDRATE spread 不含 deadline。
- **缺口**：档位选中态判断 `Math.abs(shutdownDeadline - now - minutes*60000) < 2000`（ControlSheet.tsx:225）在选中 2 秒后失效 → blocking #1。
- 单测覆盖：截止时间计算/边界 ✓、恢复默认不覆盖 ✓；hook 级到期行为（exitApp）无直接单测（非 blocking 备注）。

### 5. 持久化：PASS
- 只存 `targetColor/colorIntensity/screenBrightness/activeTab` 四字段（validation.ts `toPersisted` 剔除 colorSource/presetId，单测断言 keys 精确相等）✓ 符合方案 A7/Data API。
- 逐字段校验回退完整：HEX 正则、clamp01（NaN/Infinity 回退默认）、枚举校验（persistence.test.ts 既有覆盖：非法 hex、越界、NaN、损坏 JSON）✓。
- HYDRATE 强制 `isSheetOpen: false` ✓，不持久化面板/倒计时/拖动坐标 ✓。
- 兼容性备注（非 blocking）：新数据不再存 colorSource/presetId，重启后 colorSource 回退 'preset'、presetId 回退 warm-white；若上次用色轮选色，画布颜色正确恢复但预设选中态可能显示 warm-white 选中。属方案"仅存 4 字段"的实现代价，颜色本身无损失。

### 6. 单测覆盖：PASS（1 项备注）
- 自动收起重置/暂停 ✓（v11.test.tsx，fake timers）
- 倒计时截止与到期边界 ✓（900999 false / 901000 true）
- 恢复默认不覆盖倒计时 ✓
- 非法数据回退 ✓（persistence.test.ts）
- 插值边界 ✓（color.test.ts：0%→#FFFFFF、100%→target）
- 质量门禁实测：`npm run lint` 0 warning ✓、`npx tsc --noEmit` 通过 ✓、`npx jest` 8 suites / 39 tests 全过 ✓。
- 备注：useShutdownCountdown hook 行为（exitApp/deactivate）无直接单测，现有覆盖为纯函数级，可接受。

### 7. 代码质量：PASS（非 blocking 备注）
- 类型安全：shutdownDeadline 类型、action、reducer、persisted schema 全链路一致；tsc 通过。
- 与既有节流配合良好：LabeledSlider 新增 onInteractionStart/End 走 ref（不破坏手势身份与 memo）；ControlSheet 沿用 DISPATCH_THROTTLE_MS 节流不变。
- 持久化时序（非 blocking）：RESET_DEFAULTS / 预设点击的 `dispatch + persistNow()` 中 persistNow 读到 dispatch 前的 stateRef（立即落盘旧值），由 debounce effect（targetColor 等变化触发）300ms 后补写新值兜底，最终一致。属 V1.0 既有模式，非本次引入。

## P0 / P1 Findings

- **P1-blocking-1｜倒计时档位选中态 2 秒后失效**（src/components/ControlSheet.tsx:225）
  - 现象：选中态用 `Math.abs(state.shutdownDeadline - now - minutes * 60_000) < 2_000` 反推档位。`now` 每秒更新，`deadline - now` 持续递减，该等式仅在选择后约 2 秒内成立；此后 15/30/60 分钟档全部失去选中样式（"关闭"档也因 deadline 非 null 不选中），用户无法分辨当前档位。
  - 违反：A11「四档可选可切换」的可感知状态；DoD「15、30、60 分钟三档均可选择和切换」。
  - 改法：记录所选档位而非反推——在 ControlSheet 用组件 state 保存 `selectedMinutes`（onPress 时写入），或在 reducer/state 中保存档位字段；选中态由档位直接驱动，剩余时间展示仍用绝对 deadline 计算。
- **P1-blocking-2｜ScrollView 滚动不暂停/不重置自动收起**（src/components/ControlSheet.tsx:191-214）
  - 现象：wheel Tab 内容溢出时（横屏矮视口常见），用户拖动 ScrollView 滚动期间触摸不经过任何 begin/end 交互钩子，5 秒计时照走，面板可能在拖动中自动收起。
  - 违反：A8「手指按下或正在拖动……Sheet 时暂停自动收起」。
  - 改法：仿照 sheet-drag-zone（ControlSheet.tsx:176）为 ScrollView 追加 `onTouchStart={beginInteraction} onTouchEnd={endInteraction}`（可加 onTouchCancel）；顺手补一条"滚动中不收起"的单测。

## P2 / P3 Backlog Findings

- P2：剩余时间显示为裸秒数（"剩余 3599 秒"），建议改 mm:ss 格式；且 `now` interval 在面板收起后仍每秒触发 ControlSheet 重渲染（小性能损耗，可与显示优化一并处理）。
- P2：横竖屏旋转后 sheet 高度与色轮尺寸不重算——`clampSheetHeight`/`ColorWheelPanel.size` 在 render 体读 `Dimensions.get('window')`，无 Dimensions 订阅，旋转不保证触发重渲染。DoD 的"旋转前后状态保持"满足（state 无重置路径），但 A9 旋转后自适应依赖真机回归；若真机出现裁切/溢出，需挂 Dimensions change listener。
- P2：`RESET_DEFAULTS` 会把面板收起（DEFAULT_STATE.isSheetOpen=false 生效）。方案未明确要求恢复默认后面板保持展开，请 QA/产品确认是否符合预期（用户点击后需再点画布才能继续操作）。
- P3：useShutdownCountdown 的 `onClear` 为内联箭头（app/index.tsx），effect 每次渲染重建 interval；功能正确（expire 在 effect 顶部立即执行 + 1s interval 兜底），建议用 useCallback 或 ref 稳定。
- P3：Manifest 残留 expo-updates meta-data（EXPO_UPDATES_CHECK_ON_LAUNCH=ALWAYS 等），该包未安装、当前无害；下次 prebuild 会重建 manifest，建议顺手清理避免误导。
- P3：clampSheetHeight 魔数 260/12 替代了 `sheet.minHeight`（现成死常量）；ColorWheelPanel 注释仍写"小屏降到 180dp"（实际已改 160）。
- P3：useAppBrightness 卸载 cleanup 中 restore 失败路径会调 `setSupported`（组件已卸载），低概率 React 警告。

## Readiness 意见

- 架构层面全部正确：绝对截止时间真源、reducer 不覆盖倒计时、4 字段持久化 + 逐字段回退、0 权限、无网络路径、自动收起不改参数、恢复默认保留倒计时，均有代码与单测证据。
- 质量门禁全绿：lint 0 warning、tsc 通过、39/39 测试通过、三项 DoD grep 断言实测通过。
- 2 项 blocking 均为局部 UI 状态逻辑（合计改动约 10-20 行），不触及架构与数据层；修复 + 补单测后复验即可转 PASS。
- 待办依赖真机/构建的验收项（apkanalyzer 0 权限、三 viewport、旋转回归、两台真机）保留给 QA 阶段，本复核不阻塞其开展。

## 最终结论

**FAIL**——blocking 清单：
1. P1-blocking-1：倒计时档位选中态 2 秒后失效（ControlSheet.tsx:225，需改为显式记录所选档位）。
2. P1-blocking-2：ScrollView 滚动未接入自动收起暂停/重置（ControlSheet.tsx:191-214，需补 onTouchStart/End/Cancel 钩子 + 单测）。

修复以上两项并复跑 lint/tsc/jest 后，申请 code-reviewer 复验。

## R1 复验

- Reviewer: code-reviewer-r1（2026-09-19，工作区 mtime 15:27-15:28 返工批次）
- 结果：**PASS**——2 项 blocking P1 均已修复，门禁全绿。

### 逐项结论

1. **P1-blocking-1 倒计时档位选中态：PASS**
   - `src/types/fillLight.ts:14` 新增 `shutdownMinutes: ShutdownMinutes | null`（15|30|60 字面量类型）✓
   - `fillLightReducer.ts:22-27` SET_SHUTDOWN_MINUTES 同步维护两字段：null→两者皆空；非 null→`deadlineForMinutes` 重算 ✓
   - `fillLightReducer.ts:33-34` RESET_DEFAULTS 显式保留 shutdownMinutes/shutdownDeadline ✓
   - `ControlSheet.tsx:228` 选中态改为 `state.shutdownMinutes === minutes` 直接驱动，反推等式已删除 ✓
   - 到期清档：`app/index.tsx:15-17` 到期 action 改为 `SET_SHUTDOWN_MINUTES shutdownMinutes:null`，档位与 deadline 一并清空 ✓
   - 接线：defaults 补两字段；倒计时不跨冷启动（toPersisted 仍 4 字段，HYDRATE 不还原档位），符合 A11 ✓
2. **P1-blocking-2 ScrollView 滚动暂停：PASS**
   - `ControlSheet.tsx:197-199` sheet-scroll 已接 onTouchStart/onTouchEnd/onTouchCancel={beginInteraction/endInteraction} ✓
   - 与 sheet-drag-zone（:176）复用同一对 useCallback 回调，走同一条 5 秒自动收起 effect（:35-39），未另起计时 ✓
   - 作用域正确：回调仅 setState（空依赖无 stale closure）；endInteraction 递增 interactionTick 强制 effect 重跑重置计时 ✓
3. **新增单测真实断言：PASS**
   - `reducer.test.ts:28-45` mock Date.now 断言 30/60 档 deadline 数值与关闭档双清 ✓
   - `v11.test.tsx:67-83` fake timers：滚动触摸中 5001ms 不收起、释放后恰 5000ms 收起，边界精确 ✓
   - `v11.test.tsx:26-33` RESET 用例补 shutdownMinutes=15 保留断言 ✓
4. **门禁实测：PASS**
   - `npm run lint` 0 warning（eslint 零输出）✓
   - `npx tsc --noEmit` exit 0 ✓
   - `npm test` 8 suites / 41 tests 全过（上轮 39 + 新增 2）✓
5. **改动范围：PASS**
   - 返工批次（mtime 15:27-15:28）仅动 types/defaults/reducer/ControlSheet/app/index.tsx + reducer.test/v11.test/slider-throttle.test 三测试文件；其余 diff 文件为上轮已复核的 V1.1 存量（mtime 15:05-15:08），无越范围改动 ✓

### 遗留备注（非 blocking，不阻塞）

- 上轮 P2/P3 backlog（秒数格式、Dimensions 订阅、expo-updates meta-data 等）未在本轮处理，按原计划留给 QA/后续。
