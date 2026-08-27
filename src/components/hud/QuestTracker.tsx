import React, { useMemo } from 'react';
import { ScrollText } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import campaignQuestsData from '../../data/campaignQuests.json';
import { QuestDefinition } from '../../types/campaign';

const questDefs = campaignQuestsData as Record<string, QuestDefinition>;

/**
 * Frente 2 de docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md:
 * Rastreador sutil de objetivos no canto superior direito, no mesmo estilo forjado
 * do Minimap.tsx. Mostra apenas quests com status 'active' em `campaignState.quests`.
 *
 * Nota de escopo: `advanceQuestObjective` hoje só marca a quest como ativa — não
 * incrementa `currentCount` dos objetivos (isso depende de gatilhos que ainda não
 * existem: item `starter_dagger` no baú, inimigo `scout_beast`, zona `altar_crimson`).
 * Por isso os objetivos aqui aparecem com a contagem estática da definição (0/N) até
 * esses gatilhos serem implementados numa próxima leva.
 */
export const QuestTracker: React.FC = () => {
  const quests = useGameStore((s) => s.campaignState.quests);

  const activeQuests = useMemo(
    () =>
      Object.values(quests)
        .filter((q) => q.status === 'active')
        .map((q) => ({ log: q, def: questDefs[q.questId] }))
        .filter((q) => !!q.def),
    [quests]
  );

  if (activeQuests.length === 0) return null;

  return (
    <div className="bg-[#0f0b09]/95 border-2 border-[#b8860b]/50 p-2 shadow-[4px_4px_12px_rgba(0,0,0,0.85)] pointer-events-none flex flex-col select-none w-[180px] sm:w-[220px]">
      <div className="w-full flex items-center gap-1 pb-1 mb-1.5 border-b border-[#b8860b]/30 text-[8px] font-pixel text-[#e8c76a]">
        <ScrollText size={9} className="text-[#e8c76a]" />
        <span className="uppercase tracking-wider">Missão Ativa</span>
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
                  className={`text-[8px] font-gothic leading-snug flex items-start gap-1 ${
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
