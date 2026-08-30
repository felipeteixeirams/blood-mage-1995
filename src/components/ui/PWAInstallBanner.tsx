import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Smartphone, Share2, PlusSquare, ShieldCheck } from 'lucide-react';
import { soundEngine } from '../../utils/soundEngine';

interface PWAInstallBannerProps {
  hasNativePrompt: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  isDismissed: boolean;
  onPromptInstall: () => Promise<boolean>;
  onDismiss: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  hasNativePrompt,
  isIOS,
  isStandalone,
  isDismissed,
  onPromptInstall,
  onDismiss,
}) => {
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already running standalone or dismissed, do not render banner
  if (isStandalone || isDismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    soundEngine.playButtonClick();
    if (hasNativePrompt) {
      await onPromptInstall();
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  const handleDismiss = () => {
    soundEngine.playButtonClick();
    onDismiss();
  };

  return (
    <>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-[130] pointer-events-auto select-none"
        id="pwa-install-banner"
      >
        <div className="bg-[#120a0e]/95 border-2 border-[#8b2635] shadow-[0_0_25px_rgba(139,38,53,0.5)] rounded-lg p-3.5 backdrop-blur-md relative">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 text-[#a88d5b] hover:text-[#f3e5ab] transition-colors cursor-pointer"
            title="Fechar banner de instalação"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <div className="w-10 h-10 rounded bg-gradient-to-br from-[#7a1c28] to-[#2b080c] border border-[#a88d5b] flex items-center justify-center shrink-0 shadow-md">
              <Smartphone className="w-5 h-5 text-[#f3e5ab]" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="font-gothic text-xs md:text-sm text-[#f3e5ab] tracking-wider uppercase">
                  Instalar Bloodmage 1995
                </span>
                <span className="bg-[#4a121a] text-[#f87171] text-[9px] font-mono px-1.5 py-0.5 rounded border border-[#8b2635]">
                  OFFLINE
                </span>
              </div>
              <p className="text-[11px] font-mono text-gray-300 leading-snug">
                Jogue em tela cheia, sem barra de navegador e 100% offline no seu dispositivo.
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-1.5 px-3 bg-gradient-to-r from-[#8b2635] via-[#a83244] to-[#7a1c28] hover:from-[#a83244] hover:to-[#8b2635] border border-[#d4af37] text-[#f3e5ab] font-pixel text-[9px] md:text-[10px] rounded uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(212,175,55,0.3)] transition cursor-pointer"
            >
              <Download size={13} className="text-[#f3e5ab]" />
              <span>Instalar Aplicativo</span>
            </button>

            <button
              onClick={handleDismiss}
              className="py-1.5 px-3 bg-black/60 hover:bg-[#201015] border border-[#4a3525] text-gray-400 hover:text-gray-200 font-pixel text-[9px] rounded uppercase transition cursor-pointer"
            >
              Depois
            </button>
          </div>
        </div>
      </motion.div>

      {/* iOS Installation Instructions Modal */}
      <AnimatePresence>
        {showIOSModal && (
          <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#120a0e] border-2 border-[#a88d5b] rounded-xl p-5 max-w-sm w-full text-center space-y-4 shadow-[0_0_30px_rgba(168,141,91,0.35)]"
            >
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck className="w-6 h-6 text-[#d4af37]" />
                <h3 className="font-gothic text-base text-[#f3e5ab] uppercase tracking-wide">
                  Instalar no iOS / Safari
                </h3>
              </div>

              <div className="text-left space-y-3 text-xs font-mono text-gray-300 bg-black/50 p-3.5 rounded border border-[#3a2d1d]">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded bg-[#2b080c] border border-[#8b2635] text-[#f87171] font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <p>
                    Toque no botão <strong className="text-[#f3e5ab]">Compartilhar</strong> (<Share2 className="inline w-3.5 h-3.5 text-[#d4af37]" />) na barra inferior do Safari.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded bg-[#2b080c] border border-[#8b2635] text-[#f87171] font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <p>
                    Role para baixo e selecione <strong className="text-[#f3e5ab]">"Adicionar à Tela de Início"</strong> (<PlusSquare className="inline w-3.5 h-3.5 text-[#d4af37]" />).
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded bg-[#2b080c] border border-[#8b2635] text-[#f87171] font-bold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <p>
                    Toque em <strong className="text-[#f3e5ab]">"Adicionar"</strong> no canto superior direito para iniciar a experiência nativa em tela cheia.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  soundEngine.playButtonClick();
                  setShowIOSModal(false);
                }}
                className="w-full py-2 bg-gradient-to-r from-[#8b2635] to-[#5c131f] border border-[#d4af37] text-[#f3e5ab] font-pixel text-xs rounded uppercase tracking-wider transition cursor-pointer"
              >
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
