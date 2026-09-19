import { LayoutChangeEvent, GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ui, typography } from '../theme/tokens';

type Props = {
  label: string;
  value: number; // 0..1
  onValueChange: (v: number) => void;
  onSlidingComplete?: (v: number) => void;
  testID?: string;
};

// Expo Go 兼容自研 Slider（Pressable）：track 4dp / thumb 20dp，Scheme C 样式。
// P0 真机闪跳：拖动中只读本地态 dragValue，不依赖全局 state 回环，
// 因此每像素 setState 只重渲染本组件，thumb 不会被外部旧值拉回。
// P0 拖动断续：touch 处理函数身份必须稳定（依赖仅 ref）。
// 内联箭头回调每次父组件重渲染都换身份 → Pressable 重建 → 触摸 responder 中途丢失。
// 这里用 ref 持有最新回调、useCallback 固定处理函数、memo 隔离父组件重渲染。
//
// P0 坐标塌陷（本轮修复）：e.nativeEvent.locationX 是相对「实际 touch target 子 View」的，
// thumb/fill/rest 都带 backgroundColor 会成为 target。手指压在 thumb（20dp）上时 locationX
// 只有 0~20，v 直接塌到 0 → thumb/亮度瞬跳。改用 pageX（窗口坐标）：
// onTouchStart 对 currentTarget 调一次 measure，缓存 pressable 的 pageX 与宽度，
// v = (pageX - cachedPageX) / cachedWidth。move/end 复用缓存 + 本次 pageX，不再读 locationX。
// measure 异步返回前到达的 move 直接丢弃（宁可少跟一两帧，也不用不可信的坐标）；
// 缓存跨手势保留，首个手势等 measure 回调，之后手势直接命中。
// measure 不可用或失败时，回退到原 locationX / onLayout 宽度方案兜底，行为不退化。
function LabeledSlider({ label, value, onValueChange, onSlidingComplete, testID }: Props) {
  const widthRef = useRef(0); // onLayout 兜底宽度
  const pageXRef = useRef<number | null>(null); // measure 缓存的 pressable 左边界（窗口坐标）
  const measuredWidthRef = useRef(0); // measure 缓存的 pressable 宽度
  const sliding = useRef(false);
  const [dragValue, setDragValue] = useState<number | null>(null);
  const dragValueRef = useRef<number | null>(null);
  const display = dragValue ?? value;

  // 回调与值放 ref：处理函数只读 ref，避免闭包过期；父组件换回调不影响手势身份。
  const onValueChangeRef = useRef(onValueChange);
  const onSlidingCompleteRef = useRef(onSlidingComplete);
  const valueRef = useRef(value);
  useEffect(() => {
    onValueChangeRef.current = onValueChange;
    onSlidingCompleteRef.current = onSlidingComplete;
    valueRef.current = value;
  });

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
  }, []);

  const setDrag = useCallback((v: number | null) => {
    dragValueRef.current = v;
    setDragValue(v);
  }, []);

  // 事件 → 0..1。坐标不可信时返回 null，调用方丢帧（绝不退回用错的 locationX 值）。
  const resolveValue = useCallback((ev: GestureResponderEvent['nativeEvent']): number | null => {
    const w = measuredWidthRef.current > 0 ? measuredWidthRef.current : widthRef.current;
    if (w <= 0) return null;
    if (Number.isFinite(ev.pageX)) {
      if (pageXRef.current === null) return null; // measure 未回：等回调，不跳
      return Math.min(1, Math.max(0, (ev.pageX - pageXRef.current) / w));
    }
    // 无 pageX（异常环境 / 测试桩）：locationX 兜底
    return Number.isFinite(ev.locationX) ? Math.min(1, Math.max(0, ev.locationX / w)) : null;
  }, []);

  const applyValue = useCallback(
    (v: number) => {
      setDrag(v); // 本地即时跟手
      onValueChangeRef.current(v); // 全局上报（上游做节流）
    },
    [setDrag],
  );

  // 量一次 pressable 并刷新缓存；measure 非同步，回调到达时若本次 start 还没落地，用它的 pageX 补算。
  const measurePressable = useCallback(
    (e: GestureResponderEvent, pendingEv: GestureResponderEvent['nativeEvent'] | null) => {
      const node = e.currentTarget;
      if (!node || typeof node.measure !== 'function') return;
      node.measure((_x, _y, w, _h, pageX) => {
        if (Number.isFinite(w) && w > 0) measuredWidthRef.current = w;
        if (Number.isFinite(pageX)) pageXRef.current = pageX;
        if (!pendingEv || !sliding.current) return;
        const v = resolveValue(pendingEv);
        if (v !== null) applyValue(v);
      });
    },
    [applyValue, resolveValue],
  );

  const onTouchStart = useCallback(
    (e: GestureResponderEvent) => {
      sliding.current = true;
      const ev = e.nativeEvent;
      const immediate = resolveValue(ev);
      if (immediate !== null) {
        measurePressable(e, null); // 缓存已可用：本次直接用，顺手刷新缓存
        applyValue(immediate);
        return;
      }
      // pageX 可用但缓存未就绪：等 measure 回调用 start 的 pageX 补算首帧（不跳）。
      measurePressable(e, ev);
    },
    [applyValue, measurePressable, resolveValue],
  );

  const onTouchMove = useCallback(
    (e: GestureResponderEvent) => {
      if (!sliding.current) return;
      const v = resolveValue(e.nativeEvent);
      if (v === null) return; // measure 未回 / 坐标缺失：丢帧，不用错坐标
      applyValue(v);
    },
    [applyValue, resolveValue],
  );

  const onTouchEnd = useCallback(
    (e: GestureResponderEvent) => {
      sliding.current = false;
      const v = resolveValue(e.nativeEvent);
      setDrag(null);
      // 先上报最终值（上游 flush 后同步 dispatch），再通知落盘：同一批次内提交，thumb 不回跳。
      const finalV = v ?? dragValueRef.current ?? valueRef.current;
      onValueChangeRef.current(finalV);
      onSlidingCompleteRef.current?.(finalV);
    },
    [resolveValue, setDrag],
  );

  const onTouchCancel = useCallback(() => {
    sliding.current = false;
    const v = dragValueRef.current ?? valueRef.current;
    setDrag(null);
    onSlidingCompleteRef.current?.(v);
  }, [setDrag]);

  return (
    <View testID={testID}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{`${Math.round(display * 100)}%`}</Text>
      </View>
      <Pressable
        accessibilityRole="adjustable"
        accessibilityValue={{ now: Math.round(display * 100), min: 0, max: 100 }}
        onLayout={onLayout}
        style={styles.hit}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
      >
        <View style={styles.track}>
          <View style={[styles.fill, { flex: display }]} />
          <View style={[styles.rest, { flex: Math.max(0, 1 - display) }]} />
        </View>
        <View style={[styles.thumb, { left: `${display * 100}%` }]} />
      </Pressable>
    </View>
  );
}

export default memo(LabeledSlider);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: typography.sliderLabel.fontSize, fontWeight: '500', color: ui.textPrimary },
  value: { fontSize: typography.sliderValue.fontSize, fontWeight: '500', color: ui.textSecondary },
  hit: { height: 32, justifyContent: 'center' },
  track: { height: 4, flexDirection: 'row', borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, backgroundColor: ui.accent },
  rest: { height: 4, backgroundColor: ui.trackInactive },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: ui.accent,
    marginLeft: -10,
    top: 6,
  },
});
