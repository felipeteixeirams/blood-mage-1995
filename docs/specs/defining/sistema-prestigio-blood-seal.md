# Sistema de Prestígio (Blood Seal) — Modal de UI (Concluído)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** não verificado

## Decisões a confirmar

Comportamento e escopo abaixo são propostas sem aprovação registrada; nada aqui está decidido.

1. Regras do prestígio exibidas no modal: selos (`carnage`, `dark_vitality`, `runic_flow`, `deep_vampirism`, `macabre_fortune`) e dificuldades (`normal`, `nightmare`, `inferno`).
2. Atalho `P` e o ponto de acesso ao modal (Safe House vs. botões de ação).
3. Confirmação explícita antes do reset por prestígio.

---

> **Atualizado em 2026-09-09**: O componente `PrestigeModal.tsx` foi implementado e integrado ao `App.tsx` e `ActionButtons.tsx` com suporte a navegação por gamepad, hotkey 'P', visualização de bônus passivos acumulados, alocação de Selos de Sangue, seleção de dificuldades unlocked e confirmação de ritual de sacrifício.

## Escopo Entregue

- Componente React `src/components/PrestigeModal.tsx` e suíte de testes `src/components/PrestigeModal.test.tsx`.
- Interface no padrão gótico com `ModalBase`, `Framer Motion`, `useGamepadUINavigation`, `soundEngine` e `i18n`.
- Visualização das estatísticas de prestígio, pontos de selo disponíveis e bônus acumulados de `getPrestigeModifiers()`.
- Alocação interativa de pontos em selos (`carnage`, `dark_vitality`, `runic_flow`, `deep_vampirism`, `macabre_fortune`).
- Seleção de dificuldades (`normal`, `nightmare`, `inferno`).
- Confirmação explícita no Ritual de Sacrifício executando `performPrestige()` e sincronizando o reset da instância viva do caçador.

## Referências

- `18_PRESTIGE_SYSTEM_BLOOD_SEAL.md` — spec completa da lógica e persistência
- `ROADMAP.md` — roadmap de produto
