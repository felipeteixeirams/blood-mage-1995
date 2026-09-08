import { ptBR, TranslationDictionary } from './ptBR';
import { enUS } from './enUS';
import { Language } from '../types/game';
import { useGameStore } from '../store/gameStore';

const translations: Record<Language, TranslationDictionary> = {
  'pt-BR': ptBR,
  'en-US': enUS,
};

/**
 * Resolves a dot-separated key path (e.g., 'common.back' or 'hud.levelShort')
 * from the dictionary for the specified or current language.
 */
export function t(
  keyPath: string,
  params?: Record<string, string | number>,
  lang?: Language
): string {
  const currentLang = lang || useGameStore.getState().settings.language || 'pt-BR';
  const dict = translations[currentLang] || translations['pt-BR'];

  const keys = keyPath.split('.');
  let current: any = dict;

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      // Fallback to pt-BR if missing in target language
      let fallback: any = translations['pt-BR'];
      for (const fk of keys) {
        if (fallback && typeof fallback === 'object' && fk in fallback) {
          fallback = fallback[fk];
        } else {
          fallback = keyPath;
          break;
        }
      }
      current = fallback;
      break;
    }
  }

  if (typeof current !== 'string') {
    return keyPath;
  }

  let text = current;
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
    });
  }

  return text;
}

/**
 * React Hook to subscribe to language changes in gameStore
 * and provide the current `t` translation helper function.
 */
export function useTranslation() {
  const language = useGameStore((state) => state.settings.language || 'pt-BR');

  const translate = (keyPath: string, params?: Record<string, string | number>) => {
    return t(keyPath, params, language);
  };

  return {
    t: translate,
    language,
  };
}

export { ptBR, enUS };
