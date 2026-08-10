import { BiomeType } from '../../types/game';

export interface BiomeEnvironmentConfig {
  id: BiomeType;
  name: string;
  isIndoor: boolean;
  lightRadius: number; // Radio de iluminação ao redor do player (px)
  darknessColor: number; // Hex color da vinheta de escuridão
  darknessAlpha: number; // Opacidade máxima da escuridão
  fogAlpha: number; // Opacidade da névoa atmosférica
  reverbLevel: number; // Intensidade do eco/reverb no áudio (0.0 a 1.0)
  ambientDroneFreq: number; // Frequência do tom drone de fundo
  particleWeather: 'none' | 'blood_rain' | 'ash_embers' | 'spores';
}

export class WorldManager {
  private static instance: WorldManager;

  private biomes: Record<BiomeType, BiomeEnvironmentConfig> = {
    fosso_chagas: {
      id: 'fosso_chagas',
      name: 'Fosso das Chagas (Caverna Sangrenta)',
      isIndoor: true,
      lightRadius: 170,
      darknessColor: 0x2d0208,
      darknessAlpha: 0.55,
      fogAlpha: 0.45,
      reverbLevel: 0.6,
      ambientDroneFreq: 65,
      particleWeather: 'spores',
    },
    catacumbas_martires: {
      id: 'catacumbas_martires',
      name: 'Catacumbas dos Mártires (Subterrâneo Clausúrico)',
      isIndoor: true,
      lightRadius: 130, // Iluminação claustrofóbica reduzida
      darknessColor: 0x050510,
      darknessAlpha: 0.75,
      fogAlpha: 0.60,
      reverbLevel: 0.85, // Eco forte de pedra
      ambientDroneFreq: 45,
      particleWeather: 'ash_embers',
    },
    santuario_sangue: {
      id: 'santuario_sangue',
      name: 'Santuário de Sangue (Catedral Aberta)',
      isIndoor: false, // Espaço com abóbadas abertas e iluminação celeste
      lightRadius: 320, // Visão ampla e clara
      darknessColor: 0x4a000b,
      darknessAlpha: 0.35,
      fogAlpha: 0.25,
      reverbLevel: 0.2, // Pouco eco de caverna
      ambientDroneFreq: 110,
      particleWeather: 'blood_rain',
    },
  };

  private currentBiomeId: BiomeType = 'fosso_chagas';
  private currentConfig: BiomeEnvironmentConfig;

  // Interpolação suave de iluminação
  public targetLightRadius: number;
  public currentLightRadius: number;

  private constructor() {
    this.currentConfig = this.biomes['fosso_chagas'];
    this.targetLightRadius = this.currentConfig.lightRadius;
    this.currentLightRadius = this.currentConfig.lightRadius;
  }

  public static getInstance(): WorldManager {
    if (!WorldManager.instance) {
      WorldManager.instance = new WorldManager();
    }
    return WorldManager.instance;
  }

  public getBiomeConfig(biome: BiomeType): BiomeEnvironmentConfig {
    return this.biomes[biome] || this.biomes['fosso_chagas'];
  }

  public getCurrentConfig(): BiomeEnvironmentConfig {
    return this.currentConfig;
  }

  public setBiome(biome: BiomeType): { isTransitionIndoorOutdoor: boolean; previousIndoorState: boolean } {
    const prevIndoor = this.currentConfig.isIndoor;
    this.currentBiomeId = biome;
    this.currentConfig = this.getBiomeConfig(biome);
    this.targetLightRadius = this.currentConfig.lightRadius;

    const isTransition = prevIndoor !== this.currentConfig.isIndoor;
    return {
      isTransitionIndoorOutdoor: isTransition,
      previousIndoorState: prevIndoor,
    };
  }

  public updateLighting(delta: number) {
    // Interpolação suave do raio de luz ao mudar de área
    const lerpSpeed = 0.003 * delta;
    this.currentLightRadius += (this.targetLightRadius - this.currentLightRadius) * Math.min(1, lerpSpeed);
  }
}

export const worldManager = WorldManager.getInstance();
