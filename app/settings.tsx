import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useLanguage } from '../src/hooks/useLanguage';
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from '../src/i18n';
import { radius, spacing, typography, ui } from '../src/theme/tokens';

// F2 设置页：标题 + 返回 + 语言分组 + 两个语言选项 + 当前选中状态。
// 语言自称固定（简体中文 / English），不随当前语言翻译。
export default function SettingsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { locale, setLocale, t, isReady, saveError, retrySave } = useLanguage();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const wide = width >= 600;

  // 语言初始化完成前不呈现翻译文案，避免错误语言闪屏。
  if (!isReady) {
    return (
      <View style={styles.root}>
        <StatusBar hidden />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <View style={styles.header}>
        <Pressable
          testID="settings-back"
          accessibilityRole="button"
          accessibilityLabel={t('settings.back')}
          onPress={goBack}
          hitSlop={10}
          style={styles.backButton}
        >
          <Text style={styles.backText}>{t('settings.back')}</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {t('settings.title')}
        </Text>
      </View>

      <ScrollView
        testID="settings-scroll"
        style={styles.fill}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, wide && styles.cardWide]}>
          <Text style={styles.groupLabel}>{t('settings.language')}</Text>
          {SUPPORTED_LOCALES.map((option: Locale) => {
            const selected = option === locale;
            return (
              <Pressable
                key={option}
                testID={`language-${option}`}
                accessibilityRole="radio"
                accessibilityLabel={LOCALE_LABELS[option]}
                accessibilityState={{ selected }}
                onPress={() => setLocale(option)}
                style={[styles.option, selected && styles.optionSelected]}
              >
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {LOCALE_LABELS[option]}
                </Text>
                {selected && <Text style={styles.check}>✓</Text>}
              </Pressable>
            );
          })}
        </View>

        {saveError && (
          <Pressable
            testID="language-save-error"
            accessibilityRole="button"
            onPress={retrySave}
            style={[styles.error, wide && styles.cardWide]}
          >
            <Text style={styles.errorText}>{t('settings.saveFailed')}</Text>
            <Text style={styles.errorRetry}>{t('settings.retry')}</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ui.glassBg },
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  backButton: { paddingVertical: spacing.xs, paddingHorizontal: spacing.xs },
  backText: { fontSize: 15, fontWeight: '600', color: ui.accent },
  title: { flexShrink: 1, fontSize: 20, fontWeight: '600', color: ui.textPrimary },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    borderRadius: radius.segmented,
    backgroundColor: ui.activePill,
    borderWidth: 1,
    borderColor: ui.glassBorder,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cardWide: { maxWidth: 560 },
  groupLabel: {
    fontSize: typography.sliderValue.fontSize,
    fontWeight: '600',
    color: ui.textSecondary,
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.segmented,
  },
  optionSelected: { backgroundColor: ui.inactivePill },
  optionLabel: { fontSize: typography.sliderLabel.fontSize, color: ui.textPrimary },
  optionLabelSelected: { color: ui.accent, fontWeight: '600' },
  check: { fontSize: typography.sliderLabel.fontSize, fontWeight: '600', color: ui.accent },
  error: {
    width: '100%',
    maxWidth: 480,
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.segmented,
    backgroundColor: ui.trackInactive,
  },
  errorText: { flexShrink: 1, fontSize: typography.presetLabel.fontSize, color: ui.textPrimary },
  errorRetry: { fontSize: typography.presetLabel.fontSize, fontWeight: '600', color: ui.accent },
});
