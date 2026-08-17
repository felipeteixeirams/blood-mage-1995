import React, { useState } from 'react';
import {
  Skull,
  Flame,
  BookOpen,
  Shield,
  Crown,
  Eye,
  Coins,
  Award,
  Check,
  Lock,
  Scroll,
  Feather,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { ModalBase } from './ui/ModalBase';
import { soundEngine } from '../utils/soundEngine';
import { useGameStore } from '../store/gameStore';
import { CodexSystem } from '../game/systems/CodexSystem';
import monstersData from '../data/monsters.json';
import relicsData from '../data/relics.json';
import { CodexCategory, CodexEntry, MonsterConfig, RelicItem } from '../types/game';

interface CodexModalProps {
  onClose: () => void;
}

export const CodexModal: React.FC<CodexModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<CodexCategory>('enemies');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const {
    codexState,
    claimCodexMilestone,
    getLoreCompletionPercentage,
    bloodCrystals,
  } = useGameStore();

  const completionPct = getLoreCompletionPercentage();
  const entries = CodexSystem.getEntries(activeTab);

  const getCategoryIcon = (cat: CodexCategory) => {
    switch (cat) {
      case 'enemies':
        return <Skull className="w-3.5 h-3.5" />;
      case 'relics':
        return <Shield className="w-3.5 h-3.5" />;
      case 'lore':
        return <BookOpen className="w-3.5 h-3.5" />;
    }
  };

  const renderEntryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'Dog':
        return <Skull className="w-4 h-4 text-red-400" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-4 h-4 text-amber-500" />;
      case 'Ghost':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'Crown':
        return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'Eye':
        return <Eye className="w-4 h-4 text-blue-400" />;
      case 'Coins':
        return <Coins className="w-4 h-4 text-amber-400" />;
      case 'Scroll':
        return <Scroll className="w-4 h-4 text-amber-200" />;
      case 'Feather':
        return <Feather className="w-4 h-4 text-emerald-400" />;
      default:
        return <Skull className="w-4 h-4 text-red-400" />;
    }
  };

  return (
    <ModalBase
      title="CÓDICE DO SANGUE"
      subtitle="Enciclopédia Ancestral de Demônios, Artefatos e Lore Gótica"
      onClose={() => {
        soundEngine.playButtonClick();
        onClose();
      }}
    >
      <div className="flex flex-col gap-3 font-pixel text-xs max-h-[72vh]">
        {/* Lore Completion Bar Header */}
        <div className="bg-[#18110e] border border-[#b8860b]/30 p-2.5 rounded flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Award className="w-4 h-4 text-[#e8c76a]" />
            <div className="flex flex-col">
              <span className="text-[10px] text-[#e8c76a] font-bold uppercase tracking-wider">
                CONCLUSÃO DO CÓDICE: {completionPct}%
              </span>
              <div className="w-40 sm:w-56 h-2 bg-black/80 rounded border border-[#b8860b]/40 overflow-hidden mt-1">
                <div
                  className="h-full bg-gradient-to-r from-red-800 via-amber-600 to-amber-400 transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black/60 px-3 py-1 rounded border border-[#b8860b]/20 text-[10px] text-amber-300">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>CRISTAIS DE SANGUE: <strong className="text-white">{bloodCrystals}</strong></span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1.5 border-b border-[#b8860b]/30 pb-2">
          {(['enemies', 'relics', 'lore'] as CodexCategory[]).map((cat) => {
            const labels: Record<CodexCategory, string> = {
              enemies: 'BESTIÁRIO',
              relics: 'RELÍQUIAS',
              lore: 'MANUSCRITOS'
            };
            const isActive = activeTab === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  soundEngine.playButtonClick();
                  setActiveTab(cat);
                  setSelectedEntryId(null);
                }}
                className={`flex-1 py-2 font-pixel text-[9px] uppercase transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                  isActive
                    ? 'bg-[#2a1d17] text-[#e8c76a] border-[#b8860b] shadow-[0_0_10px_rgba(184,134,11,0.3)] font-bold'
                    : 'bg-black/60 border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-700'
                }`}
              >
                {getCategoryIcon(cat)}
                <span>{labels[cat]}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content View */}
        <div className="overflow-y-auto pr-1 space-y-3 max-h-[50vh]">
          {activeTab === 'enemies' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {entries.map((entry) => {
                const monsterConfig = entry.monsterId
                  ? (monstersData as Record<string, MonsterConfig>)[entry.monsterId]
                  : null;
                const isUnlocked = CodexSystem.isEntryUnlocked(entry, codexState);
                const kills = entry.monsterId ? codexState.enemyKills[entry.monsterId] || 0 : 0;
                const claimedList = codexState.claimedMilestones[entry.id] || [];

                return (
                  <div
                    key={entry.id}
                    className={`bg-[#120e0d] border p-3 flex flex-col gap-2 relative shadow-md rounded transition-all ${
                      isUnlocked
                        ? 'border-[#b8860b]/30 hover:border-[#b8860b]/60'
                        : 'border-gray-800/60 opacity-60'
                    }`}
                  >
                    {/* Header: Icon, Name, HP */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-black/60 rounded border border-[#b8860b]/20">
                          {isUnlocked ? renderEntryIcon(entry.icon) : <Lock className="w-4 h-4 text-gray-600" />}
                        </div>
                        <div>
                          <h4 className="font-pixel text-[10px] text-[#e8c76a] font-bold uppercase tracking-wide">
                            {isUnlocked ? entry.title : '??? [DESCONHECIDO]'}
                          </h4>
                          <span className="text-[8px] font-retro text-gray-400 block">
                            {isUnlocked ? entry.subtitle : 'Derrote para registrar'}
                          </span>
                        </div>
                      </div>

                      {monsterConfig && isUnlocked && (
                        <div className="text-right">
                          <span className="text-[8px] font-pixel text-red-400 bg-red-950/50 px-1.5 py-0.5 border border-red-900/60 rounded inline-block">
                            {monsterConfig.hp} HP
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p className="font-retro text-xs text-gray-300 leading-relaxed text-left bg-black/30 p-2 rounded border border-white/5">
                      {isUnlocked ? entry.lore : (entry.unlockCriteria || 'Sua essência ainda não foi catalogada.')}
                    </p>

                    {/* Stats overview */}
                    {monsterConfig && isUnlocked && (
                      <div className="grid grid-cols-3 gap-1 text-[8px] font-mono text-[#e8c76a]/80 bg-[#1a1310] p-1.5 rounded border border-[#b8860b]/10 text-center">
                        <div>Dano: <span className="text-white">{monsterConfig.damage}</span></div>
                        <div>Velocidade: <span className="text-white">{monsterConfig.speed}</span></div>
                        <div>XP: <span className="text-white">{monsterConfig.xpDrop}</span></div>
                      </div>
                    )}

                    {/* Kill Counter & Milestones */}
                    {isUnlocked && entry.milestones && (
                      <div className="mt-1 pt-2 border-t border-[#b8860b]/20 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[9px] font-pixel text-amber-200/90">
                          <span>CONTADOR DE ABATES:</span>
                          <strong className="text-amber-400 font-mono text-[10px]">{kills} ABATES</strong>
                        </div>

                        {/* Milestone Reward Buttons */}
                        <div className="flex flex-col gap-1 mt-1">
                          {entry.milestones.map((m) => {
                            const isAchieved = kills >= m.killCount;
                            const isClaimed = claimedList.includes(m.killCount);

                            return (
                              <div
                                key={m.killCount}
                                className="flex justify-between items-center bg-black/50 px-2 py-1 rounded border border-amber-900/30 text-[8px]"
                              >
                                <span className="text-gray-300 font-retro flex items-center gap-1">
                                  {isClaimed ? (
                                    <Check className="w-3 h-3 text-emerald-400 inline" />
                                  ) : isAchieved ? (
                                    <Award className="w-3 h-3 text-amber-400 inline animate-pulse" />
                                  ) : (
                                    <Lock className="w-3 h-3 text-gray-600 inline" />
                                  )}
                                  {m.killCount} abates: {m.description}
                                </span>

                                <button
                                  disabled={!isAchieved || isClaimed}
                                  onClick={() => {
                                    const success = claimCodexMilestone(entry.id, m.killCount);
                                    if (success) {
                                      soundEngine.playOrbPickup();
                                    }
                                  }}
                                  className={`px-2 py-0.5 font-pixel text-[8px] rounded uppercase transition-all cursor-pointer ${
                                    isClaimed
                                      ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
                                      : isAchieved
                                      ? 'bg-amber-600 hover:bg-amber-500 text-black font-bold border border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                      : 'bg-black/60 text-gray-600 border border-gray-800 cursor-not-allowed'
                                  }`}
                                >
                                  {isClaimed ? 'RESGATADO' : isAchieved ? `+${m.rewardCrystals} 💎 RESGATAR` : `${m.killCount} ABATES`}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'relics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {entries.map((entry) => {
                const relicInfo = entry.relicId
                  ? (relicsData as RelicItem[]).find((r) => r.id === entry.relicId)
                  : null;
                const isUnlocked = CodexSystem.isEntryUnlocked(entry, codexState);

                return (
                  <div
                    key={entry.id}
                    className={`bg-[#120e0d] border p-3 flex flex-col gap-2 relative shadow-md rounded ${
                      isUnlocked ? 'border-[#b8860b]/30' : 'border-gray-800/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-black/60 rounded border border-[#b8860b]/20">
                        {isUnlocked ? renderEntryIcon(entry.icon) : <Lock className="w-4 h-4 text-gray-600" />}
                      </div>
                      <div>
                        <h4 className="font-pixel text-[10px] text-amber-200 font-bold uppercase">
                          {isUnlocked ? entry.title : '??? [ARTEFATO PERDIDO]'}
                        </h4>
                        <span className="text-[8px] font-retro text-amber-400/70 block">
                          {isUnlocked ? entry.subtitle : entry.unlockCriteria}
                        </span>
                      </div>
                    </div>

                    <p className="font-retro text-xs text-gray-300 leading-relaxed text-left bg-black/30 p-2 rounded border border-white/5">
                      {isUnlocked ? entry.lore : 'Este relicário permanece lacrado nas catacumbas.'}
                    </p>

                    {relicInfo && isUnlocked && (
                      <div className="text-[9px] font-mono text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-800/40">
                        Efeito: {relicInfo.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'lore' && (
            <div className="space-y-3">
              {entries.map((entry) => {
                const isUnlocked = CodexSystem.isEntryUnlocked(entry, codexState);

                return (
                  <div
                    key={entry.id}
                    className={`bg-[#18110e] border p-4 flex flex-col gap-2.5 relative shadow-lg rounded ${
                      isUnlocked ? 'border-[#b8860b]/40' : 'border-gray-800/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 border-b border-[#b8860b]/20 pb-2">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <div>
                        <h4 className="font-pixel text-[11px] text-[#e8c76a] font-bold uppercase tracking-wider">
                          {isUnlocked ? entry.title : '??? [MANUSCRITO PERDIDO]'}
                        </h4>
                        <span className="text-[9px] font-retro text-amber-300/60 block">
                          {isUnlocked ? entry.subtitle : entry.unlockCriteria}
                        </span>
                      </div>
                    </div>

                    <p className="font-retro text-sm text-amber-100/90 leading-relaxed text-left italic bg-black/40 p-3 rounded border border-[#b8860b]/10">
                      {isUnlocked ? `"${entry.lore}"` : 'Trecho de pergaminho consumido pelas chamas das catacumbas.'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ModalBase>
  );
};
