import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ui, radius, typography } from '../theme/tokens';

export type SegmentedTab = { id: string; label: string };

type Props = {
  tabs: SegmentedTab[];
  value: string;
  onChange: (id: string) => void;
};

export default function SegmentedTabs({ tabs, value, onChange }: Props) {
  return (
    <View style={styles.outer}>
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <Pressable
            key={t.id}
            onPress={() => onChange(t.id)}
            style={[styles.tab, active && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    height: 44,
    flexDirection: 'row',
    borderRadius: radius.segmented,
    backgroundColor: ui.inactivePill,
    padding: 3,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.segmented },
  tabActive: { backgroundColor: ui.activePill },
  label: { fontSize: typography.tab.fontSize, color: ui.textSecondary },
  labelActive: { color: ui.accent, fontWeight: '600' },
});
