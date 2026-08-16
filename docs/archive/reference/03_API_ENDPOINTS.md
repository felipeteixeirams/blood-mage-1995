---
agent_context: backend, frontend
target_module: api-server
priority: medium
status: active
last_updated: 2026-08-09
tags: [reference, api]
---
# 🔌 Endpoints da API

Embora Bloodmage 1995 processe toda a jogabilidade localmente no cliente, a API em Express (`@workspace/api-server`) disponibiliza alguns endpoints básicos para manutenção de dados.

## 🔌 Tabela de Endpoints

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| **GET** | `/api/health` | Verifica a integridade e tempo de atividade do servidor |
| **GET** | `/api/scores` | Retorna as melhores pontuações globais validadas (opcional) |
| **POST** | `/api/scores` | Registra uma nova pontuação autenticada (futura expansão) |
