# JULES_MIGRATION.md - Relatório de Gaps & Evolução Visual (Bloodmage 1995)

Este documento identifica os gaps técnicos do protótipo herdado do AI Studio e detalha a arquitetura de refatoração para integrar os conceitos de design do Google Stitch e o pipeline de iluminação dinâmica do Phaser 3.

---

## 1. Gaps Técnicos Identificados

### 🔴 Texturas Procedurais Sem Coesão de Design-Tokens
- **Problema**: O arquivo `textureGenerator.ts` possui valores hexadecimais de cor "hardcoded" (`#7a121d`, `#3b1254`, etc.) espalhados por todo o código de renderização do canvas. Isso viola o princípio de Single Source of Truth para o branding visual e dificulta a customização de temas.
- **Solução**: Mapear as paletas de cores do gerador de texturas para consumir um objeto de configuração unificado, cujos valores derivam diretamente dos design-tokens do Stitch (com foco em OLED Premium, Electric Blue, Vibrant Violet e Crimson).

### 🔴 Ausência de Profundidade Visual (Falta de Sombras e Luzes)
- **Problema**: O jogo é um Action-RPG 2.5D com temática sombria, porém a masmorra é totalmente plana em termos de luminosidade. Não há luz ambiente, nem contraste de claro/escuro, que é a marca registrada de clássicos como *Diablo* e *Blood*.
- **Solução**: Habilitar o pipeline de iluminação 2D do Phaser (`this.lights.enable()`) e configurar a masmorra para reagir a fontes de luz dinâmicas, criando cantos escuros e misteriosos.

### 🔴 Magias e Projéteis Sem Impacto Visual ("Juice")
- **Problema**: Os projéteis de Sangue (`proj_blood_bolt`), a Nova Flamejante (`hellfire_nova`) e outras magias causam dano mas não emitem claridade nas paredes ou inimigos próximos, reduzindo a satisfação visual e a sensação de "poder" do jogador.
- **Solução**: Vincular fontes de luz do tipo `Point Light` a projéteis e efeitos de feitiços que se expandem, dissipam e se movem em tempo real.

---

## 2. Refatoração do `textureGenerator.ts` (Tokens Stitch)

Para manter a estética retrô 16-bit com alta fidelidade, redefinimos a paleta usando a integração conceitual com o Stitch:

| Sprite / Elemento | Token Stitch | Hexadecimal Proposto | Propósito Visual |
| :--- | :--- | :--- | :--- |
| **Obsidian Background** | `neutral-dark` | `#0a0508` | Fundo absoluto OLED das masmorras. |
| **Electric Blue** | `primary` | `#00D1FF` / `#007AFF` | Alerta de IA, escudos de alma, detalhes mágicos high-tech. |
| **Vibrant Violet** | `secondary` | `#AF52DE` / `#8B5CF6` | Magia cultista, runas de portal, portais de andares. |
| **Gothic Blood Red** | `accent` / `error` | `#dc2626` / `#ff3344` | Manto do Mago de Sangue, projéteis, explosões de nova e poças. |
| **Ethereal Mint / Bone** | `tertiary` | `#10b981` / `#e2e8f0` | Gemas de XP, poeira de ossos, runas ocultas. |

---

## 3. Arquitetura da Iluminação Dinâmica no Phaser 3 (`GameScene.ts`)

A iluminação dinâmica será injetada sem comprometer a performance procedural e o suporte mobile PWA:

1. **Ativação do Pipeline**:
   - `this.lights.enable()` ativa a camada de luzes.
   - `this.lights.setAmbientColor(0x1a1118)` define uma penumbra roxa-escura e gótica sobre o mapa.

2. **Reação das Texturas (Light Pipeline)**:
   - Os sprites do jogador, monstros, projéteis, paredes e ladrilhos de chão receberão o pipeline de luzes usando `.setPipeline('Light2D')`.

3. **Fontes de Luz Dinâmicas**:
   - **Player Light**: Uma Point Light suave (`0xff3344`, alcance 180, intensidade 1.2) que segue o jogador constantemente, revelando o ambiente conforme ele caminha.
   - **Projectile Lights**: Cada `Projectile` gera e gerencia sua própria Point Light (`0xff3344` para Blood Bolt, `0xa855f7` para Energy Bolt) que o acompanha e se extingue ao colidir.
   - **Skill Pulsing**:
     - *Hellfire Nova*: Uma explosão de luz verde/vermelha que se expande radialmente e diminui de intensidade rapidamente usando transições (`tweens`).
     - *Syphon Soul*: Luzes roxas que orbitam ou drenam em direção ao player.
     - *Bone Shield*: Pequenos pontos de luz fria (`0xe2e8f0`) que orbitam com as esferas de osso.
   - **Static Light Sources**: Portais de masmorra e baús abertos emitem luzes místicas constantes.

---
*Assinado, Jules.*
