import { LayoutChangeEvent, GestureResponderEvent, StyleSheet, Text, View } from 'react-native';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ui, typography } from '../theme/tokens';

type Props = {
  label: string;
  value: number; // 0..1
  onValueChange: (v: number) => void;
  onSlidingComplete?: (v: number) => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  testID?: string;
};

// thumb 直径（dp），与 styles.thumb 一致；行程与坐标换算都用它。
const THUMB_SIZE = 20;
const THUMB_RADIUS = THUMB_SIZE / 2;

// Expo Go 兼容自研 Slider（Pressable）：track 4dp / thumb 20dp，Scheme C 样式。
// P0 真机闪跳：拖动中只读本地态 dragValue，不依赖全局 state 回环，
// 因此每像素 setState 只重渲染本组件，thumb 不会被外部旧值拉回。
// P0 拖动断续：touch 处理函数身份必须稳定（依赖仅 ref）。
// 内联箭头回调每次父组件重渲染都换身份 → Pressable 重建 → 触摸 responder 中途丢失。
// 这里用 ref 持有最新回调、useCallback 固定处理函数、memo 隔离父组件重渲染。
//
// P0 坐标塌陷：e.nativeEvent.locationX 是相对「实际 touch target 子 View」的，
// thumb/fill/rest 都带 backgroundColor 会成为 target。手指压在 thumb（20dp）上时 locationX
// 只有 0~20，v 直接塌到 0 → thumb/亮度瞬跳。改用 pageX（窗口坐标）：
// measure 缓存 pressable 的 pageX 与宽度，v 由 pageX 换算，不读 locationX。
// measure 异步返回前到达的 move 直接丢弃（宁可少跟一两帧，也不用不可信的坐标）；
// measure 不可用或失败时，回退到 locationX / onLayout 宽度方案兜底。
//
// T-V1.1-04 P0-1 拇指越界被裁：原来 thumb 中心走满 0..100%（left = display*100%），
// 两端各有半径长度伸到 Pressable 外面，被 ScrollView 视口裁掉（100% 时只看得见左半）。
// 改成 thumb 在 rail 内走 [半径, 宽-半径]：rail 左右各内缩一个半径，
// thumb 行程变成 span = 宽 - 2*半径，两端都完整可见；
// 坐标换算同步用同一套内缩几何 v = (pageX - pressableX - 半径) / span，
// 保证拇指中心始终落在手指下（否则指尖与拇指会错开半个半径）。
//
// T-V1.1-04 P0-2 拖动中途中止（拇指脱离且“滑不动”）：真机日志证明手指纵向漂移超过
// 父级 ScrollView 的 touch slop 时，父级原生拦截手势 → 子级收到 ACTION_CANCEL →
// 原实现 sliding=false → 该手势剩余全部 move 被丢，拇指冻结在半路。
// 两处修：①Pressable 加 blockNativeResponder + cancelable={false}，成为 responder 时
// 阻止原生父级拦截、并拒绝被 JS 侧夺走；②onTouchCancel 不再把手势判死，
// 手指未真的抬起时后续 move 仍继续跟手（真抬手由 touchEnd / 下次 touchStart 兜底）。
//
// T-V1.1-04 另一个隐患：onLayout 时预热一次 measure 缓存，使首个手势不必等异步 measure
// 回调；旋转（横竖屏）后布局变化会重新预热，避免继续用旧方向的 pageX/宽度算出错值。
type MeasurableNode = {
  measure?: (cb: (x: number, y: number, w: number, h: number, pageX: number, pageY: number) => void) => void;
};

function LabeledSlider({ label, value, onValueChange, onSlidingComplete, onInteractionStart, onInteractionEnd, testID }: Props) {
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
  const onInteractionStartRef = useRef(onInteractionStart);
  const onInteractionEndRef = useRef(onInteractionEnd);
  const valueRef = useRef(value);
  useEffect(() => {
    onValueChangeRef.current = onValueChange;
    onSlidingCompleteRef.current = onSlidingComplete;
    onInteractionStartRef.current = onInteractionStart;
    onInteractionEndRef.current = onInteractionEnd;
    valueRef.current = value;
  });

  const setDrag = useCallback((v: number | null) => {
    dragValueRef.current = v;
    setDragValue(v);
  }, []);

  // 事件 → 0..1。坐标不可信时返回 null，调用方丢帧（绝不退回用错的 locationX 值）。
  const resolveValue = useCallback((ev: GestureResponderEvent['nativeEvent']): number | null => {
    const w = measuredWidthRef.current > 0 ? measuredWidthRef.current : widthRef.current;
    const span = w - THUMB_SIZE; // thumb 中心的行程长度（两端各留一个半径）
    if (span <= 0) return null;
    if (Number.isFinite(ev.pageX)) {
      if (pageXRef.current === null) return null; // measure 未回：等回调，不跳
      return Math.min(1, Math.max(0, (ev.pageX - pageXRef.current - THUMB_RADIUS) / span));
    }
    // 无 pageX（异常环境 / 测试桩）：locationX 兜底
    return Number.isFinite(ev.locationX) ? Math.min(1, Math.max(0, (ev.locationX - THUMB_RADIUS) / span)) : null;
  }, []);

  const applyValue = useCallback(
    (v: number) => {
      setDrag(v); // 本地即时跟手
      onValueChangeRef.current(v); // 全局上报（上游做节流）
    },
    [setDrag],
  );

  // 量一次 pressable 并刷新缓存；measure 非同步，回调到达时若本次 start 还没落地，用它的 pageX 补算。
  const refreshMeasure = useCallback(
    (node: unknown, pendingEv: GestureResponderEvent['nativeEvent'] | null) => {
      const target = node as MeasurableNode | null | undefined;
      if (!target || typeof target.measure !== 'function') return;
      target.measure((_x, _y, w, _h, pageX) => {
        if (Number.isFinite(w) && w > 0) measuredWidthRef.current = w;
        if (Number.isFinite(pageX)) pageXRef.current = pageX;
        if (!pendingEv || !sliding.current) return;
        const v = resolveValue(pendingEv);
        if (v !== null) applyValue(v);
      });
    },
    [applyValue, resolveValue],
  );

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      widthRef.current = e.nativeEvent.layout.width;
      // 预热窗口坐标缓存：首个手势不必等 measure；横竖屏切换后重新校准，避免沿用旧方向坐标。
      refreshMeasure(e.currentTarget, null);
    },
    [refreshMeasure],
  );

  const onTouchStart = useCallback(
    (e: GestureResponderEvent) => {
      sliding.current = true;
      onInteractionStartRef.current?.();
      const ev = e.nativeEvent;
      const immediate = resolveValue(ev);
      if (immediate !== null) {
        refreshMeasure(e.currentTarget, null); // 缓存已可用：本次直接用，顺手刷新缓存
        applyValue(immediate);
        return;
      }
      // pageX 可用但缓存未就绪：等 measure 回调用 start 的 pageX 补算首帧（不跳）。
      refreshMeasure(e.currentTarget, ev);
    },
    [applyValue, refreshMeasure, resolveValue],
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
      onInteractionEndRef.current?.();
      const v = resolveValue(e.nativeEvent);
      setDrag(null);
      // 先上报最终值（上游 flush 后同步 dispatch），再通知落盘：同一批次内提交，thumb 不回跳。
      const finalV = v ?? dragValueRef.current ?? valueRef.current;
      onValueChangeRef.current(finalV);
      onSlidingCompleteRef.current?.(finalV);
    },
    [resolveValue, setDrag],
  );

  // 手势被父级取消时上报当前值（不丢数据、自动收起计时器照常续上），但不把手势判死：
  // 手指没真抬起时后续 move 仍应继续跟手（真抬起由 touchEnd / 下次 touchStart 兜底）。
  const onTouchCancel = useCallback(() => {
    onInteractionEndRef.current?.();
    const v = dragValueRef.current ?? valueRef.current;
    onValueChangeRef.current(v);
    onSlidingCompleteRef.current?.(v);
  }, []);

  return (
    <View testID={testID}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{`${Math.round(display * 100)}%`}</Text>
      </View>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityValue={{ now: Math.round(display * 100), min: 0, max: 100 }}
        collapsable={false}
        // 手势归属：自己当 responder（start 即抢），并阻止原生父级拦截。
        // onResponderGrant 返回 true → RN 以 blockNativeResponder 调 setIsJSResponder，
        // 父级 ScrollView 的原生拦截被禁用（RN 源码：grantResult === true）。
        // 再拒绝父级（JS 侧）的夺权请求：拖动中绝不交出手势，避免 ACTION_CANCEL 把拖动打断。
        onStartShouldSetResponder={() => true}
        onResponderGrant={() => true}
        onResponderTerminationRequest={() => false}
        onLayout={onLayout}
        style={styles.hit}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
      >
        <View style={styles.rail}>
          <View style={styles.track}>
            <View style={[styles.fill, { flex: display }]} />
            <View style={[styles.rest, { flex: Math.max(0, 1 - display) }]} />
          </View>
          <View style={[styles.thumb, { left: `${display * 100}%` }]} />
        </View>
      </View>
    </View>
  );
}

export default memo(LabeledSlider);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: typography.sliderLabel.fontSize, fontWeight: '500', color: ui.textPrimary },
  value: { fontSize: typography.sliderValue.fontSize, fontWeight: '500', color: ui.textSecondary },
  hit: { height: 32, justifyContent: 'center' },
  // thumb 半径的左右内缩：thumb 中心行程 [半径, 宽-半径]，两端拇指完整不出界。
  rail: { height: 32, justifyContent: 'center', marginHorizontal: THUMB_RADIUS },
  track: { height: 4, flexDirection: 'row', borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, backgroundColor: ui.accent },
  rest: { height: 4, backgroundColor: ui.trackInactive },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 999,
    backgroundColor: ui.accent,
    marginLeft: -THUMB_RADIUS,
    top: 6,
  },
});
