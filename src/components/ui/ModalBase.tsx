import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

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
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        transition={{ duration: 0.12 }}
        className="bg-[#120a0e] border-4 border-red-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto text-gray-100 shadow-[0_0_35px_rgba(220,38,38,0.35)] relative flex flex-col gap-4 font-pixel"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-900/60 pb-3">
          <div>
            <h2 className="text-xl md:text-2xl font-cinzel text-red-300 font-bold uppercase tracking-wider">{title}</h2>
            {subtitle && <p className="text-[10px] text-red-400/80 font-sans block mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 rounded transition-colors cursor-pointer w-11 h-11 flex items-center justify-center"
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
};
