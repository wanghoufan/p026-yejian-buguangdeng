// 简体中文词典：键集合必须与 en.ts 完全一致（见 src/i18n/index.ts findMissingKeys）。
const zhCN = {
  controls: {
    colorIntensity: '颜色强度',
    screenBrightness: '屏幕亮度',
    resetWarmWhite: '恢复暖白默认',
  },
  tabs: {
    presets: '预设颜色',
    colorWheel: '色轮',
  },
  accessibility: {
    colorWheel: '色相色盘',
  },
  // 键名 = PRESETS 的稳定 id，禁止随显示语言改动。
  presets: {
    'warm-white': '暖白',
    'neutral-white': '中性白',
    'cool-white': '冷白',
    cream: '奶油',
    'peach-pink': '桃粉',
    'rose-pink': '玫瑰粉',
    'ambient-purple': '氛围紫',
    'ice-blue': '冰蓝',
  },
  settings: {
    title: '设置',
    language: '语言',
    back: '返回',
    entry: '设置',
    saveFailed: '语言未能保存，请重试',
    retry: '重试',
  },
};

export default zhCN;
