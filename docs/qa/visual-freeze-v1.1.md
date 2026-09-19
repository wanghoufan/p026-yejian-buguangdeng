# Visual Freeze v1.1（骨架，后续阶段对照设计板填充）

- 设计板：docs/plan 下 V1.1 png
- [ ] 首屏对照：
- [ ] 差异清单：

## T014 静态 UI Freeze Review（2026-09-18，PLAN V1.1 §3-§8）

对照：设计板 png + PLAN §3 tokens / §8 控件规格。不允许偏离项：

- Accent 必须 #4C8DFF；active tab 文字/图标 accent，inactive 用 textSecondary。
- Sheet：top radius 28dp，高 clamp(46vh,340,420)，glassBg 玻璃层，不依赖真 blur。
- DragHandle：36×4dp radius 999，rgba(20,33,58,0.18)，顶部 8dp。
- SegmentedTabs：高 44dp，双列 50%，active 高不透明白底。
- Sliders：Label+Value 一行，track 4dp，thumb 20dp，active=accent。
- Presets（T034 起）：4×2，48dp 圆，选中 2dp accent ring+2dp gap。
- 图标：线性风格，不新增风格；实现仅用 RN 内置/文字 glyph。
- Icon/Splash：方案C（浅蓝/薄荷/粉紫渐变+白色光源 glyph，无文字）；splash 为系统级极短过渡，无业务等待页/按钮。
- 状态：首屏直接补光（无欢迎页），Sheet closed 无常驻业务按钮。

结论：T007–T013 静态实现与上述一致；真机/模拟器截图核对留待 T057–T061。

## T057–T061 Visual Freeze QA（2026-09-18，静态代码核对 PASS，待截图）

> 说明：本机无可用模拟器/真机截图，以下为对照设计板 png + PLAN §3/§8 的静态代码核对，判 **PASS（静态核对）**；T065 真机验收时补三张实拍截图后转为完整 PASS。

- [x] T057 State A Pure Light（360×800dp）：`app/index.tsx` closed 时只渲染全屏 `LightCanvas`（absolute fill，背景=displayColor），无业务按钮、无欢迎页。标记：【待截图 State A】。
- [x] T058 State B Preset Sheet（360×800dp）：`ControlSheet` 高 `clamp(46vh,340,420)`、top radius 28dp、glassBg 半透明+边框（`tokens.ts`/`ControlSheet.tsx`）；`SegmentedTabs` 高 44dp 双列 50%，active 白底+accent 字；`PresetPalette` 4×2、48dp 圆、2dp accent ring+gap；两 `LabeledSlider`（track 4dp/thumb 20dp，active=accent `#4C8DFF`）。标记：【待截图 State B】。
- [x] T059 State C Color Wheel Sheet（360×800dp）：`ColorWheelPanel` 直径 `min(220,max(180,screenW-120))`，360dp 宽→240→钳制 220dp，不溢出；indicator 20dp（18–22dp 内）；Slider 布局结构不变（`panel minHeight 170`）。标记：【待截图 State C】。
- [x] T060 第二 viewport 响应式（393×873dp）：Sheet 高=0.46×873≈401dp（340–420 内）；色轮 220dp 上限；Preset 4×2 列间距响应式分配（`PresetPalette`）；`ControlSheet body paddingHorizontal 20` 在 393 宽下无溢出。标记：【待截图 393 宽】。
- [x] T061 毛玻璃气质核对（对照设计板 png）：浅色玻璃层 `rgba(248,252,255,0.76)` + 白高光边框，不依赖真 blur（PLAN §8 允许）；圆角 28dp、轻量层级（单边框+阴影 token）、蓝色 Accent `#4C8DFF` 仅用于 active tab/选中环/sliderActive/thumb；无像素级抄图、无额外装饰动画（开 220ms/关 200ms，无弹跳粒子）。

结论：T057–T061 **PASS（静态代码核对）**，4 张待截图标记留 T065 补。
