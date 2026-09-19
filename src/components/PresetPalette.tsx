import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PRESETS } from '../constants/presets';
import { ui } from '../theme/tokens';

type Props = {
  selectedId: string | null;
  onSelect: (id: string) => void;
};

// T034-T036: 4x2 48dp 圆，2dp accent ring。整格（圆 + label）都是点击区。
// 点击由父级更新 target/source/presetId（保留 intensity）。
export default function PresetPalette({ selectedId, onSelect }: Props) {
  return (
    <View style={styles.grid} testID="preset-palette">
      {PRESETS.map((p) => {
        const selected = p.id === selectedId;
        return (
          <Pressable
            key={p.id}
            testID={`preset-${p.id}`}
            accessibilityRole="button"
            accessibilityLabel={p.label}
            accessibilityState={{ selected }}
            onPress={() => onSelect(p.id)}
            style={styles.cell}
          >
            <View style={[styles.dot, { backgroundColor: p.color }, selected && styles.dotSelected]} />
            <Text style={styles.label} numberOfLines={1}>
              {p.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '25%', alignItems: 'center', marginBottom: 10 },
  dot: { width: 48, height: 48, borderRadius: 999 },
  dotSelected: { borderWidth: 2, borderColor: ui.accent },
  label: { marginTop: 4, fontSize: 12, color: ui.textSecondary },
});
