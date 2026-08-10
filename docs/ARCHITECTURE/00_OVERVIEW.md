# 🏛️ Arquitetura Geral - Visão Geral

Este documento descreve a visão geral da arquitetura de software adotada no Bloodmage 1995.

## 🔗 Visão Arquitetural Híbrida
O projeto utiliza um design de **UI Híbrido**:
- **Phaser 3/4**: Responsável pelo motor de jogo real-time, simulação física de corpos, colisões (Arcade Physics), renderização de partículas de sangue, geração procedimental do calabouço e animações do grid de jogo.
- **React 19**: Lida com a renderização de componentes HUD estáticos de alta definição (HUD, Árvore de Talentos, Painel de Inventário, Menu Principal, Tela de Configurações, Observability overlays), evitando que o Phaser precise gerenciar geometrias complexas de UI.

```
       ┌────────────────────────────────────────┐
       │               React HUD                │
       └───────────────────▲────────────────────┘
                           │ (Event Broker / Zustand)
       ┌───────────────────▼────────────────────┐
       │             Phaser Canvas              │
       └────────────────────────────────────────┘
```
