# 夜间补光灯（Android）

Expo + React Native + TypeScript 单页应用：打开即全屏补光，轻点呼出 Scheme C 毛玻璃控制面板（8 预设 / HSV 色盘 / 颜色强度 / 屏幕亮度）。本地优先，无账号无云端。包名 `com.filllight.nightlamp`，桌面名「夜间补光灯」。

夜间补光灯把第二台 Android 手机变成独立补光灯：主手机负责拍摄，第二台手机负责发光，无需配对、不可远程控制。

基线：`docs/plan/`（Constitution→SPEC→PLAN→TASK V1.1，UI Freeze 方案 C）。状态：V1.0 真机已验（见 `docs/handoff/HANDOFF.md`）。

## 跑起来

```bash
npm install
npx expo start            # 扫码（Expo Go）或连模拟器
npm run lint && npx tsc --noEmit && npm test   # 门禁
```

## 本地打包推真机

```bash
export JAVA_HOME=$HOME/android-toolchain/jdk-17.0.20.1+1/Contents/Home \
  ANDROID_HOME=$HOME/android-toolchain/sdk ANDROID_SDK_ROOT=$HOME/android-toolchain/sdk
npx expo prebuild --platform android   # 改了 app.json 后先跑
./gradlew :app:assembleRelease -x lint # 在 android/ 下
adb install -r app/build/outputs/apk/release/app-release.apk
```

小米机首次 USB 安装需在手机上点允许（开发者选项 → USB 安装）。

## 目录

`app/` 路由（单主页） · `src/components|state|hooks|utils|theme|constants|types` 业务 ·
`assets/`（icon、色盘贴图由 `scripts/generate-color-wheel.js` 生成） ·
`docs/qa/` 测试记录 · `docs/handoff/HANDOFF.md` 交接（先读我）。

ORCA 治理文件（AGENTS/角色卡/分工表/编排提示词）在项目根，动之前先读 HANDOFF。
