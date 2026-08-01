import React from 'react';
import { Pause, Volume2, VolumeX } from 'lucide-react';

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
  return (
    <div className="flex gap-2 pointer-events-auto">
      <button 
        className="bg-black/80 border-2 border-gray-700 p-2.5 rounded hover:bg-gray-800 transition-colors cursor-pointer touch-manipulation"
        onClick={onToggleMute}
        title={isMuted ? "Unmute" : "Mute"}
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
