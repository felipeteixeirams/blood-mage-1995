import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Music,
  Play,
  Square,
  Volume2,
  VolumeX,
  Sliders,
  Activity,
  Flame,
  Sparkles,
  X,
  Disc,
  Radio,
  FileAudio,
} from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';
import { bgmSynthesizer, BGMThemeName } from '../utils/bgmSynthesizer';
import { useGameStore } from '../store/gameStore';

interface SoundTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TrackInfo {
  id: BGMThemeName;
  title: string;
  subtitle: string;
  bpm: number;
  scale: string;
  leadVoice: string;
  bassVoice: string;
  percussion: string;
  accentColor: string;
}

const TRACKS: TrackInfo[] = [
  {
    id: 'catacombs',
    title: 'Catacumbas dos Mártires',
    subtitle: 'Andares 1 e 2 — Atmosfera Gótica',
    bpm: 92,
    scale: 'Lá menor harmônico (A Harmonic Minor)',
    leadVoice: 'Cravo Gótico 16-Bit (Onda Quadrada com Envelope Crisp)',
    bassVoice: 'Baixo FM Ressonante (Onda Dente de Serra + Sweep)',
    percussion: 'Bumbo de Masmorra e Sino da Catedral',
    accentColor: '#3b82f6',
  },
  {
    id: 'sanctuary',
    title: 'Santuário de Sangue',
    subtitle: 'Andares 3 e 4 — Ritual Carmesim',
    bpm: 84,
    scale: 'Dó menor (C Minor Ritual Scale)',
    leadVoice: 'Vozes Sintéticas e Harmônicos em Triângulo',
    bassVoice: 'Sub-Baixo Drone Místico',
    percussion: 'Sino Ritualístico Ressonante e Tambores Graves',
    accentColor: '#dc2626',
  },
  {
    id: 'boss_plutonia',
    title: 'Fúria de Sangue (Boss Theme)',
    subtitle: 'Sala do Chefe — Inspiração DOOM Plutonia & Sound Blaster 16',
    bpm: 130,
    scale: 'Mi menor / Frígio (E Minor Heavy Riff)',
    leadVoice: 'Riff FM Metálico Acelerado',
    bassVoice: 'Baixo FM Pesado com Modulação Rápida',
    percussion: 'Bumbo Duplo Contínuo e Caixa Industrial de Ruído',
    accentColor: '#ef4444',
  },
];

const WAV_SAMPLES = [
  {
    name: 'Catacumbas dos Mártires (Floor 1-2)',
    url: '/audio_samples/catacombs_floor1.wav',
    duration: '11.4s loop',
    desc: 'Cravo gótico, linha de baixo FM e sino cerimonial.',
  },
  {
    name: 'Santuário de Sangue (Floor 3-4)',
    url: '/audio_samples/sanctuary_floor3.wav',
    duration: '12.4s loop',
    desc: 'Drone litúrgico em Dó menor com pads ressonantes.',
  },
  {
    name: 'Fúria de Sangue - Boss Plutonia',
    url: '/audio_samples/boss_plutonia.wav',
    duration: '8.4s loop',
    desc: 'Riff veloz a 130 BPM com bumbo duplo.',
  },
  {
    name: 'Filtro Muffle (Inventário Aberto)',
    url: '/audio_samples/catacombs_muffled_inventory.wav',
    duration: '11.4s loop',
    desc: 'Simulação do filtro passa-baixas a 700Hz com menus abertos.',
  },
  {
    name: 'Modo Pânico (<25% HP)',
    url: '/audio_samples/boss_panic_low_hp.wav',
    duration: '7.6s loop',
    desc: 'Cadência acelerada (+12%) com batimentos cardíacos sombrios.',
  },
];

export const SoundTestModal: React.FC<SoundTestModalProps> = ({ isOpen, onClose }) => {
  const { isMuted, toggleMute, settings, updateSettings } = useGameStore();

  const [activeTab, setActiveTab] = useState<'live' | 'samples'>('live');
  const [selectedTheme, setSelectedTheme] = useState<BGMThemeName>('catacombs');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuffled, setIsMuffled] = useState<boolean>(false);
  const [isLowHp, setIsLowHp] = useState<boolean>(false);
  const [localVolume, setLocalVolume] = useState<number>(settings.bgmVolume);

  // Sync state with synthesizer
  useEffect(() => {
    if (isOpen) {
      setIsPlaying(bgmSynthesizer.isActive());
      setSelectedTheme(bgmSynthesizer.getTheme());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePlayTheme = (themeId: BGMThemeName) => {
    setSelectedTheme(themeId);
    soundEngine.startGothicAmbientBGM(themeId);
    setIsPlaying(true);
    bgmSynthesizer.setMuffled(isMuffled);
    bgmSynthesizer.setLowHp(isLowHp);
  };

  const handleStopTheme = () => {
    soundEngine.stopBGM();
    setIsPlaying(false);
  };

  const handleToggleMuffle = () => {
    const next = !isMuffled;
    setIsMuffled(next);
    soundEngine.setBGMMuffled(next);
  };

  const handleToggleLowHp = () => {
    const next = !isLowHp;
    setIsLowHp(next);
    soundEngine.setBGMLowHp(next);
  };

  const handleVolumeChange = (newVol: number) => {
    setLocalVolume(newVol);
    updateSettings({ ...settings, bgmVolume: newVol });
    soundEngine.setVolumes(settings.sfxVolume, newVol);
  };

  const currentTrack = TRACKS.find((t) => t.id === selectedTheme) || TRACKS[0];

  return (
    <div
      id="sound-test-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0f0c08] border-2 border-[#6b5a3a] rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => {
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#241a10] via-[#1a1208] to-[#241a10] border-b border-[#4a3b22]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-[#3d1212] border border-[#8b2020] text-red-400">
              <Music className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-serif text-[#e5c378] tracking-wide font-bold">
                TESTE DE ÁUDIO & TRILHA PROCEDURAL 16-BIT
              </h2>
              <p className="text-xs text-[#a89060]">
                Sintetizador Web Audio API em Tempo Real (Estilo OPL3 / Sound Blaster 16 / DOOM)
              </p>
            </div>
          </div>

          <button
            id="close-sound-test-btn"
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="p-1.5 text-[#a89060] hover:text-[#e5c378] hover:bg-[#382a15] rounded transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#3d2f19] bg-[#140e08] px-4 pt-2 gap-2">
          <button
            id="tab-live-synth"
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-md border-t border-x transition-colors ${
              activeTab === 'live'
                ? 'bg-[#1e150c] text-[#e5c378] border-[#6b5a3a] border-b-transparent'
                : 'text-[#8b7348] border-transparent hover:text-[#c4a96b]'
            }`}
          >
            <Radio className="w-4 h-4" />
            Sintetizador ao Vivo (Web Audio)
          </button>

          <button
            id="tab-wav-samples"
            onClick={() => setActiveTab('samples')}
            className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-md border-t border-x transition-colors ${
              activeTab === 'samples'
                ? 'bg-[#1e150c] text-[#e5c378] border-[#6b5a3a] border-b-transparent'
                : 'text-[#8b7348] border-transparent hover:text-[#c4a96b]'
            }`}
          >
            <FileAudio className="w-4 h-4" />
            Amostras Renderizadas (.WAV)
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-[#d8c29d]">
          {activeTab === 'live' ? (
            <>
              {/* Equalizer Visualizer simulation */}
              <div className="bg-[#080604] border border-[#3d2f19] rounded-lg p-4 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="flex items-end justify-center gap-1.5 h-16 w-full max-w-md px-4">
                  {Array.from({ length: 24 }).map((_, i) => {
                    const barHeight = isPlaying ? Math.sin((i * 0.4) + Date.now() * 0.005) * 45 + 50 : 8;
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm transition-all duration-75"
                        style={{
                          height: `${isPlaying ? Math.max(10, Math.min(100, barHeight + (i % 3) * 12)) : 8}%`,
                          backgroundColor: isPlaying
                            ? i > 18
                              ? '#ef4444'
                              : i > 12
                              ? '#eab308'
                              : '#22c55e'
                            : '#2a2014',
                        }}
                      />
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between w-full text-xs text-[#a89060] border-t border-[#2a2014] pt-2">
                  <div className="flex items-center gap-2">
                    <Disc className={`w-3.5 h-3.5 ${isPlaying ? 'text-green-400 animate-spin' : 'text-gray-500'}`} />
                    <span className="font-mono">
                      {isPlaying ? `REPRODUZINDO: [${currentTrack.title.toUpperCase()}]` : 'SINTETIZADOR EM ESPERA'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-amber-300">{currentTrack.bpm} BPM</span>
                    {isMuffled && (
                      <span className="px-2 py-0.5 bg-yellow-900/60 text-yellow-300 rounded text-[10px] font-mono border border-yellow-700">
                        ABAFADO (700Hz)
                      </span>
                    )}
                    {isLowHp && (
                      <span className="px-2 py-0.5 bg-red-900/80 text-red-300 rounded text-[10px] font-mono border border-red-700 animate-pulse">
                        HP CRÍTICO (+12% BPM)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Theme Selection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {TRACKS.map((t) => {
                  const isCurrent = selectedTheme === t.id && isPlaying;
                  return (
                    <div
                      key={t.id}
                      id={`theme-card-${t.id}`}
                      className={`p-4 rounded-lg border flex flex-col justify-between transition-all ${
                        isCurrent
                          ? 'bg-[#24170d] border-[#d4af37] shadow-lg shadow-amber-950/40'
                          : 'bg-[#140e08] border-[#382a15] hover:border-[#6b5a3a]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="px-2 py-0.5 text-[10px] font-bold rounded"
                            style={{
                              backgroundColor: `${t.accentColor}25`,
                              color: t.accentColor,
                              border: `1px solid ${t.accentColor}60`,
                            }}
                          >
                            {t.bpm} BPM
                          </span>
                          {isCurrent && (
                            <span className="text-[11px] text-green-400 font-mono flex items-center gap-1">
                              <Activity className="w-3 h-3 animate-pulse" /> AO VIVO
                            </span>
                          )}
                        </div>

                        <h3 className="font-serif font-bold text-sm text-[#e5c378] leading-tight mb-1">
                          {t.title}
                        </h3>
                        <p className="text-[11px] text-[#a89060] mb-3">{t.subtitle}</p>

                        <div className="text-[10px] space-y-1 text-[#8b754e] border-t border-[#261b0f] pt-2 mb-4">
                          <div>
                            <span className="text-[#a89060]">Escala:</span> {t.scale}
                          </div>
                          <div>
                            <span className="text-[#a89060]">Lead:</span> {t.leadVoice}
                          </div>
                          <div>
                            <span className="text-[#a89060]">Baixo:</span> {t.bassVoice}
                          </div>
                          <div>
                            <span className="text-[#a89060]">Ritmo:</span> {t.percussion}
                          </div>
                        </div>
                      </div>

                      <button
                        id={`btn-play-${t.id}`}
                        onClick={() => {
                          if (isCurrent) {
                            handleStopTheme();
                          } else {
                            handlePlayTheme(t.id);
                          }
                        }}
                        className={`w-full py-2 px-3 rounded text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          isCurrent
                            ? 'bg-red-900/80 hover:bg-red-800 text-red-200 border border-red-600'
                            : 'bg-[#382a15] hover:bg-[#4d3a1f] text-[#e5c378] border border-[#6b5a3a]'
                        }`}
                      >
                        {isCurrent ? (
                          <>
                            <Square className="w-3.5 h-3.5 fill-current" /> Parar
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" /> Reproduzir Tema
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Sound Modifiers */}
              <div className="p-4 bg-[#140e08] border border-[#382a15] rounded-lg space-y-3">
                <h4 className="text-xs font-bold text-[#e5c378] uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5" /> Modificadores & Filtros em Tempo Real
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Muffle filter toggle */}
                  <button
                    id="btn-toggle-muffle"
                    onClick={handleToggleMuffle}
                    className={`p-3 rounded border text-left flex items-start justify-between transition-all ${
                      isMuffled
                        ? 'bg-[#2b210f] border-amber-500 text-amber-200 shadow-md'
                        : 'bg-[#19110a] border-[#382a15] text-[#9b835a] hover:border-[#6b5a3a]'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs text-[#e5c378] mb-0.5 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> Filtro Passa-Baixas (Muffle)
                      </div>
                      <div className="text-[10px] text-[#a89060]">
                        Simula o som abafado a 700Hz quando o jogador abre inventário, menus ou talentos.
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        isMuffled ? 'bg-amber-500 text-black' : 'bg-[#2a1e12] text-gray-400'
                      }`}
                    >
                      {isMuffled ? 'ATIVO' : 'DESLIGADO'}
                    </span>
                  </button>

                  {/* Low HP panic mode toggle */}
                  <button
                    id="btn-toggle-lowhp"
                    onClick={handleToggleLowHp}
                    className={`p-3 rounded border text-left flex items-start justify-between transition-all ${
                      isLowHp
                        ? 'bg-[#3b1212] border-red-500 text-red-200 shadow-md'
                        : 'bg-[#19110a] border-[#382a15] text-[#9b835a] hover:border-[#6b5a3a]'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs text-red-400 mb-0.5 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-red-400" /> Modo Pânico (&lt;25% HP)
                      </div>
                      <div className="text-[10px] text-[#a89060]">
                        Acelera o andamento (+12% BPM) e adiciona pulso de batimento cardíaco tenso.
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        isLowHp ? 'bg-red-600 text-white animate-pulse' : 'bg-[#2a1e12] text-gray-400'
                      }`}
                    >
                      {isLowHp ? 'ATIVO' : 'DESLIGADO'}
                    </span>
                  </button>
                </div>

                {/* Volume slider */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#261b0f]">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      id="btn-soundtest-mute"
                      onClick={toggleMute}
                      className="p-2 bg-[#24170d] hover:bg-[#382a15] rounded border border-[#6b5a3a] text-[#e5c378]"
                      title="Mudo"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-xs text-[#a89060] font-mono w-20">VOLUME BGM:</span>
                      <input
                        id="soundtest-volume-slider"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={localVolume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-[#2a1f14] rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
                      />
                      <span className="text-xs font-mono text-[#e5c378] w-10 text-right">
                        {Math.round(localVolume * 100)}%
                      </span>
                    </div>
                  </div>

                  {isPlaying && (
                    <button
                      id="btn-stop-all"
                      onClick={handleStopTheme}
                      className="px-4 py-1.5 bg-red-950 hover:bg-red-900 border border-red-700 text-red-300 text-xs font-bold rounded flex items-center gap-1.5"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" /> Silenciar Trilha
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* WAV Sample Players Tab */
            <div className="space-y-4">
              <div className="p-3 bg-[#19110a] border border-[#382a15] rounded-md text-xs text-[#a89060]">
                Estes arquivos de áudio foram renderizados diretamente pela síntese digital do motor em{' '}
                <code className="text-[#e5c378] font-mono">/public/audio_samples/</code> para escuta e validação
                offline.
              </div>

              <div className="space-y-3">
                {WAV_SAMPLES.map((sample, idx) => (
                  <div
                    key={idx}
                    id={`wav-sample-${idx}`}
                    className="p-4 bg-[#140e08] border border-[#382a15] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#6b5a3a] transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileAudio className="w-4 h-4 text-amber-500" />
                        <h4 className="font-serif font-bold text-sm text-[#e5c378]">{sample.name}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-[#261a0f] text-[#a89060] rounded border border-[#3d2f19]">
                          {sample.duration}
                        </span>
                      </div>
                      <p className="text-xs text-[#8b754e]">{sample.desc}</p>
                    </div>

                    <audio
                      controls
                      src={sample.url}
                      className="h-9 max-w-full sm:max-w-xs rounded accent-[#d4af37]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#140e08] border-t border-[#3d2f19] flex justify-between items-center text-xs text-[#8b754e]">
          <span>Motor de Áudio Procedural: Web Audio API (Zero Overhead / Sem VRAM)</span>
          <button
            id="sound-test-close-bottom"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#261a0f] hover:bg-[#382717] border border-[#6b5a3a] text-[#e5c378] font-bold rounded transition-colors"
          >
            Fechar Painel
          </button>
        </div>
      </motion.div>
    </div>
  );
};
