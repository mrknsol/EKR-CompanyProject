import type { LocaleDict, Lang } from '../data/localeDict';
import { localeDict } from '../data/localeDict';

export type LocaleKey = keyof LocaleDict;

export function translate(
  lang: Lang,
  key: LocaleKey,
  vars?: Record<string, string | number>
): string {
  let text = localeDict[key]?.[lang] ?? localeDict[key]?.en ?? String(key);
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}
