# 🛠️ Contexto do Desenvolvedor Backend

Este documento serve como guia para os engenheiros focados no backend e na API do Bloodmage 1995.

## 🎯 Objetivo Geral
Embora o Bloodmage 1995 seja um RPG de ação principalmente focado no lado do cliente (com persistência via `localStorage`), o projeto inclui uma API em Express 5 (`@workspace/api-server`) para suportar recursos online como validação, registro de dados agregados e persistência estendida opcional.

## ⚙️ Principais Responsabilidades
1. **Garantir a integridade das APIs**:
   - Manter os padrões de segurança defensiva em profundidade (HTTP headers, desabilitar `X-Powered-By`).
   - Validar estritamente todas as requisições usando esquemas Zod (`@workspace/api-zod`).
2. **Database & Drizzle**:
   - Integrar e evoluir o esquema de dados do PostgreSQL usando o Drizzle ORM (`@workspace/db`).
3. **CORS e Origin Limiting**:
   - Manter filtros de origens seguros baseados em variáveis de ambiente (`ALLOWED_ORIGINS`).
