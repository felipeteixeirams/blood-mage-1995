import React from 'react';
import { PlayerStats } from '../../types/game';
import { useGameStore } from '../../store/gameStore';

interface PlayerStatusProps {
  stats: PlayerStats;
}

// Fase 3 de docs/archive/specs/propostas/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md:
// acabamento entalhado das barras de HP/MP (sem virar orbe — mantém posição e forma).
// Componentes de apoio ficam fora do corpo de PlayerStatus para não perder identidade
// entre renders (evita remount/perda de estado a cada atualização de HP/MP).

// Textura sutil de metal batido para o fundo das molduras (CSS puro, sem asset novo)
const FORGED_METAL_TEXTURE: React.CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(135deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 3px)',
};

// Rebite decorativo de canto (mesmo espírito das "cantoneiras douradas" dos modais)
const BarRivet: React.FC<{ className: string }> = ({ className }) => (
  <div
    className={`absolute w-[3px] h-[3px] rounded-full bg-gradient-to-br from-[#e8c76a] to-[#7a5312] shadow-[0_0_1px_rgba(0,0,0,0.9)] pointer-events-none ${className}`}
  />
);

export const PlayerStatus: React.FC<PlayerStatusProps> = ({ stats }) => {
  const { settings } = useGameStore();
  const hpPercent = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));
  const manaPercent = Math.max(0, Math.min(100, (stats.mana / stats.maxMana) * 100));
  const xpPercent = Math.max(0, Math.min(100, (stats.currentXp / stats.nextLevelXp) * 100));
  const isCriticalHp = hpPercent > 0 && hpPercent <= 25;

  return (
    <div className="pointer-events-auto bg-[#0f0b09]/95 border-2 border-[#b8860b]/40 p-2 shadow-[4px_4px_12px_rgba(0,0,0,0.85)] backdrop-blur flex items-center gap-2.5 max-w-[280px] sm:max-w-xs">
      {/* 1995 Gothic Character Portrait with Frame (Dungeon Siege Style) */}
      <div className="relative w-12 h-12 shrink-0 bg-black border border-[#b8860b]/60 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.9)] overflow-hidden flex items-center justify-center">
        {/* Animated Portrait breathing glow if enabled */}
        <div
          className={`w-full h-full flex items-center justify-center relative bg-gradient-to-b from-[#171309] to-[#0c0a09] ${
            settings.animatedPortrait ? 'animate-pulse' : ''
          }`}
          style={{ animationDuration: '3s' }}
        >
          <img 
            src="assets/sprites/player/animated/bloodmage_showcase.gif" 
            alt="Bloodmage Portrait"
            className="w-[180%] max-w-none object-cover"
            style={{ imageRendering: 'pixelated' }}
          />

          {/* Gold Trim Corner accents */}
          <div className="absolute top-0 left-0 w-1 h-1 bg-[#b8860b] border-r border-b border-black/40" />
          <div className="absolute top-0 right-0 w-1 h-1 bg-[#b8860b] border-l border-b border-black/40" />
          <div className="absolute bottom-0 left-0 w-1 h-1 bg-[#b8860b] border-r border-t border-black/40" />
          <div className="absolute bottom-0 right-0 w-1 h-1 bg-[#b8860b] border-l border-t border-black/40" />
        </div>
      </div>

      {/* HP/MP/XP solid bars (Dungeon Siege 1 Style) */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">

        {/* Health Solid Bar (HP) */}
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between items-center px-0.5">
            <span className="text-[8px] font-pixel text-[#e8c76a] font-bold uppercase tracking-wider">HP</span>
            <span className="text-[8px] font-pixel text-[#fca5a5] font-bold">{Math.ceil(stats.hp)} / {stats.maxHp}</span>
          </div>
          {/* Ironcast frame container — forjado: textura de metal batido + rebites de canto */}
          <div
            className={`w-full h-3 bg-black border border-[#1f1a17] p-[1.5px] rounded-none relative transition-shadow duration-300 ${
              isCriticalHp
                ? 'shadow-[inset_1px_1px_3px_rgba(0,0,0,0.9),0_0_9px_rgba(239,68,68,0.75)] animate-pulse'
                : 'shadow-[inset_1px_1px_3px_rgba(0,0,0,0.9)]'
            }`}
            style={FORGED_METAL_TEXTURE}
          >
            {/* Double gilded inner line to give a chiseled look */}
            <div className="absolute inset-0 border border-[#b8860b]/20 pointer-events-none" />
            {/* Highlight superior fino, reforça a leitura de "entalhado" no metal */}
            <div className="absolute inset-x-0 top-0 h-px bg-white/10 pointer-events-none" />
            <BarRivet className="-top-[1.5px] -left-[1.5px]" />
            <BarRivet className="-top-[1.5px] -right-[1.5px]" />
            <BarRivet className="-bottom-[1.5px] -left-[1.5px]" />
            <BarRivet className="-bottom-[1.5px] -right-[1.5px]" />
            {/* Liquid crimson blood fill */}
            <div
              className="h-full bg-gradient-to-r from-[#990000] via-[#dc2626] to-[#ef4444] shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all duration-150"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* Mana Solid Bar (MP) */}
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between items-center px-0.5">
            <span className="text-[8px] font-pixel text-[#e8c76a] font-bold uppercase tracking-wider">MP</span>
            <span className="text-[8px] font-pixel text-[#93c5fd] font-bold">{Math.ceil(stats.mana)} / {stats.maxMana}</span>
          </div>
          {/* Ironcast frame container — mesmo tratamento forjado da barra de HP */}
          <div
            className="w-full h-2.5 bg-black border border-[#1f1a17] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.9)] p-[1.5px] rounded-none relative"
            style={FORGED_METAL_TEXTURE}
          >
            <div className="absolute inset-0 border border-[#b8860b]/20 pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-px bg-white/10 pointer-events-none" />
            <BarRivet className="-top-[1.5px] -left-[1.5px]" />
            <BarRivet className="-top-[1.5px] -right-[1.5px]" />
            <BarRivet className="-bottom-[1.5px] -left-[1.5px]" />
            <BarRivet className="-bottom-[1.5px] -right-[1.5px]" />
            {/* Liquid cobalt blue fill */}
            <div
              className="h-full bg-gradient-to-r from-[#1e3a8a] via-[#2563eb] to-[#3b82f6] shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all duration-150"
              style={{ width: `${manaPercent}%` }}
            />
          </div>
        </div>

        {/* Level and XP integrated as a fine bronze channel below HP/MP */}
        <div className="flex items-center gap-1.5 pt-0.5">
          {/* Compact Level badge */}
          <span className="font-pixel text-[8px] text-[#e8c76a] bg-gradient-to-b from-[#1c140e] to-[#0c0a09] px-1 py-0.2 border border-[#b8860b]/60 shadow-[1px_1px_2px_#000000] font-bold shrink-0">
            NV {stats.level}
          </span>
          {/* XP Bar (Dungeon Siege golden channel style) */}
          <div className="flex-1 h-1.5 bg-black border border-[#1f1a17] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.9)] p-[0.5px] rounded-none relative">
            <div
              className="h-full bg-gradient-to-r from-[#7a5312] to-[#e8c76a] transition-all duration-300"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* Status Conditions & Curatives Bar */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-[#3a2825]/40">
          {/* Bleeding Indicator */}
          <button
            onClick={() => useGameStore.getState().setActiveCurativeTrigger('bandages')}
            className={`flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-pixel border cursor-pointer transition ${
              stats.statusConditions?.bleeding
                ? 'bg-red-950/80 border-red-500 text-red-200 animate-pulse font-bold shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                : 'bg-black/40 border-[#1f1a17] text-gray-400 hover:border-[#b8860b]/40'
            }`}
            title="Sangramento: Pressione Z para usar Atadura"
          >
            <span>🩸</span>
            <span className="hidden sm:inline">[Z]</span>
            <span className="font-bold text-[#e8c76a]">{stats.curatives?.bandages || 0}</span>
          </button>

          {/* Poison Indicator */}
          <button
            onClick={() => useGameStore.getState().setActiveCurativeTrigger('antidotes')}
            className={`flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-pixel border cursor-pointer transition ${
              stats.statusConditions?.poison
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 animate-pulse font-bold shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                : 'bg-black/40 border-[#1f1a17] text-gray-400 hover:border-[#b8860b]/40'
            }`}
            title="Veneno: Pressione X para usar Antídoto"
          >
            <span>🍇</span>
            <span className="hidden sm:inline">[X]</span>
            <span className="font-bold text-[#e8c76a]">{stats.curatives?.antidotes || 0}</span>
          </button>

          {/* Infection Indicator */}
          <button
            onClick={() => useGameStore.getState().setActiveCurativeTrigger('antibiotics')}
            className={`flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-pixel border cursor-pointer transition ${
              stats.statusConditions?.infection
                ? 'bg-purple-950/80 border-purple-500 text-purple-200 animate-pulse font-bold shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                : 'bg-black/40 border-[#1f1a17] text-gray-400 hover:border-[#b8860b]/40'
            }`}
            title="Infecção: Pressione V para usar Antibiótico"
          >
            <span>🧪</span>
            <span className="hidden sm:inline">[V]</span>
            <span className="font-bold text-[#e8c76a]">{stats.curatives?.antibiotics || 0}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
