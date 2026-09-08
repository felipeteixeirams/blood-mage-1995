import { describe, it, expect, beforeEach } from 'vitest';
import { t, ptBR, enUS } from './index';
import { useGameStore } from '../store/gameStore';

describe('i18n translation system', () => {
  beforeEach(() => {
    // Reset language to default pt-BR before each test
    useGameStore.setState({
      settings: {
        ...useGameStore.getState().settings,
        language: 'pt-BR',
      },
    });
  });

  it('translates keys correctly in default Portuguese (pt-BR)', () => {
    expect(t('common.back')).toBe(ptBR.common.back);
    expect(t('common.confirm')).toBe(ptBR.common.confirm);
    expect(t('mainMenu.startGame')).toBe(ptBR.mainMenu.startGame);
    expect(t('hud.levelShort')).toBe(ptBR.hud.levelShort);
  });

  it('translates keys correctly in English (en-US)', () => {
    useGameStore.setState({
      settings: {
        ...useGameStore.getState().settings,
        language: 'en-US',
      },
    });

    expect(t('common.back')).toBe(enUS.common.back);
    expect(t('common.confirm')).toBe(enUS.common.confirm);
    expect(t('mainMenu.startGame')).toBe(enUS.mainMenu.startGame);
    expect(t('hud.levelShort')).toBe(enUS.hud.levelShort);
  });

  it('interpolates parameters in string template', () => {
    const result = t('achievements.rewardCrystals', { amount: 50 }, 'pt-BR');
    expect(result).toBe('+50 Cristais');

    const resultEn = t('achievements.rewardCrystals', { amount: 100 }, 'en-US');
    expect(resultEn).toBe('+100 Crystals');
  });

  it('falls back to key path or pt-BR if key is missing in dictionary', () => {
    expect(t('nonexistent.key.path', undefined, 'en-US')).toBe('nonexistent.key.path');
  });

  it('allows explicit language override parameter in t()', () => {
    expect(t('common.save', undefined, 'pt-BR')).toBe('Salvar');
    expect(t('common.save', undefined, 'en-US')).toBe('Save');
  });
});
