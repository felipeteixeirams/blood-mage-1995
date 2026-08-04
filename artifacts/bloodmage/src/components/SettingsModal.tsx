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
        className="w-full max-w-lg ornate-plate rounded p-6 shadow-2xl flex flex-col space-y-6"
      >
        {/* Header */}
        <div className="flex justify-center items-center pb-2 relative">
          <h2 className="text-3xl font-gothic text-[#d4af37] tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,1)] text-center">
            BLOODMAGE 1995
          </h2>
        </div>

        {/* Options Stack */}
        <div className="space-y-6 font-retro text-lg text-[#e0d0b0]">
          {/* SFX Volume */}
          <div className="space-y-2">
            <div className="text-center font-bold tracking-widest text-shadow-sm shadow-black">
              AUDIO VOLUME <span className="text-xs text-[#d4af37] opacity-80 ml-2">({Math.round(settings.sfxVolume * 100)}%)</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sfxVolume}
              onChange={(e) => handleChange('sfxVolume', parseFloat(e.target.value))}
              className="ruby-slider"
            />
          </div>

          {/* BGM Volume (Re-purposing Brightness from ref) */}
          <div className="space-y-2">
            <div className="text-center font-bold tracking-widest text-shadow-sm shadow-black">
              MUSIC VOLUME <span className="text-xs text-[#d4af37] opacity-80 ml-2">({Math.round(settings.bgmVolume * 100)}%)</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.bgmVolume}
              onChange={(e) => handleChange('bgmVolume', parseFloat(e.target.value))}
              className="ruby-slider"
            />
          </div>

          {/* Virtual Controls Opacity (Re-purposing Contrast from ref) */}
          <div className="space-y-2">
            <div className="text-center font-bold tracking-widest text-shadow-sm shadow-black">
              CONTROLS OPACITY <span className="text-xs text-[#d4af37] opacity-80 ml-2">({Math.round(settings.virtualControlsOpacity * 100)}%)</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={settings.virtualControlsOpacity}
              onChange={(e) => handleChange('virtualControlsOpacity', parseFloat(e.target.value))}
              className="ruby-slider"
            />
          </div>
          
          {/* CRT Filter toggle styled to match somewhat */}
          <div className="flex justify-center mt-2">
            <button
              onClick={() => {
                soundEngine.playButtonClick();
                handleChange('crtFilter', !settings.crtFilter);
              }}
              className={`px-4 py-2 font-pixel text-xs border-2 shadow-lg transition-colors cursor-pointer ${
                settings.crtFilter
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  : 'bg-red-950 text-red-400 border-red-800'
              }`}
            >
              CRT FILTER: {settings.crtFilter ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-between gap-3 pt-4">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="flex-1 py-2 stone-btn font-pixel text-[10px] sm:text-xs cursor-pointer"
          >
            APPLY
          </button>
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              handleChange('sfxVolume', 1);
              handleChange('bgmVolume', 1);
              handleChange('crtFilter', true);
              handleChange('virtualControlsOpacity', 0.5);
            }}
            className="flex-1 py-2 stone-btn font-pixel text-[10px] sm:text-xs cursor-pointer"
          >
            RESET
          </button>
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="flex-1 py-2 stone-btn font-pixel text-[10px] sm:text-xs cursor-pointer"
          >
            EXIT
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
