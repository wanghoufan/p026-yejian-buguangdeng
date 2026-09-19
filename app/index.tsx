import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { FillLightProvider, useFillLight } from '../src/state/FillLightContext';
import { useSystemUi } from '../src/hooks/useSystemUi';
import { useAppBrightness } from '../src/hooks/useAppBrightness';
import LightCanvas from '../src/components/LightCanvas';
import ControlSheet from '../src/components/ControlSheet';

// T026: 无额外停留，直接进画布。
function Screen() {
  useKeepAwake(); // T023
  const { state, display, dispatch } = useFillLight();
  useSystemUi(true); // T025
  useAppBrightness(state.screenBrightness); // T045-T049

  const toggle = () =>
    dispatch({ type: 'SET_SHEET_OPEN', isSheetOpen: !state.isSheetOpen });

  return (
    <View style={styles.root}>
      <StatusBar hidden />{/* T024 */}
      <LightCanvas displayColor={display} onTap={toggle} />
      {state.isSheetOpen && <ControlSheet />}
    </View>
  );
}

export default function Index() {
  return (
    <FillLightProvider>
      <Screen />
    </FillLightProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
