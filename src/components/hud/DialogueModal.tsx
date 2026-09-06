import React, { useEffect, useRef, useState } from 'react';
import { Feather, Sparkles, BookOpen, Coins, ShieldAlert, Skull } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { soundEngine } from '../../utils/soundEngine';
import { useGamepadUINavigation } from '../../hooks/useGamepadUINavigation';

/**
 * Frente 2 de docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md:
 * Interface CRPG do diálogo de campanha — lê `campaignState.activeDialogueTree` /
 * `activeDialogueNodeId` (já preenchidos por `startDialogue`/`selectDialogueChoice` na
 * store) e renderiza o nó atual com efeito de máquina de escrever + escolhas ramificadas.
 *
 * Layout VN-style (Spec 16): retrato adaptativo à esquerda com insígnia contextual do NPC +
 * caixa de texto em 9-slice CSS ancorada na base da tela com blindagem completa de eventos de ponteiro.
 */
const TYPEWRITER_MS_PER_CHAR = 22;

const getSpeakerInfo = (speakerName?: string, speakerTitle?: string) => {
  const combined = `${speakerName || ''} ${speakerTitle || ''}`.toLowerCase();
  
  if (combined.includes('maelen')) return {
    Icon: Sparkles,
    color: '#e8c76a', // Gold/holy
    gradient: 'from-[#2a1c12] to-[#0c0a09]',
    border: 'border-[#b8860b]',
    glow: 'drop-shadow-[0_0_15px_rgba(184,134,11,0.3)]'
  };
  
  if (combined.includes('ancião') || combined.includes('elder') || combined.includes('mestre') || combined.includes('erudito')) return {
    Icon: BookOpen,
    color: '#a855f7', // Purple/Arcane
    gradient: 'from-[#1f102b] to-[#0c0a09]',
    border: 'border-purple-800',
    glow: 'drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]'
  };
  
  if (combined.includes('mercador') || combined.includes('vendedor') || combined.includes('moeda') || combined.includes('comércio')) return {
    Icon: Coins,
    color: '#fbbf24', // Amber/Coin
    gradient: 'from-[#3a280e] to-[#0c0a09]',
    border: 'border-amber-600',
    glow: 'drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]'
  };
  
  if (combined.includes('guarda') || combined.includes('sentinela') || combined.includes('capitão') || combined.includes('soldado')) return {
    Icon: ShieldAlert,
    color: '#9ca3af', // Gray/Steel
    gradient: 'from-[#1f2328] to-[#0c0a09]',
    border: 'border-gray-500',
    glow: 'drop-shadow-[0_0_15px_rgba(156,163,175,0.3)]'
  };
  
  if (combined.includes('morte') || combined.includes('ceifador') || combined.includes('espectro') || combined.includes('necromante') || combined.includes('lorde')) return {
    Icon: Skull,
    color: '#ef4444', // Red/Blood
    gradient: 'from-[#3b1212] to-[#0c0a09]',
    border: 'border-red-800',
    glow: 'drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]'
  };
  
  return {
    Icon: Feather,
    color: '#e8c76a',
    gradient: 'from-[#2a1f16] to-[#0c0a09]',
    border: 'border-[#b8860b]',
    glow: 'drop-shadow-[0_0_15px_rgba(184,134,11,0.3)]'
  };
};

export const DialogueModal: React.FC = () => {
  const activeDialogueTree = useGameStore((s) => s.campaignState.activeDialogueTree);
  const activeDialogueNodeId = useGameStore((s) => s.campaignState.activeDialogueNodeId);
  const selectDialogueChoice = useGameStore((s) => s.selectDialogueChoice);
  const closeDialogue = useGameStore((s) => s.closeDialogue);

  const [typedLength, setTypedLength] = useState(0);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const choicesRef = useRef<HTMLDivElement>(null);

  const node =
    activeDialogueTree && activeDialogueNodeId ? activeDialogueTree.nodes[activeDialogueNodeId] : null;

  const isTyping = node ? typedLength < node.text.length : false;

  useGamepadUINavigation({
    containerRef: choicesRef,
    isActive: Boolean(node && !isTyping),
    onClose: closeDialogue,
  });

  // Reinicia o efeito de máquina de escrever sempre que o nó muda
  useEffect(() => {
    if (typewriterRef.current) clearInterval(typewriterRef.current);
    setTypedLength(0);
    if (!node) return;

    typewriterRef.current = setInterval(() => {
      setTypedLength((prev) => {
        if (prev >= node.text.length) {
          if (typewriterRef.current) clearInterval(typewriterRef.current);
          return prev;
        }
        if (prev % 2 === 0) {
          soundEngine.playDialogueBlip();
        }
        return prev + 1;
      });
    }, TYPEWRITER_MS_PER_CHAR);

    return () => {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDialogueNodeId]);

  if (!node) return null;

  const displayedText = node.text.slice(0, typedLength);

  const handleSkipTypewriter = (e?: React.SyntheticEvent | KeyboardEvent) => {
    if (e) {
      if ('stopPropagation' in e) e.stopPropagation();
      if ('nativeEvent' in e && (e as any).nativeEvent?.stopImmediatePropagation) {
        (e as any).nativeEvent.stopImmediatePropagation();
      }
    }
    if (isTyping) {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
      setTypedLength(node.text.length);
    }
  };

  useEffect(() => {
    if (!isTyping) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        handleSkipTypewriter(e);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTyping, handleSkipTypewriter]);

  const handleChoice = (choiceId: string, e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
      (e as unknown as { nativeEvent?: { stopImmediatePropagation?: () => void } }).nativeEvent?.stopImmediatePropagation?.();
    }
    soundEngine.playButtonClick();
    selectDialogueChoice(choiceId);
  };

  const speakerInfo = getSpeakerInfo(node.speakerName, node.speakerTitle);
  const SpeakerIcon = speakerInfo.Icon;

  // Base64 gothic border pattern for 9-slice usage in pure CSS
  const borderImageStyle = {
    borderStyle: 'solid',
    borderWidth: '16px',
    borderImageSource: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h20v20H0zM40 0h20v20H40zM0 40h20v20H0zM40 40h20v20H40z\' fill=\'%23b8860b\' fill-opacity=\'0.8\'/%3E%3Cpath d=\'M20 0h20v5H20zM20 55h20v5H20zM0 20h5v20H0zM55 20h5v20H55z\' fill=\'%238a6408\' fill-opacity=\'0.6\'/%3E%3Cpath d=\'M5 5h10v2H5zM5 13h10v2H5zM45 5h10v2H45zM45 13h10v2H45zM5 45h10v2H5zM5 53h10v2H5zM45 45h10v2H45zM45 53h10v2H45z\' fill=\'%234a3604\'/%3E%3C/svg%3E")',
    borderImageSlice: '20 fill',
    borderImageRepeat: 'round',
    backgroundColor: 'rgba(12, 10, 9, 0.95)',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end items-center pb-4 sm:pb-8 p-2 sm:p-4 pointer-events-auto bg-gradient-to-t from-black/85 via-black/45 to-transparent select-none"
      onClick={handleSkipTypewriter}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.nativeEvent?.stopImmediatePropagation?.();
      }}
    >
      <div 
        className="max-w-3xl w-full flex items-end gap-2 animate-in slide-in-from-bottom-6 fade-in duration-200"
        onClick={(e) => {
          e.stopPropagation();
          e.nativeEvent?.stopImmediatePropagation?.();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          e.nativeEvent?.stopImmediatePropagation?.();
        }}
      >
        {/* Retrato Expressivo do NPC (Esquerda - Fluido e Responsivo) */}
        <div className={`shrink-0 w-20 h-28 sm:w-28 sm:h-36 md:w-32 md:h-40 relative flex items-end z-10 ${speakerInfo.glow}`}>
          <div className={`absolute inset-0 bg-[#1c140e] border-2 ${speakerInfo.border} rounded-t-sm overflow-hidden flex flex-col items-center justify-center pb-2 bg-gradient-to-t ${speakerInfo.gradient}`}>
            {/* Insígnia ou Silhueta Procedural Contextual */}
            <SpeakerIcon className="w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1" style={{ color: speakerInfo.color }} strokeWidth={1.25} />
            <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-[#0c0a09] to-transparent pointer-events-none" />
          </div>
          {/* Placa com Nome */}
          <div className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-[115%] bg-[#0c0a09] border ${speakerInfo.border} py-0.5 sm:py-1 px-1 text-center shadow-lg`}>
            <span className="text-[8px] sm:text-[9px] md:text-[10px] font-pixel uppercase tracking-wider block font-bold leading-tight truncate" style={{ color: speakerInfo.color }}>
              {node.speakerName}
            </span>
          </div>
        </div>

        {/* Caixa de Texto Principal (9-Slice CSS) */}
        <div
          style={borderImageStyle}
          className="flex-1 min-h-[120px] sm:min-h-[140px] text-[#E3DAC9] shadow-[0_0_30px_rgba(0,0,0,0.95)] relative flex flex-col justify-between"
        >
          {/* Header opcional de título */}
          {node.speakerTitle && (
             <div className="absolute -top-5 sm:-top-6 left-0 text-[8px] sm:text-[10px] font-gothic text-[#b8860b]/90 italic bg-[#0c0a09]/90 border border-[#b8860b]/40 px-2 py-0.5 rounded-t-md">
               {node.speakerTitle}
             </div>
          )}

          {/* Texto de Fala */}
          <p
            className="text-xs sm:text-sm font-gothic leading-relaxed mt-0.5 text-gray-200 text-left min-h-[3.5em] drop-shadow-md cursor-pointer"
            onClick={handleSkipTypewriter}
            style={{ textShadow: '1px 1px 0 #000' }}
          >
            {displayedText}
            {isTyping && <span className="animate-pulse text-[#b8860b]">▍</span>}
          </p>

          {/* Opções de Resposta */}
          {!isTyping && (
            <div ref={choicesRef} className="mt-3 sm:mt-4 space-y-1 font-pixel text-[9px] sm:text-[10px] flex flex-col items-end">
              {node.choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={(e) => handleChoice(choice.id, e)}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.nativeEvent?.stopImmediatePropagation?.();
                  }}
                  className="w-full sm:w-[92%] text-left px-2.5 sm:px-3 py-2 sm:py-2.5 bg-gradient-to-r from-transparent via-[#1c140e] to-[#2a1c12] hover:via-[#2a1c12] hover:to-[#4a3604] border-r-4 border-[#b8860b]/50 focus:border-[#e8c76a] focus:bg-gradient-to-r focus:from-transparent focus:via-[#2a1c12] focus:to-[#4a3604] outline-none hover:border-[#e8c76a] text-[#e3dac9] transition-all cursor-pointer touch-manipulation uppercase shadow-md active:scale-[0.99]"
                >
                  <span className="text-[#b8860b] mr-1.5">♦</span> {choice.text}
                </button>
              ))}
              {node.choices.length === 0 && (
                <button
                  onClick={(e) => {
                    if (e) {
                      e.stopPropagation();
                      e.nativeEvent?.stopImmediatePropagation?.();
                    }
                    soundEngine.playButtonClick();
                    closeDialogue();
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.nativeEvent?.stopImmediatePropagation?.();
                  }}
                  className="w-full sm:w-[92%] text-left px-2.5 sm:px-3 py-2 sm:py-2.5 bg-gradient-to-r from-transparent via-[#1c140e] to-[#2a1c12] hover:via-[#2a1c12] hover:to-[#4a3604] border-r-4 border-[#b8860b]/50 focus:border-[#e8c76a] focus:bg-gradient-to-r focus:from-transparent focus:via-[#2a1c12] focus:to-[#4a3604] outline-none hover:border-[#e8c76a] text-[#e3dac9] transition-all cursor-pointer touch-manipulation uppercase shadow-md active:scale-[0.99]"
                >
                  <span className="text-[#b8860b] mr-1.5">♦</span> (Sair)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
