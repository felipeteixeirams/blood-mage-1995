/**
 * Gerencia a dispersão de floating text (números de dano, XP, etc) para evitar sobreposição.
 * Rastreia posições recentes e aplica deslocamentos inteligentes para novo texto.
 */

interface FloatingTextRecord {
  x: number;
  y: number;
  spawnTime: number;
  lifetime: number; // ms
}

export class FloatingTextDispatcher {
  private recentTexts: FloatingTextRecord[] = [];
  private readonly COLLISION_RADIUS = 45;
  private readonly HISTORY_DURATION = 1000; // ms - quanto tempo rastrear posições antigas

  /**
   * Calcula a melhor posição para spawnar novo floating text evitando sobreposição
   * @param baseX Posição X desejada
   * @param baseY Posição Y desejada
   * @param currentTime Tempo atual do jogo (ms)
   * @returns {x, y} Posição ajustada para evitar colisão
   */
  public calculateDispersion(baseX: number, baseY: number, currentTime: number): { x: number; y: number } {
    // Limpar registros antigos
    this.recentTexts = this.recentTexts.filter(record =>
      currentTime - record.spawnTime < record.lifetime
    );

    // Encontrar textos colidindo com a posição base
    const collidingTexts = this.recentTexts.filter(record => {
      const dist = Math.hypot(record.x - baseX, record.y - baseY);
      return dist < this.COLLISION_RADIUS;
    });

    // Se não há colisão, usar posição base com jitter pequeno
    if (collidingTexts.length === 0) {
      const jitterX = (Math.random() - 0.5) * 8;
      return { x: baseX + jitterX, y: baseY };
    }

    // Tentar 8 direções ao redor do ponto base para encontrar espaço livre
    const directions = [
      { x: 0, y: -40 },   // Acima
      { x: 40, y: -20 },  // Acima-direita
      { x: 40, y: 0 },    // Direita
      { x: 40, y: 20 },   // Abaixo-direita
      { x: 0, y: 40 },    // Abaixo
      { x: -40, y: 20 },  // Abaixo-esquerda
      { x: -40, y: 0 },   // Esquerda
      { x: -40, y: -20 }, // Acima-esquerda
    ];

    for (const dir of directions) {
      const testX = baseX + dir.x;
      const testY = baseY + dir.y;

      // Verificar se essa posição colide com algo
      const hasCollision = this.recentTexts.some(record => {
        const dist = Math.hypot(record.x - testX, record.y - testY);
        return dist < this.COLLISION_RADIUS;
      });

      if (!hasCollision) {
        return { x: testX, y: testY };
      }
    }

    // Se todas as 8 direções têm colisão, dispersar com distância crescente
    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + collidingTexts.length * 20;
    return {
      x: baseX + Math.cos(angle) * distance,
      y: baseY + Math.sin(angle) * distance,
    };
  }

  /**
   * Registra novo floating text para rastreamento de colisão
   * @param x Posição X final do texto
   * @param y Posição Y final do texto
   * @param currentTime Tempo atual do jogo (ms)
   * @param lifetime Duração que o texto será mantido no registro (ms)
   */
  public registerText(x: number, y: number, currentTime: number, lifetime: number): void {
    this.recentTexts.push({
      x,
      y,
      spawnTime: currentTime,
      lifetime,
    });
  }

  public clear(): void {
    this.recentTexts = [];
  }
}
