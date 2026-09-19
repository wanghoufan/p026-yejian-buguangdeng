import { View, StyleSheet } from 'react-native';
import { ui } from '../theme/tokens';

export default function DragHandle() {
  return (
    <View style={styles.wrap}>
      <View style={styles.bar} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 8 },
  bar: { width: 36, height: 4, borderRadius: 999, backgroundColor: ui.dragHandle },
});
