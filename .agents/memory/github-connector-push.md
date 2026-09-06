---
name: GitHub connector push
description: Fallback operacional para publicar commits quando o remoto HTTPS não aceita as credenciais disponíveis.
---

Quando o push Git HTTPS falhar por autenticação, a conexão GitHub gerenciada pode publicar a cadeia de commits via Git Database API sem expor credenciais.

**Why:** O ambiente pode ter a conexão OAuth disponível mesmo quando o helper Git local não possui credenciais aceitas pelo remoto HTTPS.

**How to apply:** Para consultar a branch use `GET /repos/{owner}/{repo}/git/ref/heads/{branch}`; para atualizar a referência use `PATCH /repos/{owner}/{repo}/git/refs/heads/{branch}` (com `refs` no plural). Confirme o SHA remoto antes de atualizar e valide a referência depois.