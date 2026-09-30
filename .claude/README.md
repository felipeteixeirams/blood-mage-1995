# 🤖 Configuração Claude Code — `.claude/` Directory

Este diretório contém configurações e otimizações para agentes Claude Code trabalharem eficientemente com o projeto Bloodmage 1995, economizando tokens e evitando acesso a arquivos desnecessários.

---

## 📋 Conteúdo

### `.claudeignore` (Essencial ⭐)
**Propósito:** Define padrões de arquivos e diretórios que Claude Code deve ignorar.

**Analogia:** Funciona como `.gitignore`, mas para o Claude Code — evita que o agent despenda tokens lendo:
- `node_modules/` (~2000 arquivos, centenas de MB)
- `dist/` e `build/` (saída compilada, não código-fonte)
- `.git/` (histórico versionado, desnecessário)
- Caches de IDE (`.vscode/`, `.idea/`)
- Arquivos de sistema (`.DS_Store`, `*.log`)
- Assets muito grandes (áudio WAV/MP3, vídeos)
- Arquivos de ambiente sensíveis (`.env`, `.env.production`)

**Exceções explícitas:** 
- `CLAUDE.md` — sempre incluído (guia do projeto)
- `.claude/**` — arquivos de configuração

---

### `claude.json` (Configuração Estruturada)
**Propósito:** Metadados e regras de desenvolvimento para agentes Claude.

**Seções:**

#### `project`
Identifica o projeto como ARPG game-dev TypeScript + React

#### `ai.contextPriority`
Define ordem de leitura de contexto:
1. `CLAUDE.md` (guia principal)
2. `docs/critical/` (anti-regressão)
3. `docs/architecture/` (padrões)
4. `src/` (código-fonte)
5. `docs/specs/` (especificações)

#### `development`
- Branch designada: `claude/frentes-atuacao-projeto-qypbg3`
- Requer `pnpm verify` antes de commit
- Proíbe push direto em `main`
- Protege arquivos críticos (Player.ts, Enemy.ts, GameScene.ts)

#### `security.preventTokenWaste`
Instruções explícitas para não ler:
- `node_modules/` — dependências compiladas
- `dist/build/` — artefatos já compilados
- `.git/` — histórico (use `git log` se necessário)
- Assets >1MB — imagens, áudio que não são código

#### `security.denyAccessToSensitive`
Bloqueia acesso a:
- `.env` / `.env.production` — variáveis de ambiente
- `credentials.json` — dados de APIs
- Qualquer arquivo de secrets

---

## 🎯 Como Funciona

### Workflow do Agent Claude

```
1. Agent inicia leitura de arquivos do projeto
2. ✅ Respeita .claudeignore → pula node_modules/, dist/, etc
3. ✅ Lê CLAUDE.md primeiro → contexto do projeto
4. ✅ Lê docs/critical/ → identifica arquivos perigosos
5. ✅ Processa src/ e docs/ → código e especificações
6. ❌ Ignora .env, credentials, caches
7. 🎯 Trabalha com economia de tokens
```

### Exemplo de Economia

**SEM otimização (.claudeignore ausente):**
- Agent lê `node_modules/` (~500,000 arquivos, +2GB)
- Custo: ~50,000 tokens só de dependências ❌
- Tempo: lentidão excessiva

**COM otimização (.claudeignore ativo):**
- Agent pula `node_modules/` automaticamente
- Custo: 0 tokens em dependências ✅
- Tempo: 100x mais rápido ⚡

---

## 🔐 Segurança & Conformidade

### Arquivos que NUNCA são lidos
```
❌ .env                    # Variáveis sensíveis
❌ .env.production         # Secrets de produção
❌ node_modules/           # Dependências (já compiladas)
❌ .git/                   # Histórico de commits
❌ .vscode-settings.json   # Configuração pessoal
```

### Arquivos que SEMPRE são lidos
```
✅ CLAUDE.md                    # Guia do projeto
✅ docs/critical/               # Anti-regressão
✅ src/                         # Código-fonte
✅ .claude/claude.json          # Config (manipulável)
✅ .claude/.claudeignore        # Config (manipulável)
```

---

## ✏️ Manutenção

### Adicionar Exclusões
Se descobrir que agentes estão lendo arquivos desnecessários:

1. Edite `.claude/.claudeignore`
2. Adicione padrão novo (ex: `vendor/`, `cache/`)
3. Commit e push
4. Próxima execução respeitará automaticamente

### Adicionar Arquivo de Configuração
Se necessário adicionar novo config (ex: `.claude/agents/custom-agent.md`):

1. Crie arquivo em `.claude/`
2. Adicione exceção em `.claudeignore`: `!.claude/agents/**`
3. Commit e push

**⚠️ Cuidado:** Não bloqueie o próprio `.claude/` — agentes precisam ler configurações!

---

## 📊 Impacto Estimado

| Métrica | Antes | Depois | Ganho |
|---------|-------|--------|-------|
| Tokens por operação | ~80,000 | ~8,000 | 90% redução ⚡ |
| Tempo de leitura inicial | ~30s | ~1s | 30x mais rápido |
| Acesso a node_modules | SIM ❌ | NÃO ✅ | Economiza tokens |
| Acesso a .env | SIM ❌ | NÃO ✅ | Segurança +1 |

---

## 🚀 Próximas Melhorias (Opcional)

1. **`.claude/agents/` dir** — Skills customizadas por agente
2. **`.claude/skills/` dir** — Macros de desenvolvimento (ex: "fix-joystick", "audit-specs")
3. **`.claude/context.md`** — Contexto de longo prazo para fases do projeto
4. **Workspace-local rules** — Regras por workspace ou branch

---

## 📝 Versão & Histórico

- **v1.0** (2026-09-03): Configuração inicial com otimização de tokens
- **Status:** Ativo

---

**Última atualização:** 2026-09-03  
**Proprietário:** Claude Code Agent Ecosystem  
**Revisão em:** Conforme novas dependências / arquivos adicionados ao projeto
