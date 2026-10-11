# 0010 — Distribuição: PWA, depois TWA/Play Store e Steam

**Mestre:** [decisions](README.md)
**Status:** Aprovada
**Proposta por:** Claude (Sonnet 5.5), 2026-10-10
**Aprovada por:** Felipe Teixeira, 2026-10-11, conforme conversa de 2026-10-11 ("sim aprovo, só cuidado para as alterações não afetarem a disposição que a aplicação funciona em produção")

## Contexto
Documentos antigos tratavam como plano lançar primeiro como link PWA e depois em Play Store (TWA) e Steam (Electron). O que existe no repositório:

- **PWA:** `vite-plugin-pwa` em `vite.config.ts` (`registerType: 'prompt'`, `generateSW`), `public/manifest.webmanifest`, registro do service worker em `main.tsx` e `App.tsx`. Divergências: o manifest referencia arquivos ausentes em `public/` (`icon-192-maskable.png`, `icon-96.png`, `icon-96-trophy.png`, `screenshot-1.png`, `screenshot-2.png`), a rota `/share` do `share_target` não existe em `src/`, e `PWAInstallBanner.tsx` não é montado em lugar nenhum.
- **TWA:** só `scripts/build-twa.sh` (Bubblewrap); não há `twa-manifest.json`.
- **Steam:** só `scripts/build-steam.sh`; não há `electron-builder.yml`, `main.js` nem dependência `electron`.
- Não há política de privacidade no código.

Não há decisão registrada sobre canais, ordem ou prazos.

## Opções
| Opção | Prós | Contras |
|---|---|---|
| A. Só PWA (web) por ora; corrigir manifest e banner de instalação | Menor custo; já funciona em Vercel | Sem alcance de loja |
| B. PWA, depois TWA/Play Store | Alcance Android | Conta de desenvolvedor, política de privacidade, classificação etária, assinatura |
| C. PWA + Steam (Electron) | Público de PC | Empacotamento Electron, conta Steam, build por SO |
| D. Os três em sequência | Máximo alcance | Maior custo e manutenção |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Config PWA | `vite.config.ts` (`VitePWA`) | 2026-10-10 |
| Orientação, atalhos e `share_target` do manifest | `public/manifest.webmanifest` | 2026-10-10 |
| Arquivos `twa-manifest.json`, `electron-builder.yml`, `main.js` ausentes; sem `electron` no `package.json` | `ls`; `grep '"electron' package.json` | 2026-10-10 |
| Scripts de TWA/Steam existem | `scripts/build-twa.sh`, `scripts/build-steam.sh` | 2026-10-10 |

## Suposições (não verificadas)
- Que os scripts de TWA e Steam funcionam (não foram executados).
- Que o jogo está ou não publicado em alguma loja (sem evidência no repositório).
- Exigências atuais de Play Store/Steam (não consultadas em fonte oficial).

## Recomendação
**Opção A** agora: é o único canal com implementação real; os demais dependem de decisões de negócio (contas, custo, privacidade) que são suas.

## Decisão
Opção A: só PWA por ora; TWA/Play Store e Steam ficam fora de escopo até nova decisão. Restrição: nenhuma mudança no que roda em produção (Vercel, PWA, service worker) por conta desta decisão.

## Consequências
- Se A: corrigir os arquivos ausentes do manifest, a rota `/share` (ou remover `share_target`) e montar ou remover `PWAInstallBanner`.
- Se B/C/D: specs próprias, política de privacidade, ADR de conta e dados (0011) e de monetização (0012).
