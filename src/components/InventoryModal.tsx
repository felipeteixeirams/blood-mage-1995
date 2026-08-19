import React from 'react';
import { motion } from 'motion/react';
import { Shield, Sword, Sparkles, X, Heart, Zap, Flame, Award, CheckCircle2, PlusCircle, Lock } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { LootItem, RelicItem, ItemRarity } from '../types/game';
import relicsData from '../data/relics.json';

interface InventoryModalProps {
  onClose: () => void;
}

const RARITY_COLORS: Record<ItemRarity, { bg: string; border: string; text: string; badgeBg: string }> = {
  common: { bg: 'bg-slate-900/80', border: 'border-slate-700', text: 'text-slate-300', badgeBg: 'bg-slate-800' },
  rare: { bg: 'bg-blue-950/80', border: 'border-blue-600', text: 'text-blue-400', badgeBg: 'bg-blue-900' },
  epic: { bg: 'bg-purple-950/80', border: 'border-purple-600', text: 'text-purple-400', badgeBg: 'bg-purple-900' },
  legendary: { bg: 'bg-amber-950/80', border: 'border-amber-500', text: 'text-amber-400', badgeBg: 'bg-amber-900' },
};

export const InventoryModal: React.FC<InventoryModalProps> = ({ onClose }) => {
  const {
    equipment,
    playerStats,
    recentLootLog,
    unlockedRelics,
    equipRelicById,
    unequipRelicById,
    getRelicModifiers
  } = useGameStore();

  const activeRelicMods = getRelicModifiers();
  const allCatalogRelics = relicsData as RelicItem[];

  const renderSlot = (title: string, item: LootItem | RelicItem | null, icon: React.ReactNode, onUnequip?: () => void) => {
    const rarityConfig = item ? RARITY_COLORS[item.rarity] : { bg: 'bg-black/60', border: 'border-gray-800', text: 'text-gray-600', badgeBg: 'bg-black' };

    return (
      <div className={`p-3 rounded-lg border-2 ${rarityConfig.border} ${rarityConfig.bg} flex flex-col justify-between transition-all relative group shadow-md`}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-black/60 rounded border border-gray-800 text-amber-400">{icon}</span>
            <span className="text-[11px] font-pixel text-amber-200/90 uppercase">{title}</span>
          </div>
          {item && (
            <div className="flex items-center gap-1.5">
              <span className={`text-[9px] font-pixel px-1.5 py-0.5 rounded border uppercase ${rarityConfig.border} ${rarityConfig.text} bg-black/80`}>
                {item.rarity}
              </span>
              {onUnequip && (
                <button
                  onClick={onUnequip}
                  className="text-[9px] font-pixel px-1.5 py-0.5 bg-red-950/90 hover:bg-red-900 border border-red-800 text-red-300 rounded transition-colors cursor-pointer"
                  title="Desequipar relíquia"
                >
                  REMOVER
                </button>
              )}
            </div>
          )}
        </div>

        {item ? (
          <div>
            <h4 className={`text-xs font-gothic font-bold ${rarityConfig.text} mb-0.5`}>{item.name}</h4>
            <p className="text-[10px] text-gray-300 font-retro leading-tight">{item.description}</p>
          </div>
        ) : (
          <p className="text-[11px] text-gray-600 font-retro italic py-1.5">Nenhum item equipado</p>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 pointer-events-auto"
    >
      <div className="bg-[#120a0e] border-4 border-amber-900 rounded-xl p-5 max-w-3xl w-full max-h-[92vh] overflow-y-auto text-gray-100 shadow-[0_0_35px_rgba(180,83,9,0.35)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900/60 pb-3 mb-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 bg-black/60 rounded-md border-2 border-amber-900/80 overflow-hidden flex items-center justify-center shadow-inner">
              <img 
                src="assets/sprites/player/animated/bloodmage_showcase.gif" 
                alt="Blood Mage Avatar" 
                className="w-[200%] max-w-none object-cover"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div>
              <h2 className="text-xl font-gothic text-amber-200 tracking-wide">INVENTÁRIO & RELÍQUIAS MÍSTICAS</h2>
              <p className="text-[11px] text-amber-400/80 font-retro">Gerencie seus artefatos passivos, atributos e artefatos de sangue</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* Left Column: Active Equipment & Relics */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-pixel text-amber-400/90 tracking-wider uppercase border-b border-gray-800 pb-1">EQUIPAMENTOS DA RUN</h3>
            {renderSlot('Arma Principal', equipment.weapon, <Sword className="w-3.5 h-3.5" />)}
            {renderSlot('Armadura Sacrificial', equipment.armor, <Shield className="w-3.5 h-3.5" />)}

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between border-b border-purple-900/50 pb-1">
                <span className="text-[11px] font-pixel text-purple-400 uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Relíquias Ativas ({equipment.relics.length}/3)
                </span>
                <span className="text-[10px] font-retro text-purple-300/70">Selecione abaixo para equipar</span>
              </div>

              {[0, 1, 2].map((slotIdx) => {
                const relic = equipment.relics[slotIdx] as RelicItem | undefined;
                return (
                  <div key={`relic_slot_${slotIdx}`}>
                    {renderSlot(
                      `Slot de Relíquia ${slotIdx + 1}`,
                      relic || null,
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
                      relic ? () => unequipRelicById(relic.id) : undefined
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Attribute Summary & Relic Modifiers */}
          <div className="space-y-3">
            <div className="bg-black/70 border border-amber-900/60 rounded-lg p-3.5">
              <h3 className="text-[11px] font-pixel text-amber-400/90 tracking-wider uppercase border-b border-gray-800 pb-1.5 mb-2.5">
                ATRIBUTOS TOTAIS
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs font-retro">
                <div className="flex items-center justify-between p-2 bg-gray-900/70 rounded border border-gray-800">
                  <span className="text-gray-400 flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-red-500" /> HP Máx:</span>
                  <span className="text-red-400 font-bold">{Math.round(playerStats.maxHp + (activeRelicMods.maxHpBonus || 0))}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-900/70 rounded border border-gray-800">
                  <span className="text-gray-400 flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-amber-500" /> Dano:</span>
                  <span className="text-amber-400 font-bold">+{Math.round(((playerStats.damageMultiplier + (activeRelicMods.damageMultiplier || 0)) - 1) * 100)}%</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-900/70 rounded border border-gray-800">
                  <span className="text-gray-400 flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-blue-400" /> Cooldown:</span>
                  <span className="text-blue-400 font-bold">-{Math.round((playerStats.cooldownReduction + (activeRelicMods.cooldownReductionBonus || 0)) * 100)}%</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-900/70 rounded border border-gray-800">
                  <span className="text-gray-400 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-purple-400" /> Vampirismo:</span>
                  <span className="text-purple-400 font-bold">{Math.round((playerStats.vampirism + (activeRelicMods.lifestealBonus || 0)) * 100)}%</span>
                </div>
              </div>

              {/* Special Relic Passive Summary */}
              <div className="mt-3 pt-2 border-t border-amber-900/40 text-[10px] font-retro text-amber-200/90 space-y-1">
                <p className="font-pixel text-[9px] text-amber-400 uppercase mb-1">EFEITOS PASSIVOS DE RELÍQUIA ATIVOS:</p>
                {activeRelicMods.bloodCrystalMultiplier && activeRelicMods.bloodCrystalMultiplier > 1 ? (
                  <p className="text-amber-300 flex items-center gap-1">💎 Ganho de Cristais de Sangue: <strong className="text-amber-400">+{Math.round((activeRelicMods.bloodCrystalMultiplier - 1) * 100)}%</strong></p>
                ) : null}
                {activeRelicMods.bleedChanceOnHit ? (
                  <p className="text-red-400 flex items-center gap-1">🩸 Sangramento ao Atacar: <strong className="text-red-300">{Math.round(activeRelicMods.bleedChanceOnHit * 100)}% chance ({activeRelicMods.bleedDamagePerSecond} DPS)</strong></p>
                ) : null}
                {activeRelicMods.spellCostDiscount ? (
                  <p className="text-blue-300 flex items-center gap-1">📜 Desconto Custo Feitiços: <strong className="text-blue-400">-{Math.round(activeRelicMods.spellCostDiscount * 100)}%</strong></p>
                ) : null}
                {activeRelicMods.hpRegenBonus ? (
                  <p className={activeRelicMods.hpRegenBonus < 0 ? "text-red-400" : "text-green-400"}>
                    ❤️ Regeneração HP: <strong>{activeRelicMods.hpRegenBonus > 0 ? `+${activeRelicMods.hpRegenBonus}` : activeRelicMods.hpRegenBonus}/s</strong>
                  </p>
                ) : null}
                {!activeRelicMods.bleedChanceOnHit && (!activeRelicMods.bloodCrystalMultiplier || activeRelicMods.bloodCrystalMultiplier <= 1) && !activeRelicMods.spellCostDiscount && !activeRelicMods.hpRegenBonus && (
                  <p className="text-gray-500 italic">Nenhum efeito passivo especial ativo. Equipe relíquias abaixo!</p>
                )}
              </div>
            </div>

            {/* Recent Loot Log */}
            <div className="bg-black/70 border border-amber-900/60 rounded-lg p-3">
              <h3 className="text-[11px] font-pixel text-amber-400/90 tracking-wider uppercase border-b border-gray-800 pb-1 mb-2">HISTÓRICO DE LOOT</h3>
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {recentLootLog.length > 0 ? (
                  recentLootLog.map((log, i) => (
                    <p key={i} className="text-[10px] font-retro text-amber-300/90 bg-amber-950/30 p-1 rounded border border-amber-900/40">
                      {log}
                    </p>
                  ))
                ) : (
                  <p className="text-[10px] font-retro text-gray-600 italic">Nenhum loot recente registrado.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Gallery of Unlocked / Catalog Relics */}
        <div className="border-t border-amber-900/60 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-pixel text-amber-300 uppercase tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> GALERIA DE RELÍQUIAS DESBLOQUEADAS ({unlockedRelics.length}/{allCatalogRelics.length})
            </h3>
            <span className="text-[10px] font-retro text-amber-400/70">Toque em "Equipar" para ativar até 3 relíquias</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
            {allCatalogRelics.map((relic) => {
              const isUnlocked = unlockedRelics.includes(relic.id);
              const isEquipped = (equipment.relics as RelicItem[]).some((r) => r.id === relic.id);
              const rarityConfig = RARITY_COLORS[relic.rarity];

              return (
                <div
                  key={relic.id}
                  className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
                    isEquipped
                      ? 'bg-purple-950/40 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                      : isUnlocked
                      ? `${rarityConfig.bg} ${rarityConfig.border}`
                      : 'bg-black/80 border-gray-800 opacity-60'
                  }`}
                >
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[9px] font-pixel px-1.5 py-0.2 rounded uppercase border ${rarityConfig.border} ${rarityConfig.text} bg-black/80`}>
                        {relic.rarity}
                      </span>
                      <h4 className={`text-xs font-gothic font-bold ${isUnlocked ? 'text-amber-200' : 'text-gray-500'}`}>{relic.name}</h4>
                    </div>
                    <p className="text-[10px] text-gray-300 font-retro leading-tight">{relic.description}</p>
                  </div>

                  <div className="flex items-center shrink-0">
                    {isEquipped ? (
                      <button
                        onClick={() => unequipRelicById(relic.id)}
                        className="px-2 py-1 bg-purple-900/90 hover:bg-purple-800 border border-purple-500 text-purple-200 font-pixel text-[9px] rounded flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3 text-purple-300" /> ATIVA
                      </button>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => equipRelicById(relic.id)}
                        className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-600 text-amber-200 font-pixel text-[9px] rounded flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <PlusCircle className="w-3 h-3 text-amber-400" /> EQUIPAR
                      </button>
                    ) : (
                      <span className="px-2 py-1 bg-gray-900 border border-gray-800 text-gray-600 font-pixel text-[9px] rounded flex items-center gap-1">
                        <Lock className="w-3 h-3" /> BLOQUEADA
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 mt-4 border-t border-amber-900/40">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-amber-950 hover:bg-amber-900 border border-amber-700 text-amber-200 font-pixel text-xs rounded transition-all cursor-pointer shadow-lg"
          >
            VOLTAR AO JOGO
          </button>
        </div>
      </div>
    </motion.div>
  );
};
