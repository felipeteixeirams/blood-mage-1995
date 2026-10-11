# Evolução de UI e assets externos góticos: licenças, repositórios e plano (parte 5)

**Mestre:** [discovery-ui-e-assets-externos](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial. Existe: arte física do jogador e do baú gerada por scripts do projeto (`scripts/build_bloodmage_spritesheet.cjs`, `scripts/generate_chest_assets.cjs`), fontes locais em `public/fonts/`, modal de configurações em React que hospeda a cena Phaser `SettingsScene`. Falta: tela de Créditos (nenhuma ocorrência em `src/`), registro de licenças e origem dos assets, qualquer asset de terceiros, `AssetLoader` centralizado (AES), áudio físico (parte 3).

Parte 5 de 6. Índice das partes: [README](README.md).

## Escopo
Se aprovado:
- **Regras de licença.** Preferência máxima por CC0 (sem crédito, uso comercial livre). CC-BY e OGA-BY só com crédito: nome do autor, link da licença e link da fonte. Toda licença precisa permitir uso comercial (Steam e Play Store).
- **Créditos.** Tela React de Créditos, acessível pelas Configurações ou pelo Menu Principal, listando cada asset CC-BY ou OGA-BY com autor, licença e fonte.
- **Registro de origem.** Cada asset externo tem autor, licença e URL registrados (local a definir, ver questões).
- **Fontes de busca (propostas, não verificadas):** OpenGameArt.org (termos "dark fantasy", "gothic tileset", "necromancer spell", "rpg item icons"), Itch.io (assets gratuitos) e Surt's Public Domain Treasures (CC0).
- **Plano em etapas** (cada etapa só começa com a anterior validada):
  1. Pipeline híbrido: `AssetLoader` e fallback unificado (AES) e áudio híbrido (parte 3).
  2. Protótipo: uma spritesheet física do jogador com o fallback procedural sob a mesma chave, sem queda de FPS e com teste de falha de download simulada.
  3. Migração de biomas e UI: 9-slice nos modais (parte 2); tilesets e inimigos conforme pacotes homologados e comprimidos.
  4. Auditoria: vazamento de memória (VRAM) em celulares antigos e lançamento.

## Fora de escopo
- Comprar licenças pagas ou contratar artistas (decisão de negócio).
- Escolher artistas ou pacotes específicos (as sugestões do original não foram verificadas).
- Implementar o loader (AES).

## Arquivos e contratos
- Criar: componente React de Créditos em `src/components/` (nome a definir) e arquivo de registro de assets (formato e local a definir).
- Alterar: ponto de entrada nas Configurações ou no Menu (a definir) e `docs/ui/modals-and-screens.md`.
- Atualizar no mesmo commit: `docs/ui/modals-and-screens.md` e `Verificado em`.
- Não tocar: cenas Phaser de menu.
- Contrato: nenhum asset de terceiros entra sem entrada no registro; CC-BY e OGA-BY sem crédito visível bloqueiam a integração.

Critérios, verificação e pendências: [parte 6](06-criterios-e-pendencias.md).

## Referências
- [Pipeline de arte com IA](../discovery-pipeline-de-arte-com-ia.md), [Empacotamento TWA](../feature-empacotamento-twa-play-store.md)
- [ADR 0010](../../../decisions/0010-canais-de-distribuicao.md)
