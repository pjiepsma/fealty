import { useTranslation as useI18nTranslation } from 'react-i18next';
import type { TranslationKey } from '@/locales/en';

/**
 * Typed translation hook
 * Provides type safety for translation keys
 * 
 * @example
 * const { t } = useTypedTranslation();
 * t('common.loading') // ✅ Type-safe
 * t('common.invalid') // ❌ Type error
 */
export function useTypedTranslation() {
  const { t: i18nT, ...rest } = useI18nTranslation();

  const t = (key: TranslationKey, options?: any): string => {
    return i18nT(key, options) as string;
  };

  return {
    t,
    ...rest,
  };
}

