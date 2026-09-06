import React from 'react';
import { Pause, Backpack, Sparkles, Settings, Trophy } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { soundEngine } from '../../utils/soundEngine';

export interface ActionButtonsProps {
  onPauseToggle: () => void;
  onQuickSettingsToggle: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onPauseToggle,
  onQuickSettingsToggle,
}) => {
  const { setInventoryOpen, setTalentsOpen, setRecordsOpen, setGameState } = useGameStore();

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.nativeEvent?.stopImmediatePropagation?.();
  };

  return (
    <div
      className="w-[100px] sm:w-[120px] flex gap-0.5 pointer-events-auto select-none"
      onPointerDown={handlePointerDown}
    >
      {/* Trophy / Records */}
      <button
        className="flex-1 h-6 sm:h-7 bg-[#0c0a09]/95 border border-[#b8860b]/40 hover:border-[#b8860b] p-1 text-[#e8c76a] hover:bg-[#1c140e] shadow-[2px_2px_4px_rgba(0,0,0,0.8)] transition active:scale-95 cursor-pointer touch-manipulation flex items-center justify-center"
        onClick={() => {
          soundEngine.playButtonClick();
          setRecordsOpen(true);
          setGameState('paused');
        }}
        title="Recordes"
      >
        <Trophy size={12} className="text-[#e8c76a]" />
      </button>

      {/* Inventory */}
      <button
        className="flex-1 h-6 sm:h-7 bg-[#0c0a09]/95 border border-[#b8860b]/40 hover:border-[#b8860b] p-1 text-[#e8c76a] hover:bg-[#1c140e] shadow-[2px_2px_4px_rgba(0,0,0,0.8)] transition active:scale-95 cursor-pointer touch-manipulation flex items-center justify-center"
        onClick={() => {
          soundEngine.playButtonClick();
          setInventoryOpen(true);
        }}
        title="Inventário [I]"
      >
        <Backpack size={12} className="text-[#e8c76a]" />
      </button>

      {/* Talents */}
      <button
        className="flex-1 h-6 sm:h-7 bg-[#0c0a09]/95 border border-[#b8860b]/40 hover:border-[#b8860b] p-1 text-[#e8c76a] hover:bg-[#1c140e] shadow-[2px_2px_4px_rgba(0,0,0,0.8)] transition active:scale-95 cursor-pointer touch-manipulation flex items-center justify-center"
        onClick={() => {
          soundEngine.playButtonClick();
          setTalentsOpen(true);
        }}
        title="Talentos [T]"
      >
        <Sparkles size={12} className="text-[#e8c76a]" />
      </button>

      {/* Quick Settings */}
      <button
        className="flex-1 h-6 sm:h-7 bg-[#0c0a09]/95 border border-[#b8860b]/40 hover:border-[#b8860b] p-1 text-[#e8c76a] hover:bg-[#1c140e] shadow-[2px_2px_4px_rgba(0,0,0,0.8)] transition active:scale-95 cursor-pointer touch-manipulation flex items-center justify-center"
        onClick={() => {
          soundEngine.playButtonClick();
          onQuickSettingsToggle();
        }}
        title="Ajustes Rápidos"
      >
        <Settings size={12} className="text-[#e8c76a]" />
      </button>

      {/* Pause */}
      <button
        className="flex-1 h-6 sm:h-7 bg-[#0c0a09]/95 border border-[#b8860b]/40 hover:border-[#b8860b] p-1 text-white hover:bg-[#1c140e] shadow-[2px_2px_4px_rgba(0,0,0,0.8)] transition active:scale-95 cursor-pointer touch-manipulation flex items-center justify-center"
        onClick={() => {
          soundEngine.playButtonClick();
          onPauseToggle();
        }}
        title="Pausar"
      >
        <Pause size={12} className="text-white" />
      </button>
    </div>
  );
};
