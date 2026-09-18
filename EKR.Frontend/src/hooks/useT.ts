import { useCallback } from 'react';
import type { LocaleKey } from '../utils/i18n';
import { translate } from '../utils/i18n';
import { useAppSelector } from '../store/hooks';
import { selectLang } from '../store/slices/localeSlice';

export function useT() {
  const lang = useAppSelector(selectLang);
  return useCallback(
    (key: LocaleKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang]
  );
}
