import { useMemo } from 'react';
import useI18nStore from '../stores/useI18nStore';
import { getTranslations, Translations } from '../i18n';

/**
 * 国际化 Hook
 *
 * @example
 * ```tsx
 * const t = useI18n();
 * <div>{t.home.title}</div>
 * ```
 */
export const useI18n = (): Translations => {
  const locale = useI18nStore((state) => state.locale);

  return useMemo(() => getTranslations(locale), [locale]);
};

export default useI18n;
