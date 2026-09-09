import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { PrestigeModal } from './PrestigeModal';
import { useGameStore } from '../store/gameStore';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock soundEngine
vi.mock('../utils/soundEngine', () => ({
  soundEngine: {
    playButtonClick: vi.fn(),
    playBloodNova: vi.fn(),
    playRunicEmpowerment: vi.fn(),
    playMenuSelect: vi.fn(),
  },
}));

describe('PrestigeModal component', () => {
  let container: HTMLDivElement;
  let root: Root | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    // Reset prestige state in gameStore
    useGameStore.setState({
      prestige: {
        level: 0,
        unspentSealPoints: 2,
        seals: {
          carnage: 0,
          dark_vitality: 0,
          runic_flow: 0,
          deep_vampirism: 0,
          macabre_fortune: 0,
        },
        selectedDifficulty: 'normal',
        unlockedDifficulties: ['normal'],
        totalSacrifices: 0,
      },
      playerStats: {
        ...useGameStore.getState().playerStats,
        level: 10,
        floorDepth: 3,
        kills: 35,
      },
    });
  });

  it('renders prestige modal header, modifiers, and seal list', async () => {
    const onClose = vi.fn();

    await act(async () => {
      root?.render(<PrestigeModal onClose={onClose} />);
    });

    expect(container.textContent).toContain('SELO DE SANGUE & PRESTÍGIO');
    expect(container.textContent).toContain('NÍVEL DE PRESTÍGIO 0 / 10');
    expect(container.textContent).toContain('PONTOS DE SELO DISPONÍVEIS');
    expect(container.textContent).toContain('Selo de Carnificina');
    expect(container.textContent).toContain('Selo de Vitalidade Sombria');
    expect(container.textContent).toContain('EXECUTAR RITUAL DE SACRIFÍCIO');
  });

  it('allows allocating a blood seal point when points are available', async () => {
    const onClose = vi.fn();

    await act(async () => {
      root?.render(<PrestigeModal onClose={onClose} />);
    });

    const allocateButtons = Array.from(container.querySelectorAll('button')).filter(
      (b) => b.textContent?.includes('+1 PONTO')
    );

    expect(allocateButtons.length).toBeGreaterThan(0);

    await act(async () => {
      allocateButtons[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const updatedPrestige = useGameStore.getState().prestige;
    expect(updatedPrestige.unspentSealPoints).toBe(1);
    expect(updatedPrestige.seals.carnage).toBe(1);
  });

  it('shows confirmation box and executes sacrifice when confirmed', async () => {
    const onClose = vi.fn();

    await act(async () => {
      root?.render(<PrestigeModal onClose={onClose} />);
    });

    const ritualBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('EXECUTAR RITUAL DE SACRIFÍCIO')
    );

    expect(ritualBtn).toBeDefined();

    await act(async () => {
      ritualBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('ATENÇÃO: Esta ação irá resetar seu nível atual');

    const confirmBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('SIM, CONFIRMAR SACRIFÍCIO')
    );

    expect(confirmBtn).toBeDefined();

    await act(async () => {
      confirmBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const updatedPrestige = useGameStore.getState().prestige;
    expect(updatedPrestige.level).toBe(1);
    expect(updatedPrestige.totalSacrifices).toBe(1);
    expect(onClose).toHaveBeenCalled();
  });
});
