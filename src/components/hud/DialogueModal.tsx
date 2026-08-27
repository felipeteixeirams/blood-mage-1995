import React, { useEffect, useRef, useState } from 'react';
import { Feather } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { soundEngine } from '../../utils/soundEngine';

/**
 * Frente 2 de docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md:
 * Interface CRPG do diálogo de campanha — lê `campaignState.activeDialogueTree` /
 * `activeDialogueNodeId` (já preenchidos por `startDialogue`/`selectDialogueChoice` na
 * store) e renderiza o nó atual com efeito de máquina de escrever + escolhas ramificadas.
 *
 * Nota de escopo: sem retrato em imagem por enquanto — os retratos gerados em
 * `textureGenerator.ts` (ex.: `portrait_maelen`) vivem só no canvas do Phaser, e puxar
 * esse canvas pra cá exigiria uma nova ponte (scene ref) que não faz parte desta entrega.
 * O cabeçalho usa nome/título do falante + um ícone, no mesmo espírito do modal de NPC
 * de loja já existente (também 100% textual).
 */
const TYPEWRITER_MS_PER_CHAR = 18;

export const DialogueModal: React.FC = () => {
  const activeDialogueTree = useGameStore((s) => s.campaignState.activeDialogueTree);
  const activeDialogueNodeId = useGameStore((s) => s.campaignState.activeDialogueNodeId);
  const selectDialogueChoice = useGameStore((s) => s.selectDialogueChoice);
  const closeDialogue = useGameStore((s) => s.closeDialogue);

  const [typedLength, setTypedLength] = useState(0);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const node =
    activeDialogueTree && activeDialogueNodeId ? activeDialogueTree.nodes[activeDialogueNodeId] : null;

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
        return prev + 1;
      });
    }, TYPEWRITER_MS_PER_CHAR);

    return () => {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDialogueNodeId]);

  if (!node) return null;

  const isTyping = typedLength < node.text.length;
  const displayedText = node.text.slice(0, typedLength);

  const handleSkipTypewriter = () => {
    if (isTyping) {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
      setTypedLength(node.text.length);
    }
  };

  const handleChoice = (choiceId: string) => {
    soundEngine.playButtonClick();
    selectDialogueChoice(choiceId);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
      onClick={handleSkipTypewriter}
    >
      <div
        className="bg-[#0c0a09] border-4 border-double border-[#b8860b] p-5 max-w-lg w-full text-[#E3DAC9] shadow-[0_0_35px_rgba(0,0,0,0.95)] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cantoneiras — mesmo acabamento do modal de NPC de loja */}
        <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#b8860b]" />
        <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#b8860b]" />
        <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#b8860b]" />
        <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#b8860b]" />

        {/* Header — nome + título do falante */}
        <div className="flex items-center gap-2.5 border-b-2 border-[#b8860b]/30 pb-2.5 mb-3">
          <div className="w-9 h-9 shrink-0 rounded-full bg-[#1c140e] border-2 border-[#b8860b]/60 flex items-center justify-center">
            <Feather size={16} className="text-[#e8c76a]" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-pixel text-[#e8c76a] uppercase font-bold tracking-wider">
              {node.speakerName}
            </span>
            {node.speakerTitle && (
              <span className="text-[9px] font-gothic text-[#b8860b]/80 italic">{node.speakerTitle}</span>
            )}
          </div>
        </div>

        {/* Texto do nó, com efeito de máquina de escrever */}
        <p
          className="text-[11px] font-gothic leading-relaxed mb-4 italic border-l-2 border-[#b8860b] pl-2.5 py-1 text-gray-300 text-left min-h-[3.5em]"
          onClick={handleSkipTypewriter}
        >
          {displayedText}
          {isTyping && <span className="animate-pulse">▌</span>}
        </p>

        {/* Escolhas — só aparecem depois que o texto termina de "digitar" */}
        {!isTyping && (
          <div className="space-y-1.5 font-pixel text-[9px]">
            {node.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleChoice(choice.id)}
                className="w-full text-left px-3 py-2 bg-[#1c140e] hover:bg-[#2a1c12] border border-[#b8860b]/40 hover:border-[#b8860b] text-[#e3dac9] transition-colors cursor-pointer touch-manipulation"
              >
                » {choice.text}
              </button>
            ))}
            {node.choices.length === 0 && (
              <button
                onClick={() => {
                  soundEngine.playButtonClick();
                  closeDialogue();
                }}
                className="w-full text-left px-3 py-2 bg-[#1c140e] hover:bg-[#2a1c12] border border-[#b8860b]/40 hover:border-[#b8860b] text-[#e3dac9] transition-colors cursor-pointer touch-manipulation"
              >
                » Encerrar conversa
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
