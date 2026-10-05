import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { useTranslation } from '../../i18n';
import { Flame, Moon, Skull, Snowflake, Sparkles } from 'lucide-react';

export const WorldEventBadge: React.FC = () => {
  const activeWorldEvent = useGameStore((s) => s.activeWorldEvent);
  const { t } = useTranslation();

  if (!activeWorldEvent) return null;

  const renderIcon = () => {
    switch (activeWorldEvent.visuals.badgeIcon) {
      case 'Moon':
        return <Moon className="w-4 h-4 text-red-500 animate-pulse" />;
      case 'Skull':
        return <Skull className="w-4 h-4 text-purple-400 animate-pulse" />;
      case 'Snowflake':
        return <Snowflake className="w-4 h-4 text-blue-400 animate-pulse" />;
      default:
        return <Flame className="w-4 h-4 text-amber-500 animate-pulse" />;
    }
  };

  const nameKey = activeWorldEvent.nameKey as any;
  const descKey = activeWorldEvent.descriptionKey as any;

  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 pointer-events-auto z-30 flex items-center gap-2 bg-[#0c0a09]/90 border border-[#b8860b] px-3 py-1 shadow-[0_0_15px_rgba(184,134,11,0.4)] group transition-all">
      <div className="flex items-center gap-1.5">
        {renderIcon()}
        <span className="font-pixel text-[11px] font-bold tracking-wider text-[#e8c76a] uppercase">
          {t(nameKey, undefined) || activeWorldEvent.id}
        </span>
        <Sparkles className="w-3 h-3 text-[#b8860b]" />
      </div>

      {/* Tooltip on Hover / Focus */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 hidden group-hover:block w-64 bg-[#0a0806] border border-[#b8860b] p-2 text-center shadow-xl pointer-events-none z-40">
        <p className="font-retro text-[10px] text-gray-300 leading-relaxed">
          {t(descKey, undefined)}
        </p>
      </div>
    </div>
  );
};
