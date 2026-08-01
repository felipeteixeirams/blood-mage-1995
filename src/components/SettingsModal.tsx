import React from 'react';
import { GameSettings } from '../types/game';
import { X, Volume2, Monitor, Touchpad, Settings as SettingsIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { soundEngine } from '../utils/soundEngine';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const handleChange = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const updated = { ...settings, [key]: value };
    onUpdateSettings(updated);
    soundEngine.setVolumes(updated.sfxVolume, updated.bgmVolume);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-lg bg-[#120a0e] border-4 border-red-900/80 rounded-xl p-5 md:p-6 shadow-[0_0_50px_rgba(185,28,28,0.5)] flex flex-col space-y-5"
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-red-900/60 pb-3">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-5 h-5 text-gray-400" />
            <h2 className="text-2xl font-gothic text-amber-200">CONFIGURAÇÕES</h2>
          </div>
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="p-1.5 hover:bg-red-950 text-gray-400 hover:text-red-200 rounded border border-transparent hover:border-red-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options Stack */}
        <div className="space-y-4 font-retro text-base">
          {/* CRT Scanline Filter */}
          <div className="flex justify-between items-center bg-black/60 p-3 rounded border border-red-900/40">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-amber-400" />
              <span>Filtro CRT Scanlines (Retro 1995)</span>
            </div>
            <button
              onClick={() => {
                soundEngine.playButtonClick();
                handleChange('crtFilter', !settings.crtFilter);
              }}
              className={`px-3 py-1 font-pixel text-xs rounded border cursor-pointer transition-colors ${
                settings.crtFilter
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  : 'bg-red-950 text-red-400 border-red-800'
              }`}
            >
              {settings.crtFilter ? 'LIGADO' : 'DESLIGADO'}
            </button>
          </div>

          {/* SFX Volume */}
          <div className="bg-black/60 p-3 rounded border border-red-900/40 space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-red-400" />
                <span>Volume dos Efeitos (SFX)</span>
              </div>
              <span className="font-pixel text-xs text-amber-400">
                {Math.round(settings.sfxVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sfxVolume}
              onChange={(e) => handleChange('sfxVolume', parseFloat(e.target.value))}
              className="w-full accent-red-600 cursor-pointer"
            />
          </div>

          {/* BGM Volume */}
          <div className="bg-black/60 p-3 rounded border border-red-900/40 space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-purple-400" />
                <span>Música de Fundo (BGM Gothic)</span>
              </div>
              <span className="font-pixel text-xs text-amber-400">
                {Math.round(settings.bgmVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.bgmVolume}
              onChange={(e) => handleChange('bgmVolume', parseFloat(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          {/* Virtual Controls Opacity */}
          <div className="bg-black/60 p-3 rounded border border-red-900/40 space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Touchpad className="w-4 h-4 text-emerald-400" />
                <span>Opacidade dos Joysticks Virtuais</span>
              </div>
              <span className="font-pixel text-xs text-amber-400">
                {Math.round(settings.virtualControlsOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={settings.virtualControlsOpacity}
              onChange={(e) => handleChange('virtualControlsOpacity', parseFloat(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Done Button */}
        <button
          onClick={() => {
            soundEngine.playButtonClick();
            onClose();
          }}
          className="w-full py-3 bg-red-950 hover:bg-red-900 border border-red-700 rounded text-amber-200 font-pixel text-xs transition-colors cursor-pointer"
        >
          SALVAR & FECHAR
        </button>
      </motion.div>
    </motion.div>
  );
};
