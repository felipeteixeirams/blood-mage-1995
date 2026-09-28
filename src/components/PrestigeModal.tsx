import React, { useState } from 'react';
import { Skull, Shield, Flame, Zap, Droplet, Gift, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { ModalBase } from './ui/ModalBase';
import { useGameStore } from '../store/gameStore';
import { soundEngine } from '../utils/soundEngine';
import { BloodSealType, GameDifficulty } from '../types/game';

interface PrestigeModalProps {
  onClose: () => void;
}

const SEAL_INFO: Record<BloodSealType, { name: string; description: string; icon: React.ElementType }> = {
  carnage: {
    name: 'Selo de Carnificina',
    description: '+3.0% no multiplicador de dano total por ponto',
    icon: Flame,
  },
  dark_vitality: {
    name: 'Selo de Vitalidade Sombria',
    description: '+8 de vida máxima permanente por ponto',
    icon: Shield,
  },
  runic_flow: {
    name: 'Selo de Fluxo Rúnico',
    description: '+2.5% de redução de recarga (CDR) por ponto',
    icon: Zap,
  },
  deep_vampirism: {
    name: 'Selo de Vampirismo Profundo',
    description: '+0.5% de cura por dano causado por ponto',
    icon: Droplet,
  },
  macabre_fortune: {
    name: 'Selo de Fortuna Macabra',
    description: '+10% de chance de drop de equipamentos/loot por ponto',
    icon: Gift,
  },
};

const DIFFICULTY_INFO: Record<GameDifficulty, { name: string; reqText: string; desc: string }> = {
  normal: {
    name: 'NORMAL',
    reqText: 'Livre',
    desc: 'Atributos padrão dos monstros e taxa de recompensa base.',
  },
  nightmare: {
    name: 'PESADELO',
    reqText: 'Requer Nível de Prestígio 1',
    desc: '+50% HP/Dano dos inimigos, +25% de taxa de Cristais de Sangue.',
  },
  inferno: {
    name: 'INFERNO',
    reqText: 'Requer Nível de Prestígio 3',
    desc: '+120% HP/Dano dos inimigos, +75% de taxa de Cristais de Sangue.',
  },
};

export const PrestigeModal: React.FC<PrestigeModalProps> = ({ onClose }) => {
  const {
    prestige,
    playerStats,
    canPrestige,
    performPrestige,
    allocateBloodSeal,
    setDifficulty,
    getPrestigeModifiers,
  } = useGameStore();

  const [showConfirm, setShowConfirm] = useState(false);

  const modifiers = getPrestigeModifiers();
  const isEligible = canPrestige();

  const handleAllocate = (seal: BloodSealType) => {
    const success = allocateBloodSeal(seal);
    if (!success) {
      soundEngine.playButtonClick();
    }
  };

  const handleSelectDifficulty = (diff: GameDifficulty) => {
    setDifficulty(diff);
  };

  const handleExecuteSacrifice = () => {
    const success = performPrestige();
    if (success) {
      soundEngine.playBloodNova();
      setShowConfirm(false);
      onClose();
    } else {
      soundEngine.playButtonClick();
    }
  };

  return (
    <ModalBase
      title="SELO DE SANGUE & PRESTÍGIO"
      subtitle="Sacrifício Rúnico Permanente e Liberação de Dificuldades"
      onClose={onClose}
    >
      <div className="flex flex-col gap-4 text-sm text-[#e3dac9] font-pixel">

        {/* Header Summary Panel */}
        <div className="bg-[#120a0a] border border-[#8c1f22]/60 p-3 sm:p-4 rounded shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#8c1f22]/30 border border-[#d4af37] flex items-center justify-center shrink-0">
              <Skull className="w-6 h-6 text-[#ef4444] animate-pulse" />
            </div>
            <div>
              <div className="text-[#d4af37] text-base font-bold tracking-wider">
                NÍVEL DE PRESTÍGIO {prestige.level} / 10
              </div>
              <div className="text-[10px] text-gray-400 font-sans">
                Sacrifícios Realizados: <span className="text-amber-200 font-bold">{prestige.totalSacrifices}</span>
              </div>
            </div>
          </div>

          <div className="bg-black/60 border border-[#b8860b]/40 px-3 py-2 rounded flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start">
            <span className="text-[10px] text-gray-300">PONTOS DE SELO DISPONÍVEIS:</span>
            <span className="text-lg font-bold text-[#ef4444] drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
              {prestige.unspentSealPoints}
            </span>
          </div>
        </div>

        {/* Current Modifiers Active Panel */}
        <div className="bg-[#0f0e0d] border border-[#b8860b]/30 p-3 rounded">
          <h3 className="text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#e8c76a]" /> BÔNUS PASSIVOS ACUMULADOS
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] font-retro text-gray-300">
            <div className="bg-black/40 p-2 border border-amber-900/30 rounded">
              <span className="block text-gray-400">Multiplicador de Dano</span>
              <span className="text-amber-200 font-bold">+{((modifiers.damageMult - 1) * 100).toFixed(1)}%</span>
            </div>
            <div className="bg-black/40 p-2 border border-amber-900/30 rounded">
              <span className="block text-gray-400">Vida Máxima Bônus</span>
              <span className="text-emerald-400 font-bold">+{modifiers.bonusMaxHp} HP</span>
            </div>
            <div className="bg-black/40 p-2 border border-amber-900/30 rounded">
              <span className="block text-gray-400">Redução Recarga (CDR)</span>
              <span className="text-sky-300 font-bold">+{((modifiers.cdrBonus) * 100).toFixed(1)}%</span>
            </div>
            <div className="bg-black/40 p-2 border border-amber-900/30 rounded">
              <span className="block text-gray-400">Vampirismo Profundo</span>
              <span className="text-[#ef4444] font-bold">+{((modifiers.vampBonus) * 100).toFixed(1)}%</span>
            </div>
            <div className="bg-black/40 p-2 border border-amber-900/30 rounded col-span-2 sm:col-span-1">
              <span className="block text-gray-400">Sorte de Drop</span>
              <span className="text-yellow-400 font-bold">+{((modifiers.dropMult - 1) * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Blood Seals List */}
        <div>
          <h3 className="text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Droplet className="w-4 h-4 text-red-500 fill-red-500" /> ALOCAÇÃO DE SELOS DE SANGUE
          </h3>
          <div className="flex flex-col gap-2">
            {(Object.keys(SEAL_INFO) as BloodSealType[]).map((sealKey) => {
              const info = SEAL_INFO[sealKey];
              const currentVal = prestige.seals[sealKey] || 0;
              const isMax = currentVal >= 5;
              const canAfford = prestige.unspentSealPoints > 0 && !isMax;
              const IconComp = info.icon;

              return (
                <div
                  key={sealKey}
                  className={`p-2.5 border rounded flex items-center justify-between gap-3 transition-colors ${
                    isMax
                      ? 'bg-[#18130f] border-[#b8860b]/60'
                      : canAfford
                      ? 'bg-[#120a0a] border-[#8c1f22]/50 hover:border-[#8c1f22]'
                      : 'bg-black/40 border-gray-900 opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="p-1.5 bg-black/60 border border-[#b8860b]/40 text-[#e8c76a] rounded shrink-0">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#e8c76a] truncate">{info.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-black/80 border border-gray-800 text-gray-300 rounded shrink-0">
                          {currentVal} / 5
                        </span>
                      </div>
                      <p className="text-[9px] font-sans text-gray-400 leading-tight mt-0.5 truncate sm:whitespace-normal">
                        {info.description}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAllocate(sealKey)}
                    disabled={!canAfford}
                    className={`px-2.5 py-1.5 text-[9px] uppercase tracking-wider border font-pixel rounded transition-all cursor-pointer shrink-0 active:scale-95 ${
                      isMax
                        ? 'bg-black/60 border-[#b8860b]/40 text-[#d4af37] opacity-60 cursor-default'
                        : canAfford
                        ? 'bg-[#8c1f22] hover:bg-[#a82529] border-[#d4af37] text-amber-100 shadow-[0_0_8px_rgba(140,31,34,0.4)]'
                        : 'bg-black/30 border-gray-900 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    {isMax ? 'MÁX' : '+1 PONTO'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Difficulty Selection */}
        <div>
          <h3 className="text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-amber-400" /> SELEÇÃO DE DIFICULDADE DA RUN
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(['normal', 'nightmare', 'inferno'] as GameDifficulty[]).map((diff) => {
              const diffInfo = DIFFICULTY_INFO[diff];
              const isUnlocked = prestige.unlockedDifficulties.includes(diff);
              const isSelected = prestige.selectedDifficulty === diff;

              return (
                <button
                  key={diff}
                  onClick={() => isUnlocked && handleSelectDifficulty(diff)}
                  disabled={!isUnlocked}
                  className={`p-2.5 border rounded flex flex-col justify-between text-left transition-all ${
                    isSelected
                      ? 'bg-[#8c1f22]/30 border-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.3)]'
                      : isUnlocked
                      ? 'bg-[#120a0a] border-amber-900/40 hover:border-amber-700 cursor-pointer'
                      : 'bg-black/40 border-gray-900 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${isSelected ? 'text-[#d4af37]' : isUnlocked ? 'text-amber-200' : 'text-gray-500'}`}>
                        {diffInfo.name}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37]" />
                      ) : !isUnlocked ? (
                        <Lock className="w-3.5 h-3.5 text-gray-600" />
                      ) : null}
                    </div>
                    <p className="text-[8px] font-sans text-gray-400 leading-tight">
                      {diffInfo.desc}
                    </p>
                  </div>
                  {!isUnlocked && (
                    <span className="text-[8px] text-red-400 font-pixel mt-2 block">
                      {diffInfo.reqText}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ritual of Sacrifice Execution Area */}
        <div className="bg-[#170a0a] border-2 border-[#8c1f22] p-3 sm:p-4 rounded mt-1 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-500 animate-bounce" /> RITUAL DE SACRIFÍCIO DE SANGUE
              </h4>
              <p className="text-[9px] font-sans text-gray-300 leading-relaxed mt-1">
                Sacrifique o progresso atual do caçador (Nível, Andar e Atributos) para elevar permanentemente seu Nível de Prestígio e ganhar +1 Selo de Sangue.
              </p>
            </div>
            <div className="text-right text-[9px] font-pixel shrink-0 bg-black/60 p-2 border border-gray-800 rounded">
              <div className="text-gray-400">REQUISITOS:</div>
              <div className={playerStats.level >= 10 ? 'text-emerald-400' : 'text-gray-500'}>
                Nível: {playerStats.level}/10
              </div>
              <div className={playerStats.floorDepth >= 3 ? 'text-emerald-400' : 'text-gray-500'}>
                Andar: {playerStats.floorDepth}/3
              </div>
              <div className={playerStats.kills >= 30 ? 'text-emerald-400' : 'text-gray-500'}>
                Abates: {playerStats.kills}/30
              </div>
            </div>
          </div>

          {!showConfirm ? (
            <button
              onClick={() => isEligible && setShowConfirm(true)}
              disabled={!isEligible}
              className={`w-full py-2.5 px-4 font-pixel text-xs uppercase tracking-widest border rounded transition-all cursor-pointer ${
                isEligible
                  ? 'bg-[#8c1f22] hover:bg-[#a82529] border-[#d4af37] text-amber-100 shadow-[0_0_15px_rgba(140,31,34,0.6)] animate-pulse active:scale-95'
                  : 'bg-black/40 border-gray-900 text-gray-600 cursor-not-allowed'
              }`}
            >
              {isEligible ? 'EXECUTAR RITUAL DE SACRIFÍCIO' : 'REQUISITOS INSUFICIENTES'}
            </button>
          ) : (
            <div className="bg-black/90 border border-[#d4af37] p-3 rounded flex flex-col gap-2.5">
              <p className="text-[10px] text-amber-200 font-sans leading-relaxed text-center">
                ⚠️ <strong className="text-red-400">ATENÇÃO:</strong> Esta ação irá resetar seu nível atual para 1 e reiniciar seu progresso de andares da corrida. Seus Selos e melhorias do Sangue permanecem para sempre.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleExecuteSacrifice}
                  className="flex-1 py-2 bg-[#8c1f22] hover:bg-red-700 border border-[#d4af37] text-amber-100 font-pixel text-[10px] uppercase rounded transition-colors cursor-pointer"
                >
                  SIM, CONFIRMAR SACRIFÍCIO
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2 bg-black hover:bg-gray-900 border border-gray-700 text-gray-300 font-pixel text-[10px] uppercase rounded transition-colors cursor-pointer"
                >
                  CANCELAR
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </ModalBase>
  );
};

export default PrestigeModal;
