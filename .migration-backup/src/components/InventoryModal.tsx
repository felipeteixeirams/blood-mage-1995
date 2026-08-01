import React from 'react';
import { motion } from 'motion/react';
import { Shield, Sword, Sparkles, X, Heart, Zap, Flame, Award } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { LootItem, ItemRarity } from '../types/game';

interface InventoryModalProps {
  onClose: () => void;
}

const RARITY_COLORS: Record<ItemRarity, { bg: string; border: string; text: string }> = {
  common: { bg: 'bg-slate-900/80', border: 'border-slate-700', text: 'text-slate-300' },
  rare: { bg: 'bg-blue-950/80', border: 'border-blue-600', text: 'text-blue-400' },
  epic: { bg: 'bg-purple-950/80', border: 'border-purple-600', text: 'text-purple-400' },
  legendary: { bg: 'bg-amber-950/80', border: 'border-amber-500', text: 'text-amber-400' },
};

export const InventoryModal: React.FC<InventoryModalProps> = ({ onClose }) => {
  const { equipment, playerStats, recentLootLog } = useGameStore();

  const renderSlot = (title: string, item: LootItem | null, icon: React.ReactNode) => {
    const rarityConfig = item ? RARITY_COLORS[item.rarity] : { bg: 'bg-black/60', border: 'border-gray-800', text: 'text-gray-600' };

    return (
      <div className={`p-3.5 rounded-lg border-2 ${rarityConfig.border} ${rarityConfig.bg} flex flex-col justify-between transition-all relative group`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-black/50 rounded border border-gray-800 text-amber-400">{icon}</span>
            <span className="text-xs font-pixel text-amber-200/80 uppercase">{title}</span>
          </div>
          {item && (
            <span className={`text-[9px] font-pixel px-2 py-0.5 rounded border uppercase ${rarityConfig.border} ${rarityConfig.text} bg-black/80`}>
              {item.rarity}
            </span>
          )}
        </div>

        {item ? (
          <div>
            <h4 className={`text-sm font-gothic font-bold ${rarityConfig.text} mb-1`}>{item.name}</h4>
            <p className="text-[11px] text-gray-300 font-retro leading-tight">{item.description}</p>
          </div>
        ) : (
          <p className="text-xs text-gray-600 font-retro italic py-2">Nenhum equipamento equipado</p>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto"
    >
      <div className="bg-[#120a0e] border-4 border-amber-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto text-gray-100 shadow-[0_0_30px_rgba(180,83,9,0.3)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900/60 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <Award className="w-7 h-7 text-amber-500 animate-pulse" />
            <div>
              <h2 className="text-2xl font-gothic text-amber-200">INVENTÁRIO DO HEMOMANTE</h2>
              <p className="text-xs text-amber-400/80 font-retro">Equipamentos, relíquias e bônus de atributos ativos</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {/* Left Column: Equipment Slots */}
          <div className="space-y-3">
            <h3 className="text-xs font-pixel text-amber-400/90 tracking-wider uppercase border-b border-gray-800 pb-1">SLOTS DE EQUIPAMENTO</h3>
            {renderSlot('Arma Principal', equipment.weapon, <Sword className="w-4 h-4" />)}
            {renderSlot('Armadura Sacrificial', equipment.armor, <Shield className="w-4 h-4" />)}
            
            <div className="space-y-2">
              <span className="text-[11px] font-pixel text-purple-400 uppercase">Relíquias Ativas ({equipment.relics.length}/3)</span>
              {equipment.relics.length > 0 ? (
                equipment.relics.map((relic, idx) => (
                  <div key={relic.id + idx}>
                    {renderSlot(`Relíquia ${idx + 1}`, relic, <Sparkles className="w-4 h-4 text-purple-400" />)}
                  </div>
                ))
              ) : (
                renderSlot('Relíquia 1', null, <Sparkles className="w-4 h-4 text-purple-400" />)
              )}
            </div>
          </div>

          {/* Right Column: Attribute Summary & Recent Loot Log */}
          <div className="space-y-4">
            <div className="bg-black/60 border border-amber-900/60 rounded-lg p-4">
              <h3 className="text-xs font-pixel text-amber-400/90 tracking-wider uppercase border-b border-gray-800 pb-2 mb-3">RESUMO DE ATRIBUTOS</h3>
              <div className="grid grid-cols-2 gap-2 text-xs font-retro">
                <div className="flex items-center justify-between p-2 bg-gray-900/60 rounded border border-gray-800">
                  <span className="text-gray-400 flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-red-500" /> HP Máximo:</span>
                  <span className="text-red-400 font-bold">{Math.round(playerStats.maxHp)}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-900/60 rounded border border-gray-800">
                  <span className="text-gray-400 flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-amber-500" /> Dano Total:</span>
                  <span className="text-amber-400 font-bold">+{Math.round((playerStats.damageMultiplier - 1) * 100)}%</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-900/60 rounded border border-gray-800">
                  <span className="text-gray-400 flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-blue-400" /> Cooldown:</span>
                  <span className="text-blue-400 font-bold">-{Math.round(playerStats.cooldownReduction * 100)}%</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-900/60 rounded border border-gray-800">
                  <span className="text-gray-400 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-purple-400" /> Vampirismo:</span>
                  <span className="text-purple-400 font-bold">{Math.round(playerStats.vampirism * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Recent Loot Log */}
            <div className="bg-black/60 border border-amber-900/60 rounded-lg p-4">
              <h3 className="text-xs font-pixel text-amber-400/90 tracking-wider uppercase border-b border-gray-800 pb-2 mb-2">HISTÓRICO DE LOOT RECENTE</h3>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {recentLootLog.length > 0 ? (
                  recentLootLog.map((log, i) => (
                    <p key={i} className="text-[11px] font-retro text-amber-300/90 bg-amber-950/30 p-1.5 rounded border border-amber-900/40">
                      {log}
                    </p>
                  ))
                ) : (
                  <p className="text-xs font-retro text-gray-600 italic">Nenhum loot coletado nesta sessão.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-amber-900/40">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-amber-950 hover:bg-amber-900 border border-amber-700 text-amber-200 font-pixel text-xs rounded transition-all cursor-pointer"
          >
            VOLTAR AO JOGO
          </button>
        </div>
      </div>
    </motion.div>
  );
};
