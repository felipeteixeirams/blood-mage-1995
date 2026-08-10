import React, { useEffect } from 'react';
import { PlayerStats, LootItem } from '../types/game';
import { Skull, RefreshCw, LogOut } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';
import { useGameStore } from '../store/gameStore';

interface DeathScreenProps {
  stats: PlayerStats;
  onRespawn: () => void;
  onGoHome: () => void;
}

export const DeathScreen: React.FC<DeathScreenProps> = ({ stats, onRespawn, onGoHome }) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    // Sincronizar estado de morte no localStorage para persistência extrema
    try {
      localStorage.setItem('bloodmage_1995_is_dead_persistent', 'true');
      localStorage.setItem('bloodmage_1995_dead_stats', JSON.stringify(stats));
    } catch (e) {
      console.warn('Failed to save persistent death state', e);
    }
  }, [stats]);

  return (
    <div className="fixed inset-0 z-[99] bg-black/90 flex items-center justify-center p-4 select-none">
      {/* Deep vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 100px 50px rgba(0, 0, 0, 0.95), inset 0 0 200px 100px rgba(153, 0, 0, 0.35)'
        }}
      />

      <div className="relative z-10 w-full max-w-lg bg-[#171309] border-4 border-[#b8860b] rounded-xl p-8 shadow-[0_0_80px_rgba(153,0,0,0.6)] flex flex-col items-center space-y-6 text-center">
        {/* Title Header */}
        <div className="space-y-2">
          <div className="p-3 bg-red-950/40 rounded-full border border-red-800 mx-auto w-fit">
            <Skull className="w-10 h-10 text-red-600 animate-pulse" />
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-red-600 via-red-800 to-black font-gothic py-2">
            VOCÊ ESTÁ MORTO
          </h2>
          <p className="font-sans text-xs text-[#e3dac9] italic max-w-sm mx-auto">
            "A terra consome seus restos mortais... e olhos carniceiros já espreitam seus pertences perdidos nas sombras. Apresse-se, Bloodmage."
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 w-full font-sans text-sm border-t border-b border-[#b8860b]/30 py-4">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-[#b8860b]/80 tracking-widest">Tempo Sobrevivido</span>
            <span className="text-lg font-bold text-[#e3dac9]">{formatTime(stats.timeSurvivedSeconds)}</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-[#b8860b]/80 tracking-widest">Inimigos Purificados</span>
            <span className="text-lg font-bold text-[#e3dac9]">{stats.kills}</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-[#b8860b]/80 tracking-widest">Ouro/Cristais Coletados</span>
            <span className="text-lg font-bold text-[#e3dac9]">{useGameStore.getState().bloodCrystals} 💎</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-[#b8860b]/80 tracking-widest">Profundidade Alcançada</span>
            <span className="text-lg font-bold text-[#e3dac9]">Nível {stats.floorDepth || 1}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full pt-2">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              localStorage.removeItem('bloodmage_1995_is_dead_persistent');
              localStorage.removeItem('bloodmage_1995_dead_stats');
              onRespawn();
            }}
            className="w-full py-4 bg-gradient-to-r from-red-950 via-red-800 to-red-950 hover:from-red-900 hover:to-red-700 text-red-100 font-bold uppercase tracking-wider rounded-lg border-2 border-[#b8860b] shadow-[0_0_25px_rgba(153,0,0,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            <span>RENASCER NA VILA SEGURA</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onGoHome();
            }}
            className="w-full py-3 bg-black/80 hover:bg-zinc-900 border border-zinc-800 rounded text-gray-300 font-bold uppercase tracking-wide flex items-center justify-center gap-2 hover:border-zinc-600 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>MENU PRINCIPAL</span>
          </button>
        </div>
      </div>
    </div>
  );
};
