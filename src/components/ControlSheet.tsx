import { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Dimensions, PanResponder, ScrollView, StyleSheet, View } from 'react-native';
import { clampSheetHeight, motion, radius, ui } from '../theme/tokens';
import DragHandle from './DragHandle';
import SegmentedTabs from './SegmentedTabs';
import PresetPalette from './PresetPalette';
import ColorWheelPanel from './ColorWheelPanel';
import LabeledSlider from './LabeledSlider';
import { PRESETS } from '../constants/presets';
import { useFillLight } from '../state/FillLightContext';
import { createTrailingThrottle } from '../utils/throttle';

const CLOSE_DP = 72;
const CLOSE_VELOCITY = 900; // dp/s
// P0 拖动断续：拖动中每次 dispatch 都让 Context 重渲染，需压频率（约 1 帧一次）。
export const DISPATCH_THROTTLE_MS = 32;

// T027-T032, T037, T040, T042, T046: Scheme C Control Sheet。
export default function ControlSheet() {
  const { state, dispatch, persistNow } = useFillLight();
  const open = state.isSheetOpen;
  const height = clampSheetHeight(Dimensions.get('window').height);
  const [translate] = useState(() => new Animated.Value(height));
  // PLAN §4：色轮 Tab 内容多（200dp 色盘 + 两个 Slider）时，Sheet 内部轻量滚动。
  // 仅内容高度超出视口才启用滚动，未溢出时行为与静态布局一致（不位移、不回弹）。
  // 测量值按 Tab 打标：值不属于当前 Tab 即视为无效，无需副作用重置。
  const isWheelTab = state.activeTab === 'wheel';
  const [measure, setMeasure] = useState({ tab: '', viewportH: 0, contentH: 0 });
  const scrollEnabled = measure.tab === state.activeTab && measure.contentH > measure.viewportH + 1;

  useEffect(() => {
    Animated.timing(translate, {
      toValue: open ? 0 : height,
      duration: open ? motion.sheetOpenMs : motion.sheetCloseMs,
      useNativeDriver: true,
    }).start();
  }, [open, height, translate]);

  const close = () => dispatch({ type: 'SET_SHEET_OPEN', isSheetOpen: false });

  // P0 拖动断续：拖动中每帧 dispatch → Context 全量重渲染 → Slider 子树重建。
  // 32ms trailing 节流压频率；touchEnd 走 flush 同步补发最终值（不吞、不跳回）。
  // dispatch 身份稳定，故节流器与回调跨渲染稳定，Slider 的 memo 才生效。
  const intensityThrottle = useMemo(
    () =>
      createTrailingThrottle<[number]>(
        (v) => {
          dispatch({ type: 'SET_COLOR_INTENSITY', colorIntensity: v });
        },
        DISPATCH_THROTTLE_MS,
      ),
    [dispatch],
  );
  const brightnessThrottle = useMemo(
    () =>
      createTrailingThrottle<[number]>(
        (v) => {
          dispatch({ type: 'SET_SCREEN_BRIGHTNESS', screenBrightness: v });
        },
        DISPATCH_THROTTLE_MS,
      ),
    [dispatch],
  );

  useEffect(
    () => () => {
      intensityThrottle.cancel();
      brightnessThrottle.cancel();
    },
    [intensityThrottle, brightnessThrottle],
  );

  const onIntensityChange = useCallback((v: number) => intensityThrottle.call(v), [intensityThrottle]);
  const onBrightnessChange = useCallback((v: number) => brightnessThrottle.call(v), [brightnessThrottle]);
  const onIntensityComplete = useCallback(() => {
    intensityThrottle.flush();
    persistNow();
  }, [intensityThrottle, persistNow]);
  const onBrightnessComplete = useCallback(() => {
    brightnessThrottle.flush();
    persistNow();
  }, [brightnessThrottle, persistNow]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => {
          if (g.dy > 0) translate.setValue(g.dy);
        },
        onPanResponderRelease: (_, g) => {
          // 兜底：用 g.vy（px/ms → dp/s 近似 *1000）
          const v = Math.abs(g.vy) * 1000;
          if (g.dy > CLOSE_DP || v > CLOSE_VELOCITY) close();
          else Animated.timing(translate, { toValue: 0, duration: 160, useNativeDriver: true }).start();
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [translate],
  );

  const sliders = (
    <>
      <LabeledSlider
        testID="intensity-slider"
        label="颜色强度"
        value={state.colorIntensity}
        onValueChange={onIntensityChange}
        onSlidingComplete={onIntensityComplete}
      />
      <View style={styles.gap} />
      <LabeledSlider
        testID="brightness-slider"
        label="屏幕亮度"
        value={state.screenBrightness}
        onValueChange={onBrightnessChange}
        onSlidingComplete={onBrightnessComplete}
      />
    </>
  );

  const panel =
    state.activeTab === 'preset' ? (
      <PresetPalette
        selectedId={state.colorSource === 'preset' ? state.presetId : null}
        onSelect={(id) => {
          const p = PRESETS.find((x) => x.id === id);
          if (!p) return;
          // T036: 更新 target/source/presetId，保留 intensity；T054: 预设点击立即持久化
          dispatch({ type: 'SET_TARGET_COLOR', targetColor: p.color, colorSource: 'preset', presetId: p.id });
          persistNow();
        }}
      />
    ) : (
      <ColorWheelPanel
        color={state.targetColor}
        onChange={(hex) =>
          dispatch({ type: 'SET_TARGET_COLOR', targetColor: hex, colorSource: 'custom', presetId: null })
        }
        onEnd={() => persistNow()}
      />
    );

  // Closed 时移出屏幕外 + 不收触摸；等价于早期 return null，但 lint-clean。
  return (
    <Animated.View
      testID="control-sheet"
      pointerEvents={open ? 'auto' : 'none'}
      style={[styles.sheet, { height, transform: [{ translateY: translate }] }]}
      // T032: Sheet 内手势自己消费，不冒泡到 Canvas
      onTouchStart={(e) => e.stopPropagation()}
    >
      <View {...pan.panHandlers} testID="sheet-drag-zone">
        <DragHandle />
      </View>
      <View style={styles.body}>
        <SegmentedTabs
          tabs={[
            { id: 'preset', label: '预设颜色' },
            { id: 'wheel', label: '色轮' },
          ]}
          value={state.activeTab}
          // T041: 切 Tab 只 dispatch SET_ACTIVE_TAB，绝不改动当前颜色/强度。
          // Tab 持久化由 FillLightContext 的 debounce 效果（依赖 activeTab）承担（T054）。
          onChange={(id) => dispatch({ type: 'SET_ACTIVE_TAB', activeTab: id as 'preset' | 'wheel' })}
        />
        {isWheelTab ? (
          <ScrollView
            testID="sheet-scroll"
            style={styles.fill}
            scrollEnabled={scrollEnabled}
            showsVerticalScrollIndicator={false}
            bounces={false}
            onLayout={(e) =>
              setMeasure((m) => ({
                tab: 'wheel',
                viewportH: e.nativeEvent.layout.height,
                contentH: m.tab === 'wheel' ? m.contentH : 0,
              }))
            }
            onContentSizeChange={(_w, h) =>
              setMeasure((m) => ({
                tab: 'wheel',
                viewportH: m.tab === 'wheel' ? m.viewportH : 0,
                contentH: h,
              }))
            }
          >
            <View style={styles.panel}>{panel}</View>
            {sliders}
          </ScrollView>
        ) : (
          <View style={styles.fill}>
            <View style={styles.panel}>{panel}</View>
            {sliders}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: ui.glassBg,
    borderTopLeftRadius: radius.sheetTop,
    borderTopRightRadius: radius.sheetTop,
    borderWidth: 1,
    borderColor: ui.glassBorder,
  },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  fill: { flex: 1 },
  panel: { paddingTop: 12, minHeight: 170 },
  gap: { height: 12 },
});
