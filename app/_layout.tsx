import { Stack } from 'expo-router';
import { LanguageProvider } from '../src/i18n/LanguageContext';
import { FillLightProvider } from '../src/state/FillLightContext';

// 两个 Provider 都挂在路由根：页面导航不重新初始化语言偏好与补光状态。
export default function RootLayout() {
  return (
    <LanguageProvider>
      <FillLightProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
      </FillLightProvider>
    </LanguageProvider>
  );
}
