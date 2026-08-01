import React from 'react';
import { PlayerStats } from '../types/game';
import { PlayerStatus } from './hud/PlayerStatus';
import { GameStats } from './hud/GameStats';
import { ActionButtons } from './hud/ActionButtons';
import { LootLog } from './hud/LootLog';
import { SkillsOverlay } from './hud/SkillsOverlay';
import { useJoystick } from '../hooks/useJoystick';
import { Flame } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';
import { useGameStore } from '../store/gameStore';
import { BossHealthBar } from './hud/BossHealthBar';

interface GameplayHUDProps {
  getCooldownRemaining: (spellId: string) => number;
}

export const GameplayHUD: React.FC<GameplayHUDProps> = ({
  getCooldownRemaining,
}) => {
  const {
    playerStats: stats,
    setActiveSkillTrigger: onSkillClick,
    setTouchMoveInput: onMoveJoystickUpdate,
    setTouchAimInput: onAimJoystickUpdate,
    setGameState,
    isMuted,
    toggleMute: onToggleMute,
    settings,
  } = useGameStore();

  const virtualControlsOpacity = settings.virtualControlsOpacity;
  const onPauseToggle = () => setGameState('paused');

  const moveJoystick = useJoystick(onMoveJoystickUpdate, true);
  const aimJoystick = useJoystick(onAimJoystickUpdate, false);

  const novaCd = getCooldownRemaining('hellfire_nova');
  const hasManaForNova = stats.mana >= 25; // Base hardcoded for quick HUD shortcut check

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 md:p-6 select-none overflow-hidden">
      {/* CRT Scanline & Vignette Overlays */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.12] mix-blend-overlay" 
           style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)', backgroundSize: '100% 4px' }}>
      </div>
      <div className="fixed inset-0 pointer-events-none z-[101] shadow-[inset_0_0_120px_rgba(0,0,0,0.6)]"></div>
      
      {/* Boss Health Bar */}
      <BossHealthBar />

      {/* Top Header HUD */}
      <div className="w-full flex justify-between items-start relative">
        <PlayerStatus stats={stats} />
        
        <div className="flex flex-col items-center">
          <GameStats stats={stats} />
          <LootLog />
        </div>

        <ActionButtons 
          isMuted={isMuted} 
          onToggleMute={() => { soundEngine.playButtonClick(); onToggleMute(); }}
          onPauseToggle={() => { soundEngine.playButtonClick(); onPauseToggle(); }}
        />
      </div>

      {/* Bottom Area: Virtual Joysticks & Skill Hotkeys */}
      <div className="w-full flex justify-between items-end pb-2">
        {/* Bottom Left: Touch Movement Joystick */}
        <div
          onPointerDown={moveJoystick.onPointerDown}
          onPointerMove={moveJoystick.onPointerMove}
          onPointerUp={moveJoystick.onPointerUp}
          onTouchStart={moveJoystick.onTouchStart}
          onTouchMove={moveJoystick.onTouchMove}
          onTouchEnd={moveJoystick.onTouchEnd}
          style={{ opacity: virtualControlsOpacity }}
          className="pointer-events-auto relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-black/40 border-2 border-red-900/60 flex items-center justify-center touch-none backdrop-blur-xs shadow-2xl"
        >
          <div
            className="w-12 h-12 rounded-full bg-gradient-to-br from-red-800 to-red-950 border border-red-500/80 shadow-lg"
            style={{
              transform: `translate(${moveJoystick.pos.x}px, ${moveJoystick.pos.y}px)`,
              transition: moveJoystick.active ? 'none' : 'transform 0.1s ease-out',
            }}
          />
          <span className="absolute bottom-2 text-[9px] font-pixel text-gray-400/60 pointer-events-none">MOVER</span>
        </div>

        {/* Bottom Right: Touch Aim Joystick + Skill Action Buttons */}
        <div className="pointer-events-auto flex items-end gap-3 md:gap-4">
          <SkillsOverlay 
            stats={stats} 
            getCooldownRemaining={getCooldownRemaining} 
            onSkillClick={onSkillClick} 
          />

          {/* Aim Virtual Joystick */}
          <div className="relative group pointer-events-auto">
            {/* Blood Nova Shortcut (Mobile) */}
            <button 
              onClick={() => {
                soundEngine.playButtonClick();
                onSkillClick('nova');
              }}
              disabled={novaCd > 0 || !hasManaForNova}
              className={`absolute -top-20 right-0 w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                novaCd > 0 
                  ? 'bg-gray-900/90 border-gray-700 opacity-50' 
                  : 'bg-red-950/90 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
              }`}
            >
              <Flame className={`w-7 h-7 ${novaCd > 0 ? 'text-gray-600' : 'text-red-400 animate-pulse'}`} />
              {novaCd > 0 && (
                <div className="absolute inset-0 flex items-center justify-center font-pixel text-xs text-red-400">
                  {Math.ceil(novaCd/1000)}
                </div>
              )}
            </button>
            <div className="absolute -top-6 right-3 text-[8px] font-pixel text-red-500/80">BLOOD NOVA</div>

            <div
              onPointerDown={aimJoystick.onPointerDown}
              onPointerMove={aimJoystick.onPointerMove}
              onPointerUp={aimJoystick.onPointerUp}
              onTouchStart={aimJoystick.onTouchStart}
              onTouchMove={aimJoystick.onTouchMove}
              onTouchEnd={aimJoystick.onTouchEnd}
              style={{ opacity: virtualControlsOpacity }}
              className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-black/40 border-2 border-red-900/60 flex items-center justify-center touch-none backdrop-blur-xs shadow-2xl"
            >
              <div
                className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-900 border border-red-400 shadow-lg"
                style={{
                  transform: `translate(${aimJoystick.pos.x}px, ${aimJoystick.pos.y}px)`,
                  transition: aimJoystick.active ? 'none' : 'transform 0.1s ease-out',
                }}
              />
              <span className="absolute bottom-2 text-[9px] font-pixel text-gray-400/60 pointer-events-none">MIRAR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
