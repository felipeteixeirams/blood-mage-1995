import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { useGamepadUINavigation } from '../../hooks/useGamepadUINavigation';

interface ModalBaseProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const ModalBase: React.FC<ModalBaseProps> = ({
  title,
  subtitle,
  onClose,
  children
}) => {
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Listen for Escape key to close the modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Hook de navegação com Gamepad (D-Pad, Botão A confirma, Botão B fecha)
  useGamepadUINavigation({
    containerRef: modalContentRef,
    isActive: true,
    onClose,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }} // fade 120ms
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto select-none"
      role="dialog"
      aria-modal="true"
    >
      {/* Placa de pedra cinza escura / gótica medieval de Diablo II */}
      <motion.div
        ref={modalContentRef}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        transition={{ duration: 0.12 }}
        className="bg-[#0c0a09] border-4 border-double border-[#b8860b] p-5 max-w-2xl w-full max-h-[90vh] overflow-y-auto text-[#E3DAC9] shadow-[0_0_35px_rgba(0,0,0,0.95)] relative flex flex-col gap-4 font-pixel"
      >
        {/* Cantoneiras douradas simuladas nos quatro cantos */}
        <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#b8860b]" />
        <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#b8860b]" />
        <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#b8860b]" />
        <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#b8860b]" />

        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#b8860b]/30 pb-2.5">
          <div>
            <h2 className="text-lg md:text-xl font-cinzel text-[#e8c76a] font-bold uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{title}</h2>
            {subtitle && <p className="text-[9px] text-[#e8c76a]/60 font-sans block mt-0.5 uppercase tracking-wide">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-[#171309] hover:bg-[#282216] border border-[#b8860b]/50 text-[#e8c76a] transition-colors cursor-pointer w-9 h-9 flex items-center justify-center shadow-[inset_1px_1px_3px_rgba(0,0,0,0.8)] active:scale-95"
            title="Fechar (B / Esc)"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ModalBase;
