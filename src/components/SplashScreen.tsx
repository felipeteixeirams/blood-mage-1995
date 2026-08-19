import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const bootSequence = [
    'INICIALIZANDO MEMÓRIA ESTENDIDA (XMS)... OK',
    'CARREGANDO MOTOR DE RENDERIZAÇÃO ISOMÉTRICA... OK',
    'CONECTANDO AO FOSSO DE ZIGGURAT...',
    'INVOCANDO DEMÔNIOS LOCAIS... 100%',
    'VERIFICAÇÃO DE SANGUE... CONCLUÍDA.',
    'INICIANDO PROTOCOLO BLOODMAGE.',
  ];

  useEffect(() => {
    let currentPhase = 0;
    
    const interval = setInterval(() => {
      if (currentPhase < bootSequence.length) {
        setLogs(prev => [...prev, bootSequence[currentPhase]]);
        currentPhase++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setPhase(1); // Ready to transition out
          setTimeout(() => onCompleteRef.current(), 800);
        }, 500);
      }
    }, 250); // Speed of text lines appearing

    const handleSkip = () => {
      clearInterval(interval);
      onCompleteRef.current();
    };

    window.addEventListener('keydown', handleSkip, { once: true });
    window.addEventListener('pointerdown', handleSkip, { once: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleSkip);
      window.removeEventListener('pointerdown', handleSkip);
    };
  }, []);

  return (
    <AnimatePresence>
      {phase === 0 && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="fixed inset-0 z-[999] bg-black flex flex-col justify-center p-8 select-none crt-overlay"
        >
          <div className="max-w-3xl w-full mx-auto space-y-4">
            <div className="flex items-center gap-2 mb-8">
              <ShieldAlert className="w-8 h-8 text-red-600" />
              <span className="text-xl font-pixel text-red-600">DOS.V 6.66</span>
            </div>
            
            <div className="font-mono text-sm md:text-base text-gray-300 space-y-2 flex flex-col">
              {logs.map((log, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={index === bootSequence.length - 1 ? 'text-red-500 font-bold' : ''}
                >
                  {log}
                </motion.span>
              ))}
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="inline-block w-3 h-5 bg-gray-300 mt-1"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
