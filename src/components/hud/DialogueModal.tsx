import React, { useEffect, useRef, useState } from 'react';
import { Feather, ShieldAlert } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { soundEngine } from '../../utils/soundEngine';

const TYPEWRITER_MS_PER_CHAR = 22;

export const DialogueModal: React.FC = () => {
  const activeDialogueTree = useGameStore((s) => s.campaignState.activeDialogueTree);
  const activeDialogueNodeId = useGameStore((s) => s.campaignState.activeDialogueNodeId);
  const selectDialogueChoice = useGameStore((s) => s.selectDialogueChoice);
  const closeDialogue = useGameStore((s) => s.closeDialogue);

  const [typedLength, setTypedLength] = useState(0);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const node =
    activeDialogueTree && activeDialogueNodeId ? activeDialogueTree.nodes[activeDialogueNodeId] : null;

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

  // Base64 gothic border pattern for 9-slice usage in pure CSS
  const borderImageStyle = {
    borderStyle: 'solid',
    borderWidth: '20px',
    borderImageSource: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h20v20H0zM40 0h20v20H40zM0 40h20v20H0zM40 40h20v20H40z\' fill=\'%23b8860b\' fill-opacity=\'0.8\'/%3E%3Cpath d=\'M20 0h20v5H20zM20 55h20v5H20zM0 20h5v20H0zM55 20h5v20H55z\' fill=\'%238a6408\' fill-opacity=\'0.6\'/%3E%3Cpath d=\'M5 5h10v2H5zM5 13h10v2H5zM45 5h10v2H45zM45 13h10v2H45zM5 45h10v2H5zM5 53h10v2H5zM45 45h10v2H45zM45 53h10v2H45z\' fill=\'%234a3604\'/%3E%3C/svg%3E")',
    borderImageSlice: '20 fill',
    borderImageRepeat: 'round',
    backgroundColor: 'rgba(12, 10, 9, 0.95)',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end items-center pb-8 p-4 pointer-events-auto bg-gradient-to-t from-black/80 via-black/40 to-transparent"
      onClick={handleSkipTypewriter}
    >
      <div 
        className="max-w-3xl w-full flex items-end gap-2 animate-in slide-in-from-bottom-10 fade-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Retrato Expressivo do NPC (Esquerda) */}
        <div className="shrink-0 w-32 h-40 relative flex items-end z-10 drop-shadow-[0_0_15px_rgba(184,134,11,0.3)]">
          <div className="absolute inset-0 bg-[#1c140e] border-2 border-[#b8860b] rounded-t-sm overflow-hidden flex flex-col items-center justify-end pb-2" style={{
             backgroundImage: 'radial-gradient(circle at top, #2a1f16 0%, #0c0a09 100%)',
          }}>
            {/* Ícone ou Silhueta Procedural como Placeholder Premium */}
            <Feather size={64} className="text-[#b8860b]/40 mb-2" strokeWidth={1} />
            <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-[#0c0a09] to-transparent" />
          </div>
          {/* Placa com Nome */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[110%] bg-[#0c0a09] border border-[#b8860b] py-1 text-center shadow-lg">
            <span className="text-[10px] font-pixel text-[#e8c76a] uppercase tracking-wider block font-bold leading-none">
              {node.speakerName}
            </span>
          </div>
        </div>

        {/* Caixa de Texto Principal (9-Slice CSS) */}
        <div
          style={borderImageStyle}
          className="flex-1 min-h-[140px] text-[#E3DAC9] shadow-[0_0_30px_rgba(0,0,0,0.95)] relative flex flex-col justify-between"
        >
          {/* Header opcional caso queira manter o título */}
          {node.speakerTitle && (
             <div className="absolute -top-6 left-0 text-[10px] font-gothic text-[#b8860b]/80 italic bg-[#0c0a09]/80 px-2 rounded-t-md">
               {node.speakerTitle}
             </div>
          )}

          {/* Texto de Fala */}
          <p
            className="text-sm font-gothic leading-relaxed mt-1 text-gray-200 text-left min-h-[4em] drop-shadow-md"
            onClick={handleSkipTypewriter}
            style={{ textShadow: '1px 1px 0 #000' }}
          >
            {displayedText}
            {isTyping && <span className="animate-pulse text-[#b8860b]">▍</span>}
          </p>

          {/* Opções de Resposta */}
          {!isTyping && (
            <div className="mt-4 space-y-1.5 font-pixel text-[10px] flex flex-col items-end">
              {node.choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => handleChoice(choice.id)}
                  className="w-[90%] text-left px-3 py-2.5 bg-gradient-to-r from-transparent via-[#1c140e] to-[#2a1c12] hover:via-[#2a1c12] hover:to-[#4a3604] border-r-4 border-[#b8860b]/40 hover:border-[#e8c76a] text-[#e3dac9] transition-all cursor-pointer touch-manipulation uppercase shadow-md"
                >
                  <span className="text-[#b8860b] mr-2">♦</span> {choice.text}
                </button>
              ))}
              {node.choices.length === 0 && (
                <button
                  onClick={() => {
                    soundEngine.playButtonClick();
                    closeDialogue();
                  }}
                  className="w-[90%] text-left px-3 py-2.5 bg-gradient-to-r from-transparent via-[#1c140e] to-[#2a1c12] hover:via-[#2a1c12] hover:to-[#4a3604] border-r-4 border-[#b8860b]/40 hover:border-[#e8c76a] text-[#e3dac9] transition-all cursor-pointer touch-manipulation uppercase shadow-md"
                >
                  <span className="text-[#b8860b] mr-2">♦</span> (Sair)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
