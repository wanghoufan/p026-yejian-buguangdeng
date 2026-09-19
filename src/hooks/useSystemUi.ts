import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

// T025: NavigationBar 尽可能隐藏（Expo Go 兼容，失败静默）。
export function useSystemUi(hidden: boolean) {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    (async () => {
      try {
        await NavigationBar.setVisibilityAsync(hidden ? 'hidden' : 'visible');
      } catch {
        // Expo Go / 设备不支持时静默
      }
    })();
  }, [hidden]);
}
