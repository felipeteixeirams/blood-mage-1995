import React from 'react';
import { PlayerStats } from '../../types/game';
import { useGameStore } from '../../store/gameStore';

interface PlayerStatusProps {
  stats: PlayerStats;
}

// Textura sutil de metal batido para o fundo das molduras
const FORGED_METAL_TEXTURE: React.CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(135deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 3px)',
};

// Rebite decorativo de canto
const BarRivet: React.FC<{ className: string }> = ({ className }) => (
  <div
    className={`absolute w-[3px] h-[3px] rounded-full bg-gradient-to-br from-[#e8c76a] to-[#7a5312] shadow-[0_0_1px_rgba(0,0,0,0.9)] pointer-events-none ${className}`}
  />
);

// Slots de curativos contextuais (inspirados em Hades / Dead Cells: reativos apenas sob aflição)
const CURATIVE_SLOTS: {
  type: 'bandages' | 'antidotes' | 'antibiotics';
  condition: 'bleeding' | 'poison' | 'infection';
  key: string;
  icon: string;
  label: string;
  title: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
  activeGlow: string;
}[] = [
  {
    type: 'bandages',
    condition: 'bleeding',
    key: 'Z',
    icon: '🩸',
    label: 'ATADURA',
    title: 'Sangramento: Pressione Z ou clique para usar Atadura',
    activeBg: 'bg-red-950/90',
    activeBorder: 'border-red-600',
    activeText: 'text-red-200',
    activeGlow: 'shadow-[0_0_8px_rgba(239,68,68,0.6)]',
  },
  {
    type: 'antidotes',
    condition: 'poison',
    key: 'X',
    icon: '🍇',
    label: 'ANTÍDOTO',
    title: 'Veneno: Pressione X ou clique para usar Antídoto',
    activeBg: 'bg-emerald-950/90',
    activeBorder: 'border-emerald-600',
    activeText: 'text-emerald-200',
    activeGlow: 'shadow-[0_0_8px_rgba(34,197,94,0.6)]',
  },
  {
    type: 'antibiotics',
    condition: 'infection',
    key: 'V',
    icon: '🧪',
    label: 'ANTIBIÓTICO',
    title: 'Infecção: Pressione V ou clique para usar Antibiótico',
    activeBg: 'bg-purple-950/90',
    activeBorder: 'border-purple-600',
    activeText: 'text-purple-200',
    activeGlow: 'shadow-[0_0_8px_rgba(168,85,247,0.6)]',
  },
];

export const PlayerStatus: React.FC<PlayerStatusProps> = ({ stats }) => {
  const { settings } = useGameStore();
  const hpPercent = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));
  const manaPercent = Math.max(0, Math.min(100, (stats.mana / stats.maxMana) * 100));
  const xpPercent = Math.max(0, Math.min(100, (stats.currentXp / stats.nextLevelXp) * 100));
  const isCriticalHp = hpPercent > 0 && hpPercent <= 25;

  const activeCurativeSlots = CURATIVE_SLOTS.filter(
    (slot) => stats.statusConditions?.[slot.condition]
  );
  const hasAffliction = activeCurativeSlots.length > 0;

  const handleUseCurative = (type: 'bandages' | 'antidotes' | 'antibiotics') => {
    const store = useGameStore.getState();
    store.setActiveCurativeTrigger(type);
    if (store.useCurative) {
      store.useCurative(type);
    }
  };

  return (
    <div className="pointer-events-auto flex flex-col gap-1 select-none">
      {/* ── Gothic Compact Vitals Strip: Minimalist and High-Contrast ── */}
      <div className="flex items-center gap-1.5 bg-[#0c0a09]/95 border border-[#b8860b]/40 px-1.5 py-1 shadow-[2px_2px_8px_rgba(0,0,0,0.85)] backdrop-blur-sm w-fit">
        {/* Character Portrait with Embedded Level Crest */}
        <div className="relative w-8 h-8 shrink-0 bg-black border border-[#b8860b]/60 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.9)] overflow-hidden flex items-center justify-center">
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

          {/* Embedded Level Badge at Bottom-Right */}
          <div
            className="absolute bottom-0 right-0 bg-[#0c0a09] border-t border-l border-[#b8860b] px-0.5 text-[7px] font-pixel text-[#e8c76a] font-bold leading-tight z-10 shadow-[0_0_2px_#000]"
            title={`Nível ${stats.level}`}
          >
            {stats.level}
          </div>
        </div>

        {/* HP / MP Solid Bars & XP Hairline */}
        <div className="flex flex-col flex-1 w-[140px] sm:w-[160px]">
          {/* Health Solid Bar (HP) with Embedded Label & Numbers */}
          <div
            className={`w-full h-3 bg-black border border-[#2a221d] relative overflow-hidden transition-shadow duration-300 ${
              isCriticalHp
                ? 'shadow-[inset_1px_1px_2px_rgba(0,0,0,0.9),0_0_8px_rgba(239,68,68,0.85)] animate-pulse'
                : 'shadow-[inset_1px_1px_2px_rgba(0,0,0,0.9)]'
            }`}
            style={FORGED_METAL_TEXTURE}
          >
            {/* Liquid crimson blood fill */}
            <div
              className="h-full bg-gradient-to-r from-[#880000] via-[#dc2626] to-[#ef4444] shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all duration-150"
              style={{ width: `${hpPercent}%` }}
            />
            {/* Inner chiseled highlight */}
            <div className="absolute inset-0 border border-[#b8860b]/20 pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-px bg-white/15 pointer-events-none" />
            <BarRivet className="-top-[1px] -left-[1px]" />
            <BarRivet className="-top-[1px] -right-[1px]" />
            <BarRivet className="-bottom-[1px] -left-[1px]" />
            <BarRivet className="-bottom-[1px] -right-[1px]" />

            {/* In-bar text: HP label left, values right */}
            <div className="absolute inset-0 flex items-center justify-between px-1 pointer-events-none [text-shadow:0_1px_2px_#000,0_0_3px_#000]">
              <span className="text-[7px] font-pixel text-[#e8c76a] font-bold tracking-wider">HP</span>
              <span className="text-[7px] font-pixel text-[#fee2e2] font-bold">
                {Math.ceil(stats.hp)}<span className="text-[#fca5a5]/70 text-[6px]">/{stats.maxHp}</span>
              </span>
            </div>
          </div>

          {/* Mana Solid Bar (MP) with Embedded Label & Numbers */}
          <div
            className="w-full h-2 bg-black border-x border-b border-[#2a221d] relative overflow-hidden shadow-[inset_1px_1px_2px_rgba(0,0,0,0.9)]"
            style={FORGED_METAL_TEXTURE}
          >
            {/* Liquid cobalt blue fill */}
            <div
              className="h-full bg-gradient-to-r from-[#1e3a8a] via-[#2563eb] to-[#3b82f6] shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all duration-150"
              style={{ width: `${manaPercent}%` }}
            />
            <div className="absolute inset-0 border border-[#b8860b]/15 pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-between px-1 pointer-events-none [text-shadow:0_1px_2px_#000,0_0_3px_#000]">
              <span className="text-[6.5px] font-pixel text-[#93c5fd] font-bold tracking-wider">MP</span>
              <span className="text-[6.5px] font-pixel text-[#dbeafe] font-bold">
                {Math.ceil(stats.mana)}<span className="text-[#93c5fd]/70 text-[6px]">/{stats.maxMana}</span>
              </span>
            </div>
          </div>

          {/* Micro XP Channel (2px flush hairline bar under MP) */}
          <div
            className="w-full h-[2px] bg-[#0c0a09] border-x border-b border-[#2a221d] relative overflow-hidden"
            title={`XP: ${Math.floor(stats.currentXp)} / ${stats.nextLevelXp} (${Math.floor(xpPercent)}%)`}
          >
            <div
              className="h-full bg-gradient-to-r from-[#7a5312] via-[#b8860b] to-[#e8c76a] transition-all duration-300"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Contextual Afflictions & Curatives Tray (Hades / Modern ARPG Style) ── */}
      {(hasAffliction || isCriticalHp) && (
        <div className="flex flex-wrap gap-1 items-center max-w-[240px]">
          {activeCurativeSlots.map((slot) => {
            const count = stats.curatives?.[slot.type] || 0;
            const canUse = count > 0;
            return (
              <button
                key={slot.type}
                onClick={() => handleUseCurative(slot.type)}
                disabled={!canUse}
                className={`flex items-center gap-1 px-1.5 py-0.5 border text-[7px] font-pixel cursor-pointer transition shadow-[1px_1px_3px_#000] ${
                  canUse
                    ? `${slot.activeBg} ${slot.activeBorder} ${slot.activeText} animate-pulse ${slot.activeGlow} hover:brightness-125`
                    : 'bg-black/80 border-gray-700 text-gray-400 opacity-60'
                }`}
                title={slot.title}
              >
                <span>{slot.icon}</span>
                <span className="font-bold">{slot.label}</span>
                <span className="text-[#e8c76a]">[{slot.key}]</span>
                <span className="font-bold">({count})</span>
              </button>
            );
          })}
          {isCriticalHp && (
            <span
              className="text-[6.5px] font-pixel px-1.5 py-0.5 bg-amber-950/90 border border-amber-500 text-amber-300 flex items-center gap-0.5 animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.6)]"
              title="Fúria do Sangue ativa: Dano amplificado em vida crítica!"
            >
              ⚡ FÚRIA CRÍTICA
            </span>
          )}
        </div>
      )}
    </div>
  );
};
