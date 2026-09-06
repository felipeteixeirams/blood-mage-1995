import React, { useMemo, useState } from 'react';
import { ScrollText, ChevronDown, ChevronUp } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { soundEngine } from '../../utils/soundEngine';
import campaignQuestsData from '../../data/campaignQuests.json';
import { QuestDefinition } from '../../types/campaign';

const questDefs = campaignQuestsData as Record<string, QuestDefinition>;

/**
 * Frente 2 de docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md:
 * Rastreador sutil de objetivos no canto superior direito, no mesmo estilo forjado
 * do Minimap.tsx. Mostra apenas quests com status 'active' em `campaignState.quests`.
 * Agora colapsável para preservar campo de visão em combates e mobile.
 */
export const QuestTracker: React.FC = () => {
  const quests = useGameStore((s) => s.campaignState.quests);
  const [isExpanded, setIsExpanded] = useState(false);

  const activeQuests = useMemo(
    () =>
      Object.values(quests)
        .filter((q) => q.status === 'active')
        .map((q) => ({ log: q, def: questDefs[q.questId] }))
        .filter((q) => !!q.def),
    [quests]
  );

  if (activeQuests.length === 0) return null;

  const mainQuestTitle = activeQuests[0]?.def.title || 'MISSÃO ATIVA';

  if (!isExpanded) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          soundEngine.playButtonClick();
          setIsExpanded(true);
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          e.nativeEvent?.stopImmediatePropagation?.();
        }}
        title="Expandir Objetivos da Missão"
        className="w-[100px] sm:w-[120px] bg-[#0c0a09]/95 border border-[#b8860b]/50 hover:border-[#b8860b] px-1.5 py-1 text-[#e8c76a] hover:text-white shadow-[2px_2px_4px_rgba(0,0,0,0.8)] transition active:scale-95 cursor-pointer touch-manipulation flex items-center justify-between pointer-events-auto select-none font-pixel text-[8px]"
      >
        <div className="flex items-center gap-1 truncate">
          <ScrollText size={9} className="text-[#e8c76a] shrink-0" />
          <span className="truncate uppercase font-bold text-[7px] tracking-wider">{mainQuestTitle}</span>
        </div>
        <ChevronDown size={10} className="text-[#b8860b] shrink-0" />
      </button>
    );
  }

  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
        e.nativeEvent?.stopImmediatePropagation?.();
      }}
      className="bg-[#0f0b09]/95 border-2 border-[#b8860b]/50 p-2 shadow-[4px_4px_12px_rgba(0,0,0,0.85)] pointer-events-auto flex flex-col select-none w-[180px] sm:w-[220px] font-pixel text-left relative"
    >
      {/* Cantoneiras decorativas */}
      <div className="absolute top-0.5 left-0.5 w-1 h-1 border-t border-l border-[#b8860b]" />
      <div className="absolute top-0.5 right-0.5 w-1 h-1 border-t border-r border-[#b8860b]" />
      <div className="absolute bottom-0.5 left-0.5 w-1 h-1 border-b border-l border-[#b8860b]" />
      <div className="absolute bottom-0.5 right-0.5 w-1 h-1 border-b border-r border-[#b8860b]" />

      <div
        onClick={(e) => {
          e.stopPropagation();
          soundEngine.playButtonClick();
          setIsExpanded(false);
        }}
        className="w-full flex items-center justify-between pb-1 mb-1.5 border-b border-[#b8860b]/30 text-[8px] font-pixel text-[#e8c76a] cursor-pointer hover:brightness-125"
        title="Recolher objetivos"
      >
        <div className="flex items-center gap-1">
          <ScrollText size={9} className="text-[#e8c76a]" />
          <span className="uppercase tracking-wider font-bold">Missão Ativa</span>
        </div>
        <ChevronUp size={10} className="text-[#b8860b]" />
      </div>

      {activeQuests.map(({ log, def }) => (
        <div key={log.questId} className="mb-1.5 last:mb-0">
          <div className="text-[9px] font-pixel text-[#e3dac9] uppercase leading-tight mb-1">{def.title}</div>
          <ul className="space-y-0.5">
            {def.objectives.map((obj) => {
              const progress = log.objectivesProgress?.[obj.id] ?? obj.currentCount;
              const done = obj.isCompleted || progress >= obj.targetCount;
              return (
                <li
                  key={obj.id}
                  className={`text-[8px] font-pixel leading-snug flex items-start gap-1 ${
                    done ? 'text-[#4ade80] line-through' : 'text-gray-400'
                  }`}
                >
                  <span className="shrink-0">{done ? '✓' : '○'}</span>
                  <span>
                    {obj.description}
                    {obj.targetCount > 1 && (
                      <span className="text-[#b8860b]/80">
                        {' '}
                        ({progress}/{obj.targetCount})
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
};
