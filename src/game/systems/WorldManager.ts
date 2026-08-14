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
      lightRadius: 320,
      darknessColor: 0x0f0e14,
      darknessAlpha: 0.15,
      fogAlpha: 0.15,
      reverbLevel: 0.3,
      ambientDroneFreq: 65,
      particleWeather: 'spores',
    },
    catacumbas_martires: {
      id: 'catacumbas_martires',
      name: 'Catacumbas dos Mártires (Subterrâneo Clausúrico)',
      isIndoor: true,
      lightRadius: 300,
      darknessColor: 0x080812,
      darknessAlpha: 0.20,
      fogAlpha: 0.20,
      reverbLevel: 0.4,
      ambientDroneFreq: 45,
      particleWeather: 'ash_embers',
    },
    santuario_sangue: {
      id: 'santuario_sangue',
      name: 'Santuário de Sangue (Catedral Aberta)',
      isIndoor: false,
      lightRadius: 400,
      darknessColor: 0x141220,
      darknessAlpha: 0.10,
      fogAlpha: 0.10,
      reverbLevel: 0.1,
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
