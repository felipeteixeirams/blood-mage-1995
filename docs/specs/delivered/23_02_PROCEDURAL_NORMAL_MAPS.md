# Spec 23.02: Normal Maps Procedurais em Runtime

## Objetivo
Gerar normal maps RGB em tempo de execução para texturas procedurais de personagens, monstros, paredes e elementos interativos do *Blood Mage 1995* sem dependência de assets artísticos externos.

## Status
🟢 COMPLETO

## O que foi Entregue
- **Função Pura `generateNormalMap` (`src/utils/textureGenerator.ts`):**
  - Algoritmo Sobel-ish que calcula a derivada de luminância dos pixels do canvas base e mapeia para os canais RGB representando vetores normais (X, Y, Z).
  - Controle de força (`strength`) configurável por tipo de elemento.
- **Pipeline Híbrido de Textura com Normal Map (`addTextureWithNormalMap`):**
  - Associação automática da textura base e do normal map gerado para o pipeline Phaser Light2D.
  - Aplicado a `spr_bloodmage`, monstros de elite, paredes de masmorras (`tile_wall_brick`) e baús (`spr_chest`).

## Referência no Código
- `src/utils/textureGenerator.ts` — Implementação da geração de Normal Map e binding com o Phaser pipeline.
- `src/utils/textureGenerator.test.ts` — Suíte de testes validando dimensões e integridade dos pixels RGB gerados.

## Validação e Garantia de Qualidade
- Testes unitários cobrindo casos de borda e geração de transparência.
- Performance de boot mantida com consumo irrisório de CPU/RAM durante a inicialização.
