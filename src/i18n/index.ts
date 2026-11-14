import { SupportedLanguage } from '@/types';
import { en, TranslationKey } from './translations/en';
import { te } from './translations/te';
import { hi } from './translations/hi';
import { ta } from './translations/ta';
import { kn } from './translations/kn';
import { pa } from './translations/pa';

export const translations: Record<SupportedLanguage, TranslationKey> = {
  en,
  te,
  hi,
  ta,
  kn,
  pa,
};

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type I18nKey = NestedKeyOf<TranslationKey>;

export function getTranslation(
  lang: SupportedLanguage,
  key: string,
  params?: Record<string, string | number>
): string {
  const keys = key.split('.');
  const activeDict = translations[lang] || translations.en;

  let current: unknown = activeDict;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = (current as Record<string, unknown>)[k];
    } else {
      current = undefined;
      break;
    }
  }

  // Fallback to English if not found
  if (typeof current !== 'string') {
    let fallback: unknown = translations.en;
    for (const k of keys) {
      if (fallback && typeof fallback === 'object' && k in fallback) {
        fallback = (fallback as Record<string, unknown>)[k];
      } else {
        fallback = undefined;
        break;
      }
    }
    if (typeof fallback === 'string') {
      current = fallback;
    } else {
      return key; // return key itself if not found
    }
  }

  let text = current as string;
  if (params) {
    for (const [paramKey, paramVal] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
    }
  }

  return text;
}
