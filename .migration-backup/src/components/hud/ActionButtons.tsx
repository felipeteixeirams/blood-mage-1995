import React from 'react';
import { Pause, Volume2, VolumeX, Backpack, Sparkles } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { soundEngine } from '../../utils/soundEngine';

interface ActionButtonsProps {
  onPauseToggle: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onPauseToggle,
  isMuted,
  onToggleMute
}) => {
  const { setInventoryOpen, setTalentsOpen } = useGameStore();

  return (
    <div className="flex gap-2 pointer-events-auto">
      <button 
        className="bg-black/80 border-2 border-amber-800/80 p-2.5 rounded hover:bg-amber-950/80 transition-colors cursor-pointer touch-manipulation text-amber-400"
        onClick={() => { soundEngine.playButtonClick(); setInventoryOpen(true); }}
        title="Inventário [I]"
      >
        <Backpack size={20} />
      </button>

      <button 
        className="bg-black/80 border-2 border-red-800/80 p-2.5 rounded hover:bg-red-950/80 transition-colors cursor-pointer touch-manipulation text-red-400"
        onClick={() => { soundEngine.playButtonClick(); setTalentsOpen(true); }}
        title="Árvore de Talentos [T]"
      >
        <Sparkles size={20} />
      </button>

      <button 
        className="bg-black/80 border-2 border-gray-700 p-2.5 rounded hover:bg-gray-800 transition-colors cursor-pointer touch-manipulation"
        onClick={onToggleMute}
        title={isMuted ? "Ativar Áudio" : "Mutar"}
      >
        {isMuted ? <VolumeX size={20} className="text-gray-400" /> : <Volume2 size={20} className="text-white" />}
      </button>
      
      <button 
        className="bg-black/80 border-2 border-gray-700 p-2.5 rounded hover:bg-gray-800 transition-colors cursor-pointer touch-manipulation"
        onClick={onPauseToggle}
        title="Pausar"
      >
        <Pause size={20} className="text-white" />
      </button>
    </div>
  );
};
