# 安卓补光灯 Constitution

> SDD 基线版本：V1.1  
> 目标产品版本：V1.0  
> 日期：2026-09-18  
> 项目阶段：UI Freeze 后的正式开发基线  
> 目标平台：Android  
> 技术基线：Expo + React Native + TypeScript  
> 主要开发环境：Android Emulator + Expo Go  
> 最终物理验收：真实 Android 手机  
> UI 冻结方向：方案 C「质感毛玻璃风」  
> 权威视觉参考：`2026-09-18 丨 macOS 丨 ChatGPT 丨 安卓补光灯-方案C UI Freeze设计板 丨 V1.1.png`  
> 规范结构：Constitution → SPEC → PLAN → TASK

---

## 1. 项目使命

本项目目标是完成一个**自己和朋友可以直接使用的 Android 屏幕补光灯 App**。

产品核心体验冻结为：

> **打开就是灯 → 轻点屏幕 → 底部毛玻璃控制面板滑出 → 调整颜色/强度/亮度 → 收起面板 → 继续全屏补光。**

V1.0 产品不追求复杂功能，优先保证：

1. 打开速度快；
2. 补光面积尽可能大；
3. 调节路径短；
4. 操作直觉；
5. 视觉精致但不喧宾夺主；
6. 模拟器可连续开发；
7. 最终物理补光效果以真机为准。

---

## 2. 文档权威顺序

若文档、视觉稿和代码出现冲突，按以下顺序处理：

1. **Constitution**
2. **SPEC**
3. **PLAN**
4. **TASK**
5. **UI Freeze 视觉参考图**
6. **实际代码**

说明：

- UI 参考图负责 Look & Feel、层级、视觉气质；
- SPEC 中的交互行为和验收要求优先于图片中的示意文字；
- PLAN 中的尺寸、token、响应式规则优先于图片中的视觉估算；
- AI 生成视觉稿不是像素尺寸合同，开发不得直接“量图抄像素”。

---

## 3. Principle I — V1 Scope Freeze

目标产品 V1.0 MUST 只包含：

- 全屏色彩补光；
- 单击补光画布呼出/收起控制面板；
- 毛玻璃风控制面板；
- 8 个固定预设颜色；
- 色轮自定义颜色；
- 色彩强度；
- 当前 App 的屏幕亮度；
- 补光期间保持常亮；
- 状态栏/导航栏尽可能隐藏；
- 保存最后颜色、强度、亮度与 Tab；
- 前后台切换时正确处理 App 层亮度；
- 完全本地离线运行；
- App 图标与启动 Splash 的方案 C 视觉。

V1.0 MUST NOT 引入：

- 登录、账号、会员；
- Supabase / 数据库 / 后端；
- 网络依赖或云同步；
- AI / LLM；
- 相机、拍照、美颜；
- Torch / 手电筒；
- 场景自动识别；
- 多手机协同；
- 广告、支付；
- iOS 作为本轮验收范围。

任何上述能力一律进入后续版本。

---

## 4. Principle II — UI Freeze Means No Free Styling

方案 C 已被冻结。

开发者 MUST NOT：

- 擅自切换成暗色专业风；
- 擅自切换成极简暖色风；
- 自行增加个人中心、设置入口、顶部导航；
- 将 Bottom Sheet 改成全屏设置页；
- 把预设颜色改成列表/卡片墙；
- 重新设计 App 图标；
- 增加与视觉稿无关的装饰元素；
- 为“更炫”加入复杂动画。

如实现遇到平台限制，应优先做**功能等价、视觉接近**的降级，而不是重新设计。

---

## 5. Principle III — Screen Is the Product

本 App 的屏幕首先是物理光源，其次才是 UI。

必须遵守：

1. App 主界面不设置传统首页；
2. 主状态下尽可能整屏发光；
3. 控制面板隐藏时不得常驻按钮；
4. 控制面板展开时，上方仍持续发出当前补光颜色；
5. 调色即时生效；
6. 不设置“确认/应用”按钮；
7. 系统 UI 尽可能隐藏；
8. UI 不得长期遮挡大面积发光区。

---

## 6. Principle IV — Scheme C Visual Language

冻结视觉关键词：

> **柔和、通透、轻盈、精致、毛玻璃、低干扰。**

### 固定 UI 特征

- 浅色半透明 Bottom Sheet；
- 大圆角；
- 细描边；
- 柔和阴影；
- 固定蓝色交互强调色；
- 预设色使用圆形色块；
- Tab 使用胶囊分段控件；
- Slider 保持轻量；
- 图标使用统一线性风格；
- 不使用重黑背景作为默认控制面板。

### 固定交互强调色

`#4C8DFF`

该颜色只表示 UI 选择/交互状态，不代表补光 Target Color。

---

## 7. Principle V — Color Semantics

### Target Color
预设或色轮选中的目标色。

### Color Intensity / 色彩强度
目标色与白色之间的混合比例：

- 0% = `#FFFFFF`
- 100% = Target Color

色彩强度只改变显示颜色，不改变物理屏幕亮度。

### Screen Brightness / 屏幕亮度
当前 Android Activity 的屏幕亮度覆盖：

- 0–100% 映射到 0–1；
- 不修改系统全局亮度；
- 离开 App 后系统重新接管；
- 回到 App 后恢复 App 保存值。

两者严禁混淆。

---

## 8. Principle VI — Android First + Expo First

必须使用：

- Expo
- React Native
- TypeScript
- Android First

日常开发优先：

> Android Emulator + Expo Go

V1.0 优先保持 Expo Go 兼容。

若第三方 UI/色轮实现与 Expo Go 冲突：

1. 换兼容库；
2. 换轻量实现；
3. 视觉等价降级；

不得未经批准直接：

- 改 Kotlin；
- 改 Flutter；
- 切 Development Build；
- 重写项目。

---

## 9. Principle VII — Emulator for Development, Physical Device for Truth

### 模拟器负责
- UI；
- 视觉层级；
- Sheet 动画；
- 色轮；
- 预设；
- Slider；
- 状态；
- 持久化；
- 前后台逻辑路径；
- 离线；
- 绝大部分自动测试。

### 真机最终负责
- 屏幕实际亮度；
- 常亮；
- 系统栏真实表现；
- 前后台亮度恢复；
- 实际补光颜色；
- 照在人脸上的真实效果；
- 基本发热。

**模拟器 PASS ≠ V1.0 最终 PASS。**

---

## 10. Principle VIII — Local First / No Backend

V1.0 用户数据只允许保存在本机。

允许：
- Target Color；
- presetId / custom；
- 色彩强度；
- 屏幕亮度；
- 当前 Tab。

禁止：
- 上传图片；
- 用户追踪；
- Analytics；
- 后端；
- 网络 API；
- 云配置。

飞行模式下 MUST 100% 可用。

---

## 11. Principle IX — Configuration Over Hardcoding

以下必须集中配置：

- 预设颜色；
- UI Design Tokens；
- 动画时长；
- 圆角；
- 间距；
- App 默认值。

业务状态、颜色计算、设备亮度、持久化、UI MUST 分层。

---

## 12. Principle X — Continuous Delivery / Internal Gates

开发过程采用连续开发：

> Task → Review → Test → Fix → Retest → Next Task

所有 Phase Gate / MVP Gate 均为**内部检查点**，不是人工暂停点。

正常开发期间不得在每个 Gate 处询问用户“是否继续”。

只有两类情况允许用户介入：

1. 真正无法继续的外部硬阻塞；
2. 全部自动开发与模拟器 QA 完成后，进入最终真实 Android 手机 V1 Human Acceptance Gate。

---

## 13. Quality Gates

进入实现前：

- [x] 产品范围冻结；
- [x] 方案 C UI Freeze；
- [x] UI 交互与尺寸规范已进入 SPEC/PLAN；
- [x] Android + Expo Go 路线明确；
- [x] 模拟器/真机边界明确；
- [x] 色彩强度与屏幕亮度语义明确；
- [x] 无后端/AI/相机/Torch。

最终交付：

- [ ] T001–T064 自动任务全部 PASS；
- [ ] 自动测试 PASS；
- [ ] Android Emulator 全回归 PASS；
- [ ] UI Freeze Visual QA PASS；
- [ ] 无 P0/P1；
- [ ] 用户只在最后执行 T065 Final Human Acceptance；
- [ ] 真机 V1 Gate PASS 后才能标记目标产品 V1.0 COMPLETE。

---

## 14. Change Governance

如需要改变用户行为：

1. 先改 SPEC；
2. 再同步 PLAN；
3. 再同步 TASK；
4. 做跨文档一致性检查；
5. 再修改代码。

若只是实现细节且不改变冻结行为，可由编排者内部处理并继续开发。

本 V1.1 是 V1.0 产品的 UI Freeze 开发基线。
