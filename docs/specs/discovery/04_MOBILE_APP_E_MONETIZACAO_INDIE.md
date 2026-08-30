---
agent_context: release-engineer, product-manager, game-designer, backend
target_module: docs/specs/backlog
priority: medium
status: discovery
doc_type: discovery
last_updated: 2026-08-30
tags: [specs, discovery, mobile, monetizacao, marketing, capacitor, pwa, stores]
---

# 📱 [DISCOVERY] Mobile App, Wrapper Nativo e Monetização Saudável

> 💡 **TIPO: DISCOVERY & EXPLORAÇÃO DE MERCADO (Backlog)**
>
> **Status Atual da Plataforma:** A plataforma mobile principal e ativa do projeto é o **PWA Offline-First** (concluído na Spec 15), que já provê suporte offline completo, baixo consumo de armazenamento e execução direta no navegador mobile.
>
> **Propósito deste Discovery:** Avaliar caminhos futuros para distribuição em lojas oficiais (Google Play Store e Apple App Store) via wrappers nativos modernos (ex: CapacitorJS ou TWA), além de modelos de monetização ética não-intrusiva adequados para um desenvolvedor indie.

---

## 1. Contexto & Objetivos

Bloodmage 1995 já possui suporte parcial a PWA (Progressive Web App) e scripts automatizados de empacotamento TWA (Trusted Web Activity). No entanto, para alcançar o máximo potencial em plataformas móveis nativas e oferecer um aplicativo estável, fluido e totalmente integrável com serviços das lojas (notificações push, conquistas das lojas, faturamento), propomos a migração estruturada para um empacotador nativo de alto nível, juntamente com estratégias de monetização e marketing de baixo orçamento apropriadas para um criador solo de jogos indies.

### Objetivos Principais:
1.  **Wrapper Nativo de Alta Performance:** Substituir dependências web por um container nativo moderno que acesse as APIs de hardware (GPU, vibração, ciclo de vida do app) sem gargalos de desempenho.
2.  **Monetização Não-Intrusiva ("Fair-Play Monetization"):** Gerar receita sustentável para cobrir custos de desenvolvimento sem provocar reações negativas ou ódio nos jogadores, mantendo o jogo livre de mecânicas pay-to-win.
3.  **Lançamento e Marketing Orgânico:** Estratégias práticas para um desenvolvedor solo divulgar o jogo sem depender de grandes verbas publicitárias.

---

## 2. Wrapper Nativo: Capacitor vs. Cordova

Para empacotar a build base (Vite + React 19 + Phaser) para Android (`.apk` / `.aab`) e iOS, propomos o uso do **CapacitorJS** (criado pela equipe do Ionic) em preferência ao clássico Apache Cordova.

### Comparativo Técnico:

| Critério | Cordova | Capacitor (Recomendado) |
|---|---|---|
| **Arquitetura** | Usa plugins com injeção dinâmica de código, propensa a quebras em atualizações do sistema operacional. | Código nativo gerenciado diretamente pelo desenvolvedor. Suporta o ecossistema moderno do iOS (Swift) e Android (Kotlin). |
| **Integração com Vite** | Requer configurações complexas de caminhos relativos e scripts adicionais. | Integração nativa de uma linha apontando para a pasta `dist/` do Vite. |
| **Performance de WebView** | Utiliza WebViews do sistema, às vezes com overheads de renderização e inicialização lenta. | Utiliza containers nativos ultra-otimizados com WKWebView (iOS) e Android System WebView moderno de alto desempenho. |
| **Acesso a Hardware** | APIs legadas de vibração e orientação física. | Acesso direto a APIs modernas de feedback tátil avançado (`Haptics`) e bloqueio nativo de orientação gráfica. |

### Fluxo de Build Proposto com Capacitor:
1.  O desenvolvedor executa o build de produção do jogo: `pnpm run build`.
2.  A pasta resultante `dist/` é sincronizada com as pastas nativas de cada plataforma: `npx cap sync`.
3.  O desenvolvedor abre o projeto no Android Studio ou Xcode: `npx cap open android` ou `npx cap open ios`.
4.  Gera o pacote final de produção assinado e otimizado direto nas IDEs oficiais.

---

## 3. Estratégia de Monetização "Fair-Play"

Como um desenvolvedor solo independente, a confiança e o apoio da comunidade são os bens mais valiosos. Portanto, a monetização do Bloodmage 1995 deve ser **justa, opcional e transparente**.

Mapeamos três frentes de receita não-agressivas estruturadas por ordem de aceitação e relevância:

```
     [ Monetização Bloodmage 1995 ]
                   │
      ┌────────────┼────────────┐
      ▼            ▼            ▼
[Nível C]    [Nível B]    [Nível A]
Anúncios     Passe de     Cosméticos
Premiados   Sobrevivência   Premium
 (Opt-In)    (Temporada)   (Skins/FX)
```

### 🟩 Nível C: Anúncios Premiados Voluntários (Rewarded Ads) — Alta Aceitação
*   **Conceito:** O jogo **nunca** exibirá anúncios forçados (pop-ups intermitentes, banners tapando a tela de combate ou vídeos que interrompem o fluxo de sobrevivência). Em vez disso, haverá "Anúncios Premiados Opt-in" baseados em escolhas narrativas na Safe Town (Room 0).
*   **Mecânica de Jogo:** Na Safe Town, o jogador pode interagir com o NPC *Clérigo* e assistir voluntariamente a um anúncio em vídeo de 15–30 segundos para receber a **Bênção da Catedral** (regeneração leve e temporária de HP, ou um bônus de 10% no ganho de Cristais de Sangue na próxima corrida).
*   **Vantagem:** O jogador sente que está apoiando ativamente o desenvolvedor voluntariamente em troca de um benefício claro de conveniência, eliminando qualquer frustração com anúncios invasivos.

### 🟨 Nível B: Passe de Sobrevivência (Survival Pass) — Retenção de Médio Prazo
*   **Conceito:** Uma trilha sazonal de conquistas e objetivos temáticos ao longo de um mês ou trimestre.
*   **Funcionamento:** Contém duas trilhas paralelas:
    *   *Trilha Gratuita:* Desbloqueia Cristais de Sangue normais, curativos e pequenas quantias de ouro de jogo ao completar os contratos diários/semanais.
    *   *Trilha Premium (Valor Acessível, ex: $2 a $5):* Oferece bônus cosméticos exclusivos como efeitos rúnicos ao andar, skins exclusivas de armas e títulos góticos permanentes que não concedem nenhum tipo de bônus numérico nos combates (zero pay-to-win).

### 🟥 Nível A: Loja de Cosméticos e Cristais de Sangue Premium
*   **Conceito:** Uma loja direta no menu inicial e no vilarejo para compra de Cristais de Sangue adicionais com dinheiro real.
*   **Funcionamento:** Esses cristais servem puramente para desbloquear cosméticos avançados na loja (Skins de Corpo, Visuais de Armas e Paletas de Cores de Sangue). Nenhuma arma com atributos superiores ou itens de poder de combate reais podem ser comprados com dinheiro real. O progresso depende estritamente da habilidade do jogador.

---

## 4. Plano de Marketing e Lançamento Orgânico (Solo Dev)

Como um desenvolvedor com baixo orçamento de anúncios para marketing de massa, as ações de divulgação devem ser cirúrgicas, focadas em comunidades de nicho apaixonadas pelo gênero.

### Frentes Recomendadas:
1.  **Marketing de Comunidade (Reddit & Discord):**
    *   Postar atualizações periódicas de desenvolvimento ("Devlogs") no Reddit em subreddits como `r/gamedev`, `r/playmygame`, `r/PhaserJS`, `r/androidgaming` e `r/iosgaming`.
    *   Mostrar GIFs de alta qualidade do "combate pesado", desmembramentos e a iluminação dinâmica. Jogadores retrô de ARPGs (Diablo 1, Diablo 2, Dead Frontier) adoram estética grimdark.
2.  **Campanha com Micro-Influenciadores de Jogos Retro/Indie:**
    *   Criar uma lista de YouTubers e Streamers da Twitch que focam em ARPGs clássicos, Roguelikes de sobrevivência e jogos Pixel Art com canais de 5 mil a 50 mil inscritos.
    *   Enviar chaves de acesso antecipado gratuitas (ou o link do PWA instalável de testes) com uma mensagem personalizada e sincera explicando que o jogo foi feito por um desenvolvedor solo fã de Diablo 1 e Dungeon Siege.
3.  **Construção de uma Lista de Desejos (Wishlist) Antecipada:**
    *   Lançar uma página de "Pré-Registro" na Google Play Store o quanto antes. O Google Play prioriza aplicativos com pré-registro ativo, garantindo visibilidade orgânica inicial no algoritmo de recomendação de lançamentos.

---

## Referências

- [[docs/specs/propostas/05_SISTEMA_DE_SKINNING_E_CAMADAS_DINAMICAS.md]] — Conexão com o sistema de cosméticos das skins
- [[docs/deployment/FASE5_EMPACOTAMENTO_COMPLETO.md]] — Configurações existentes de PWA/TWA

## Registro de mudanças

| Data | O que mudou | Autor |
|------|-------------|-------|
| 2026-08-11 | Criação da proposta de empacotamento, monetização e marketing móvel | Jules (Google AI) |
