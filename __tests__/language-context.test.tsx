import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { Pressable, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageProvider } from '../src/i18n/LanguageContext';
import { useLanguage } from '../src/hooks/useLanguage';
import { LANGUAGE_STORAGE_KEY } from '../src/i18n';

// V2.1 F3/F4：启动语言决策、即时切换、持久化、竞态与写入失败重试。

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockDeviceLocales = jest.fn();
jest.mock('expo-localization', () => ({
  getLocales: () => mockDeviceLocales(),
}));

// 通过渲染出的节点驱动，不把 hook 返回值捕获到模块作用域。
function Probe() {
  const ctx = useLanguage();
  return (
    <>
      <Text testID="probe">{`${ctx.locale}|${ctx.isReady}|${ctx.saveError}`}</Text>
      <Text testID="t-colorIntensity">{ctx.t('controls.colorIntensity')}</Text>
      <Text testID="t-reset">{ctx.t('controls.resetWarmWhite')}</Text>
      <Text testID="keys">{Object.keys(ctx).sort().join(',')}</Text>
      <Pressable testID="set-en" onPress={() => ctx.setLocale('en')}>
        <Text>en</Text>
      </Pressable>
      <Pressable testID="set-zh" onPress={() => ctx.setLocale('zh-CN')}>
        <Text>zh</Text>
      </Pressable>
      <Pressable testID="retry" onPress={ctx.retrySave}>
        <Text>retry</Text>
      </Pressable>
    </>
  );
}

async function mount(): Promise<ReactTestRenderer> {
  let tree!: ReactTestRenderer;
  await act(async () => {
    tree = create(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
  });
  return tree;
}

function node(tree: ReactTestRenderer, testID: string) {
  return tree.root.findByProps({ testID });
}

const probe = (tree: ReactTestRenderer) => node(tree, 'probe').props.children as string;

async function press(tree: ReactTestRenderer, testID: string): Promise<void> {
  await act(async () => {
    node(tree, testID).props.onPress();
  });
}

const deviceEn = () => mockDeviceLocales.mockReturnValue([{ languageCode: 'en', languageTag: 'en-US' }]);
const deviceZh = () => mockDeviceLocales.mockReturnValue([{ languageCode: 'zh', languageTag: 'zh-CN' }]);

describe('LanguageProvider（F3/F4）', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    deviceZh();
  });

  test('有有效持久化偏好时直接使用，忽略设备语言', async () => {
    deviceEn();
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'zh-CN');
    const tree = await mount();
    expect(probe(tree)).toBe('zh-CN|true|false');
    expect(node(tree, 't-colorIntensity').props.children).toBe('颜色强度');
  });

  test('无偏好时按设备语言：英语设备 → en', async () => {
    deviceEn();
    const tree = await mount();
    expect(probe(tree)).toBe('en|true|false');
    expect(node(tree, 't-colorIntensity').props.children).toBe('Color intensity');
  });

  test('无偏好且设备为其他语言 → 回退 zh-CN', async () => {
    mockDeviceLocales.mockReturnValue([{ languageCode: 'ja', languageTag: 'ja-JP' }]);
    const tree = await mount();
    expect(probe(tree)).toBe('zh-CN|true|false');
  });

  test('持久化值非法 → 走设备语言；设备检测抛错 → 回退 zh-CN 且不崩溃', async () => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'fr-FR');
    deviceEn();
    const tree = await mount();
    expect(probe(tree)).toBe('en|true|false');
    tree.unmount();

    mockDeviceLocales.mockImplementation(() => {
      throw new Error('localization unavailable');
    });
    const tree2 = await mount();
    expect(probe(tree2)).toBe('zh-CN|true|false');
    tree2.unmount();
  });

  test('设备列表为空/首项缺 languageCode 时回退 zh-CN', async () => {
    mockDeviceLocales.mockReturnValue([]);
    const tree = await mount();
    expect(probe(tree)).toBe('zh-CN|true|false');
    tree.unmount();

    mockDeviceLocales.mockReturnValue([{ languageCode: null, languageTag: null }]);
    const tree2 = await mount();
    expect(probe(tree2)).toBe('zh-CN|true|false');
    tree2.unmount();
  });

  test('F3 手动切换即时生效并持久化，且只写语言键', async () => {
    const tree = await mount();
    await press(tree, 'set-en');
    expect(probe(tree)).toBe('en|true|false');
    expect(node(tree, 't-reset').props.children).toBe('Reset to warm white');
    expect(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');

    const keys = (AsyncStorage.setItem as jest.Mock).mock.calls.map((call) => call[0]);
    expect(keys).toEqual([LANGUAGE_STORAGE_KEY]);
    expect(await AsyncStorage.getItem('fill-light:v1:last-state')).toBeNull();
    tree.unmount();
  });

  test('F3 快速连续切换：界面与最终持久值都以最后一次选择为准', async () => {
    const tree = await mount();
    // 同一批次内连续点击（模拟快速切换），写入必须串行、末次胜出。
    await act(async () => {
      node(tree, 'set-en').props.onPress();
      node(tree, 'set-zh').props.onPress();
      node(tree, 'set-en').props.onPress();
    });
    expect(probe(tree)).toBe('en|true|false');
    expect(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');

    await press(tree, 'set-zh');
    expect(probe(tree)).toBe('zh-CN|true|false');
    expect(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('zh-CN');
    tree.unmount();
  });

  test('F4 写入失败暴露 saveError，重试成功后清除且落盘', async () => {
    const tree = await mount();
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('disk full'));

    await press(tree, 'set-en');
    expect(probe(tree)).toBe('en|true|true');
    expect(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull();

    await press(tree, 'retry');
    expect(probe(tree)).toBe('en|true|false');
    expect(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
    tree.unmount();
  });

  test('初始化读取未完成时用户先切换 → 本次选择优先，异步读取不得覆盖', async () => {
    let resolveGet!: (value: string | null) => void;
    (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(
      () => new Promise<string | null>((resolve) => { resolveGet = resolve; }),
    );

    const tree = await mount();
    expect(probe(tree)).toBe('zh-CN|false|false'); // 读取挂起，翻译控件未就绪

    await press(tree, 'set-en');
    expect(probe(tree)).toBe('en|true|false');

    await act(async () => {
      resolveGet(null); // 迟到的读取结果：无偏好 + 设备 zh
      await Promise.resolve();
    });
    expect(probe(tree)).toBe('en|true|false');
    tree.unmount();
  });

  test('语言状态独立于补光状态：Provider 不暴露补光字段', async () => {
    const tree = await mount();
    expect(node(tree, 'keys').props.children).toBe('isReady,locale,retrySave,saveError,setLocale,t');
    tree.unmount();
  });
});
