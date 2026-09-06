import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Shield, Sword, Sparkles, X, Heart, Zap, Flame, Award, CheckCircle2, PlusCircle, Lock, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { LootItem, RelicItem, ItemRarity } from '../types/game';
import relicsData from '../data/relics.json';
import { useGamepadUINavigation } from '../hooks/useGamepadUINavigation';

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

  const [selectedRelic, setSelectedRelic] = useState<RelicItem | null>(null);
  const [relicFilter, setRelicFilter] = useState<'all' | 'unlocked' | 'equipped'>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  useGamepadUINavigation({
    containerRef,
    isActive: true,
    onClose,
  });

  const activeRelicMods = getRelicModifiers();
  const allCatalogRelics = relicsData as RelicItem[];

  const filteredRelics = allCatalogRelics.filter((relic) => {
    const isUnlocked = unlockedRelics.includes(relic.id);
    const isEquipped = (equipment.relics as RelicItem[]).some((r) => r.id === relic.id);
    if (relicFilter === 'unlocked') return isUnlocked;
    if (relicFilter === 'equipped') return isEquipped;
    return true;
  });

  const renderSlot = (title: string, item: LootItem | RelicItem | null, icon: React.ReactNode, onUnequip?: () => void) => {
    const rarityConfig = item ? RARITY_COLORS[item.rarity] : { bg: 'bg-black/60', border: 'border-gray-800', text: 'text-gray-600', badgeBg: 'bg-black' };

    return (
      <div 
        onClick={() => item && 'effect' in item && setSelectedRelic(item as RelicItem)}
        onPointerDown={(e) => {
          e.stopPropagation();
          e.nativeEvent?.stopImmediatePropagation?.();
        }}
        className={`p-2.5 sm:p-3 border ${rarityConfig.border} ${rarityConfig.bg} flex flex-col justify-between transition-all relative group shadow-md cursor-pointer hover:border-[#b8860b] active:scale-[0.99]`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="p-1 bg-black/60 border border-[#b8860b]/40 text-[#e8c76a]">{icon}</span>
            <span className="text-[10px] sm:text-[11px] font-pixel text-[#e8c76a]/90 uppercase">{title}</span>
          </div>
          {item && (
            <div className="flex items-center gap-1.5">
              <span className={`text-[8px] sm:text-[9px] font-pixel px-1.5 py-0.5 border uppercase ${rarityConfig.border} ${rarityConfig.text} bg-black/80`}>
                {item.rarity}
              </span>
              {onUnequip && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.nativeEvent?.stopImmediatePropagation?.();
                    onUnequip();
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.nativeEvent?.stopImmediatePropagation?.();
                  }}
                  className="text-[8px] sm:text-[9px] font-pixel px-1.5 py-0.5 bg-red-950/90 hover:bg-red-900 border border-red-800 text-red-300 transition-colors cursor-pointer active:scale-95"
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
          <p className="text-[10px] sm:text-[11px] text-gray-600 font-retro italic py-1">Nenhum item equipado</p>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 pointer-events-auto select-none"
      onClick={onClose}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.nativeEvent?.stopImmediatePropagation?.();
      }}
    >
      <div 
        ref={containerRef}
        className="bg-[#0f0b09]/98 border-2 border-[#b8860b]/60 p-3.5 sm:p-5 max-w-3xl w-full max-h-[92vh] overflow-y-auto text-gray-100 shadow-[0_0_40px_rgba(0,0,0,0.9)] relative"
        onClick={(e) => {
          e.stopPropagation();
          e.nativeEvent?.stopImmediatePropagation?.();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          e.nativeEvent?.stopImmediatePropagation?.();
        }}
      >
        {/* Cantoneiras forjadas douradas */}
        <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#b8860b]" />
        <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#b8860b]" />
        <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#b8860b]" />
        <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#b8860b]" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#b8860b]/40 pb-3 mb-3.5">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-black/70 border border-[#b8860b]/60 overflow-hidden flex items-center justify-center shadow-inner shrink-0">
              <img 
                src="assets/sprites/player/animated/bloodmage_showcase.gif" 
                alt="Blood Mage Avatar" 
                className="w-[200%] max-w-none object-cover"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-gothic text-[#e8c76a] tracking-wide">INVENTÁRIO & RELÍQUIAS MÍSTICAS</h2>
              <p className="text-[9px] sm:text-[11px] text-[#b8860b] font-retro">Gerencie seus artefatos passivos, atributos e artefatos de sangue</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.nativeEvent?.stopImmediatePropagation?.();
              onClose();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.nativeEvent?.stopImmediatePropagation?.();
            }}
            className="p-1.5 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 transition-colors cursor-pointer active:scale-95"
            title="Fechar inventário"
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
                <span className="text-[10px] font-retro text-purple-300/70">Toque para comparar</span>
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

          {/* Right Column: Active Attribute Summary & Comparison Card */}
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

              {/* Selected Relic Stat Comparison Delta Card */}
              {selectedRelic && selectedRelic.effect && (
                <div className="mt-3 p-2.5 bg-amber-950/40 border border-amber-500/50 rounded-lg text-[10px] font-retro">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-pixel text-[9px] text-amber-300 uppercase flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" /> Comparativo: {selectedRelic.name}
                    </span>
                    <button 
                      onClick={() => setSelectedRelic(null)} 
                      className="text-gray-400 hover:text-gray-200 text-[9px]"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {selectedRelic.effect.maxHpBonus ? (
                      <div className="flex items-center justify-between text-green-400 bg-black/60 px-2 py-1 rounded">
                        <span>HP Máx:</span>
                        <span className="font-bold flex items-center"><ArrowUpRight className="w-3 h-3" />+{selectedRelic.effect.maxHpBonus}</span>
                      </div>
                    ) : null}
                    {selectedRelic.effect.damageMultiplier ? (
                      <div className="flex items-center justify-between text-green-400 bg-black/60 px-2 py-1 rounded">
                        <span>Dano:</span>
                        <span className="font-bold flex items-center"><ArrowUpRight className="w-3 h-3" />+{Math.round(selectedRelic.effect.damageMultiplier * 100)}%</span>
                      </div>
                    ) : null}
                    {selectedRelic.effect.cooldownReductionBonus ? (
                      <div className="flex items-center justify-between text-green-400 bg-black/60 px-2 py-1 rounded">
                        <span>Recarga:</span>
                        <span className="font-bold flex items-center"><ArrowUpRight className="w-3 h-3" />-{Math.round(selectedRelic.effect.cooldownReductionBonus * 100)}%</span>
                      </div>
                    ) : null}
                    {selectedRelic.effect.lifestealBonus ? (
                      <div className="flex items-center justify-between text-green-400 bg-black/60 px-2 py-1 rounded">
                        <span>Vampirismo:</span>
                        <span className="font-bold flex items-center"><ArrowUpRight className="w-3 h-3" />+{Math.round(selectedRelic.effect.lifestealBonus * 100)}%</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

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
        <div className="border-t border-[#b8860b]/40 pt-3 sm:pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <h3 className="text-[11px] sm:text-xs font-pixel text-[#e8c76a] uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#b8860b]" /> GALERIA DE RELÍQUIAS ({unlockedRelics.length}/{allCatalogRelics.length})
            </h3>
            
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-black/70 p-1 border border-[#b8860b]/40">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.nativeEvent?.stopImmediatePropagation?.();
                  setRelicFilter('all');
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.nativeEvent?.stopImmediatePropagation?.();
                }}
                className={`px-2 py-0.5 text-[9px] font-pixel transition-colors ${
                  relicFilter === 'all' ? 'bg-[#4a3604] text-[#e8c76a] border border-[#b8860b]/60' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                TODAS
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.nativeEvent?.stopImmediatePropagation?.();
                  setRelicFilter('unlocked');
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.nativeEvent?.stopImmediatePropagation?.();
                }}
                className={`px-2 py-0.5 text-[9px] font-pixel transition-colors ${
                  relicFilter === 'unlocked' ? 'bg-[#4a3604] text-[#e8c76a] border border-[#b8860b]/60' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                DESBLOQUEADAS
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.nativeEvent?.stopImmediatePropagation?.();
                  setRelicFilter('equipped');
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.nativeEvent?.stopImmediatePropagation?.();
                }}
                className={`px-2 py-0.5 text-[9px] font-pixel transition-colors ${
                  relicFilter === 'equipped' ? 'bg-[#4a3604] text-[#e8c76a] border border-[#b8860b]/60' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                EQUIPADAS
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 sm:max-h-60 overflow-y-auto pr-1">
            {filteredRelics.map((relic) => {
              const isUnlocked = unlockedRelics.includes(relic.id);
              const isEquipped = (equipment.relics as RelicItem[]).some((r) => r.id === relic.id);
              const isSelected = selectedRelic?.id === relic.id;
              const rarityConfig = RARITY_COLORS[relic.rarity];

              return (
                <div
                  key={relic.id}
                  onClick={() => setSelectedRelic(relic)}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.nativeEvent?.stopImmediatePropagation?.();
                  }}
                  className={`p-2.5 border flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#b8860b] bg-amber-950/30 shadow-[0_0_12px_rgba(184,134,11,0.5)]'
                      : isEquipped
                      ? 'bg-purple-950/40 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                      : isUnlocked
                      ? `${rarityConfig.bg} ${rarityConfig.border}`
                      : 'bg-black/80 border-gray-800 opacity-60'
                  }`}
                >
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[8px] sm:text-[9px] font-pixel px-1.5 py-0.2 uppercase border ${rarityConfig.border} ${rarityConfig.text} bg-black/80`}>
                        {relic.rarity}
                      </span>
                      <h4 className={`text-xs font-gothic font-bold ${isUnlocked ? 'text-[#e8c76a]' : 'text-gray-500'}`}>{relic.name}</h4>
                    </div>
                    <p className="text-[10px] text-gray-300 font-retro leading-tight">{relic.description}</p>
                  </div>

                  <div className="flex items-center shrink-0">
                    {isEquipped ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.nativeEvent?.stopImmediatePropagation?.();
                          unequipRelicById(relic.id);
                        }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          e.nativeEvent?.stopImmediatePropagation?.();
                        }}
                        className="px-2 py-1 bg-purple-900/90 hover:bg-purple-800 border border-purple-500 text-purple-200 font-pixel text-[9px] flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <CheckCircle2 className="w-3 h-3 text-purple-300" /> ATIVA
                      </button>
                    ) : isUnlocked ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.nativeEvent?.stopImmediatePropagation?.();
                          equipRelicById(relic.id);
                        }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          e.nativeEvent?.stopImmediatePropagation?.();
                        }}
                        className="px-2.5 py-1 bg-[#2a1c12] hover:bg-[#4a3604] border border-[#b8860b] text-[#e8c76a] font-pixel text-[9px] flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
                      >
                        <PlusCircle className="w-3 h-3 text-[#e8c76a]" /> EQUIPAR
                      </button>
                    ) : (
                      <span className="px-2 py-1 bg-gray-900 border border-gray-800 text-gray-600 font-pixel text-[9px] flex items-center gap-1">
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
        <div className="flex justify-end pt-3 mt-3.5 border-t border-[#b8860b]/40">
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.nativeEvent?.stopImmediatePropagation?.();
              onClose();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.nativeEvent?.stopImmediatePropagation?.();
            }}
            className="px-6 py-2 bg-[#2a1c12] hover:bg-[#4a3604] border border-[#b8860b] text-[#e8c76a] font-pixel text-xs transition-all cursor-pointer shadow-lg active:scale-95"
          >
            VOLTAR AO JOGO
          </button>
        </div>
      </div>
    </motion.div>
  );
};

