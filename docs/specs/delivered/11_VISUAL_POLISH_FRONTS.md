# Spec 11: Visual Polish & VFX Fronts (Índice Mestre)

## Objetivo Geral
Estruturar e gerenciar o polimento visual e os efeitos gráficos (VFX) do *Blood Mage 1995* através de técnicas orientadas a código (Shaders, Partículas, Iluminação Dinâmica e Áudio Procedural). O foco é elevar a qualidade estética do projeto a um patamar *AAA indie* sem introduzir novos assets físicos complexos, preservando a performance e a infraestrutura híbrida de renderização.

---

## Mapeamento de Frentes e Especificações Satélites

A implementação detalhada, contratos de código, referências e critérios de aceite foram descentralizados para especificações satélites dedicadas. Todas as 8 frentes foram concluídas e validadas na base de código.

| # | Frente de Polimento | Arquivo Satélite | Status |
|---|---------------------|------------------|--------|
| 1 | Geração Orgânica de Dungeon | [`11_01_VISUAL_DUNGEON_GENERATION.md`](./11_01_VISUAL_DUNGEON_GENERATION.md) | 🟢 COMPLETO |
| 2 | Atmosfera e Névoa Volumétrica | [`11_02_VISUAL_ATMOSFERA_NEBLINA.md`](./11_02_VISUAL_ATMOSFERA_NEBLINA.md) | 🟢 COMPLETO |
| 3 | Decals de Sangue e Solo | [`11_03_VISUAL_DECALS_SANGUE.md`](./11_03_VISUAL_DECALS_SANGUE.md) | 🟢 COMPLETO |
| 4 | Gore, Hit-Stop e Character FX | [`11_04_VISUAL_GORE_HIT_STOP.md`](./11_04_VISUAL_GORE_HIT_STOP.md) | 🟢 COMPLETO |
| 5 | Iluminação 2D e Bloom FX | [`11_05_VISUAL_ILUMINACAO_BLOOM.md`](./11_05_VISUAL_ILUMINACAO_BLOOM.md) | 🟢 COMPLETO |
| 6 | Pitch Shifting e Drones de Áudio | [`11_06_VISUAL_AUDIO_PITCH_DRONES.md`](./11_06_VISUAL_AUDIO_PITCH_DRONES.md) | 🟢 COMPLETO |
| 7 | Palette Swap e Cosméticos | [`11_07_VISUAL_PALETTE_SWAP.md`](./11_07_VISUAL_PALETTE_SWAP.md) | 🟢 COMPLETO |
| 8 | NPCs e Interatividade de Mundo | [`11_08_VISUAL_NPCS_INTERATIVIDADE.md`](./11_08_VISUAL_NPCS_INTERATIVIDADE.md) | 🟢 COMPLETO |

---

## Validação e Conformidade Geral
- **Compilação e Tipagem:** Projeto 100% em conformidade estrita com o compilador TypeScript (`pnpm run typecheck`).
- **Suíte de Testes:** Cobertura automatizada em Vitest (`pnpm test`) abrangendo algoritmos de dungeon, emissão de partículas, filtros de iluminação, modulação de áudio e trocas cosméticas.
- **Desempenho e Dispositivos Móveis:** Manutenção da taxa alvo de 60 FPS com limites ativos para emissores de luz, partículas e reciclagem FIFO de decals.
