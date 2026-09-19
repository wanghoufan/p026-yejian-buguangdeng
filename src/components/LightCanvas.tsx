import { Pressable, StyleSheet } from 'react-native';

type Props = {
  displayColor: string;
  onTap: () => void;
  testID?: string;
};

// T021: 全屏画布，背景仅由 displayColor 决定。
export default function LightCanvas({ displayColor, onTap, testID }: Props) {
  return (
    <Pressable
      testID={testID ?? 'light-canvas'}
      onPress={onTap}
      style={[styles.canvas, { backgroundColor: displayColor }]}
    />
  );
}

const styles = StyleSheet.create({
  canvas: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
});
