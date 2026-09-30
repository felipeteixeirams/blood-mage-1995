# Spec 11.08: NPCs e Interatividade de Mundo (Quests & World Interactivity)

## Objetivo
Enriquecer a navegação e a exploração em *Blood Mage 1995* com sinalização
visual reativa e interfaces integradas. A spec cobre diálogos com NPCs,
acompanhamento de missões no HUD e pulsação luminosa em monumentos interativos
como o Altar Ancestral.

## Status
🟢 COMPLETO

## O que foi Entregue
- **Interfaces de Diálogo e Missões:**
  Modais e painéis de acompanhamento em React (`DialogueModal.tsx` e
  `QuestTracker.tsx`) sincronizados com o estado da campanha.
- **Textos Flutuantes Imersivos (*Barks*):**
  Exibição de falas suspensas e notificações sobre o cenário para sinalização
  de descobertas e falas rápidas de NPCs.
- **Efeitos Luminosos de Monumentos:**
  Métodos `addAltarGlow` e `updateAltarProximity` em `LightingPolish.ts`
  adicionando luz dinâmica, halos reluzentes e animações de respiração.
- **Reatividade por Proximidade:**
  Intensificação gradual da cor vermelha do Altar Ancestral à medida que o
  personagem se aproxima da estrutura.
- **Animações de Iluminação do Cenário:**
  Efeitos de oscilação e iluminação reativa em elementos estáticos de mapa.

## Contexto de Negócio e Impacto no Gameplay
A sinalização por proximidade e a integração de diálogos flutuantes tornam a
exploração do mundo intuitiva. O pulso luminoso dos altares orienta o
jogador para pontos de interesse sem depender exclusivamente do minimapa.

## Arquitetura e Contratos de Módulos
- **Polimento de Luzes:**
  `LightingPolish.ts` fornece as funções de adição de aura e atualização por
  proximidade.
- **Controlador de Fluxo:**
  `DungeonFlowController.ts` aciona os efeitos visuais nos monumentos durante
  a geração da sala de tesouro.
- **Componentes React:**
  `DialogueModal.tsx` e `QuestTracker.tsx` renderizam as telas de interação.

## Referência no Código
- `src/components/DialogueModal.tsx` —
  Interface React para conversas com NPCs e seleções de diálogo.
- `src/components/QuestTracker.tsx` —
  Painel do HUD para rastreamento de objetivos ativos.
- `src/game/systems/LightingPolish.ts` —
  Lógica da iluminação do altar e alteração do tom por distância.
- `src/game/systems/DungeonFlowController.ts` —
  Instanciação do altar com aura luminosa.
- `src/game/scenes/GameScene.ts` —
  Verificação do sensor de proximidade e disparo do efeito visual.

## Validação e Garantia de Qualidade
- **Checagem Estática:**
  Ausência total de erros de compilação confirmada com `pnpm run typecheck`.
- **Testes Unitários:**
  Suíte de testes em `LightingPolish.test.ts` cobrindo adição de auras e
  alteração por proximidade.
- **Integridade Visual:**
  Confirmação em jogo do pulso suave dos monumentos sem artefatos visuais.

## Notas e Evoluções Futuras
- O raio estendido de sensoriamento do altar provê um aviso antecipado ao
  jogador sem interferir nas mecânicas originais de interação.
