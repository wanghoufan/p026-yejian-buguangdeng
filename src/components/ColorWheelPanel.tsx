import { useMemo, useState } from 'react';
import { Dimensions, Image, PanResponder, StyleSheet, View } from 'react-native';
import { hexToRgb, rgbToHex } from '../utils/color';

type Props = {
  color: string;
  onChange: (hex: string) => void;
  onEnd?: (hex: string) => void;
};

// T038–T041: Expo Go 兼容「整块 HSV 色盘」（不新增原生依赖）。
// 贴图 assets/color-wheel.png 由 scripts/generate-color-wheel.js 生成：
// H 绕圆心 0–360°、S 由圆心 0 → 边缘 1（圆心自然为白）、V 固定 1、圆外透明。
// 运行时只做「Image 贴图 + PanResponder 命中映射」，不拼色环 View 段、不引第三方色轮。
const WHEEL_IMAGE = require('../../assets/color-wheel.png');
const MIN_SIZE = 180; // PLAN §8 小屏下限
const MAX_SIZE = 200; // PLAN §8 目标直径 200dp（小屏仍按 clamp 降到 180dp）
const INDICATOR_SIZE = 20; // PLAN §8 indicator 18–22dp
const WHEEL_VALUE = 1; // 贴图与交互同一口径：V=1
const DEAD_ZONE = INDICATOR_SIZE / 2; // 圆心死区（一个 knob 半径），避免近圆心处色相跳变

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function rgbToHsv(r: number, g: number, b: number): [number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : d / max;
  return [h, s];
}

/**
 * 触摸点 → H/S（V 固定 1）。
 * 圆心死区与圆外透明区不参与映射；clampToRim=true 时拖出圆外贴边跟手。
 */
function pointToHs(x: number, y: number, radius: number, clampToRim: boolean): { h: number; s: number } | null {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const dx = x - radius;
  const dy = y - radius;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < DEAD_ZONE) return null;
  if (dist > radius && !clampToRim) return null;

  let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return { h: deg, s: Math.min(1, dist / radius) };
}

export default function ColorWheelPanel({ color, onChange, onEnd }: Props) {
  const screenW = Dimensions.get('window').width;
  const size = Math.min(MAX_SIZE, Math.max(MIN_SIZE, screenW - 120));
  const radius = size / 2;

  // T041: 内部 H/S 只能从「当前 targetColor」反推初始化，绝不用默认色覆盖。
  const [r0, g0, b0] = hexToRgb(color);
  const [baseH, baseS] = useMemo(() => rgbToHsv(r0, g0, b0), [r0, g0, b0]);
  // 拖动中的取样优先于 prop：hex 取整不会把 indicator 拉回去。
  // 切 Tab 会卸载重挂，取样自然复位；未拖动时永远跟随 prop（挂载/预设/hydrate 都同步，且不回写）。
  const [picked, setPicked] = useState<{ h: number; s: number } | null>(null);
  const hue = picked ? picked.h : baseH;
  const sat = picked ? picked.s : baseS;

  // PanResponder 回调只做「触摸点 → H/S → onChange」，不读写 ref、不产生渲染期副作用。
  const pan = useMemo(() => {
    // 唯一的写回归口：只由真实触摸处理函数调用。
    const selectAt = (x: number, y: number, clampToRim: boolean) => {
      const p = pointToHs(x, y, radius, clampToRim);
      if (p === null) return;
      setPicked(p);
      const [r, g, b] = hsvToRgb(p.h, p.s, WHEEL_VALUE);
      onChange(rgbToHex(r, g, b));
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      // 圆心死区 / 圆外透明区：本次触摸不认（不改色）
      onPanResponderGrant: (e) => selectAt(e.nativeEvent.locationX, e.nativeEvent.locationY, false),
      // 拖出圆外时贴边继续跟手
      onPanResponderMove: (e) => selectAt(e.nativeEvent.locationX, e.nativeEvent.locationY, true),
      // 一次真实触摸结束（含落在死区的一次轻点）：只回传持久化信号，颜色不变
      onPanResponderRelease: () => onEnd?.(color),
      onPanResponderTerminate: () => onEnd?.(color),
    });
  }, [radius, color, onChange, onEnd]);

  const hueRad = (hue * Math.PI) / 180;
  const dotDistance = Math.min(1, Math.max(0, sat)) * radius;
  const half = INDICATOR_SIZE / 2;
  // indicator 圆心落在当前 HS 位置，并夹在色盘方框内（贴边时不至于半个 knob 出框）。
  const dotX = Math.min(size - half, Math.max(half, radius + Math.cos(hueRad) * dotDistance));
  const dotY = Math.min(size - half, Math.max(half, radius + Math.sin(hueRad) * dotDistance));

  return (
    <View style={styles.wrap} testID="color-wheel">
      <View
        {...pan.panHandlers}
        testID="wheel-ring"
        accessibilityRole="adjustable"
        accessibilityLabel="色相色盘"
        accessibilityValue={{ now: Math.round(hue), min: 0, max: 360 }}
        style={[styles.wheel, { width: size, height: size, borderRadius: radius }]}
      >
        <Image source={WHEEL_IMAGE} style={styles.image} resizeMode="cover" />
        <View pointerEvents="none" style={[styles.indicator, { left: dotX - half, top: dotY - half }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 8 },
  wheel: { alignItems: 'center', justifyContent: 'center' },
  // pointerEvents 放 style：Image 不接 pointerEvents prop（触摸统一落到色盘容器，locationX/Y 才准）。
  image: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' },
  indicator: {
    position: 'absolute',
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(20,33,58,0.18)',
    elevation: 3,
  },
});
