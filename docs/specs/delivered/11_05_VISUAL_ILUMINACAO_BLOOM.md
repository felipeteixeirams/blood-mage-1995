# Spec 11.05: Iluminação 2D e Bloom FX (Lighting & Spell VFX)

## Objetivo
Ativar e expandir a iluminação dinâmica WebGL e os efeitos de aura reluzente
(*Bloom/Glow FX*) em *Blood Mage 1995*. O sistema destaca feitiços, orbes de
energia, itens valiosos e inimigos de elite através de projeção de luzes
pontuais e halos brilhantes.

## Status
🟢 COMPLETO

## O que foi Entregue
- **Pipeline de Iluminação 2D (`Light2D`):**
  Habilitação das luzes nativas do Phaser no `LightingSystem.ts`, com
  escurecimento da iluminação ambiente global para valor sombrio gótico (`#1a1a2e`).
- **Fontes de Luz Pontual Dinâmicas:**
  Emissão de luz (`PointLight`) com raio, cor e atenuação amarrados ao jogador,
  projéteis (`blood_bolt`) e orbes no chão.
- **Efeito de Brilho Luminous (*Glow FX*):**
  Filtro procedural aplicado via `LightingPolish.ts` nos sprites de itens
  raros+, projéteis mágicos, portais e monstros de tier elevado.
- **Gerenciamento de Performance Mobile:**
  Teto ativo (`MAX_ACTIVE_BLOOM_TARGETS = 16`) respeitando as opções de
  acessibilidade e redução de efeitos do usuário.
- **Garantia de Idempotência:**
  Limpeza e reaplicação limpa de filtros em objetos reciclados através do
  `ObjectPool` para evitar acúmulo de halos.

## Contexto de Negócio e Impacto no Gameplay
A iluminação dinâmica contrasta a escuridão dos cenários com o brilho
intenso das magias de sangue. O uso de halos reluzentes para itens raros e
inimigos elites melhora instantaneamente a identificação de alvos e recompensas.

## Arquitetura e Contratos de Módulos
- **Polimento de Luzes:**
  `LightingPolish.ts` encapsula a aplicação de iluminação e filtros de
  brilho em itens e entidades.
- **Sistema de Iluminação Core:**
  `LightingSystem.ts` gerencia o pipeline `Light2D` e a cor ambiente da cena.
- **Efeitos de Pós-Processamento:**
  `PostFXSystem.ts` provê suporte a pipelines globais de câmera e ajustes de cor.

## Referência no Código
- `src/game/systems/LightingPolish.ts` —
  Lógica de criação de auras luminosas, teto de alvos e controle de luzes.
- `src/game/systems/LightingPolish.test.ts` —
  Testes unitários do controle de limites, raridade de itens e configurações.
- `src/game/systems/LightingSystem.ts` —
  Configuração da iluminação ambiente e ativação do pipeline Light2D.
- `src/game/systems/PlayerSkillSystem.ts` —
  Associação de emissores de luz ao lançamento de habilidades mágicas.
- `src/game/systems/PostFXSystem.ts` —
  Gerenciamento de efeitos visuais pós-processamento da câmera.

## Validação e Garantia de Qualidade
- **Checagem Estática:**
  Compilação 100% bem-sucedida executando `pnpm run typecheck`.
- **Testes Unitários:**
  Suíte em `LightingPolish.test.ts` cobrindo adição de brilho por raridade,
  isolamento do cajado e respeito às flags de acessibilidade.
- **Desempenho:**
  Testes de carga confirmando manutenção dos 60 FPS com teto de 16 alvos.

## Notas e Evoluções Futuras
- A interface de usuário (HUD e menus) permanece isenta do pipeline de
  iluminação, garantindo clareza total das informações.
