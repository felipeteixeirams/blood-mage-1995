# 💰 Estratégia de Otimização de Tokens — Bloodmage 1995

**Objetivo:** Minimizar consumo de tokens em operações Claude Code mantendo contexto suficiente para trabalhar efetivamente.

---

## 📊 Análise de Consumo de Tokens

### Principais Culpados de Desperdício

| Item | Tokens | Status | Ação |
|------|--------|--------|------|
| `node_modules/` | ~100,000+ | 🔴 Bloqueado | `.claudeignore` → ignorado |
| `dist/` + `build/` | ~50,000 | 🔴 Bloqueado | `.claudeignore` → ignorado |
| `.git/objects/` | ~30,000 | 🔴 Bloqueado | `.claudeignore` → ignorado |
| IDE caches (`.vscode/`, `.idea/`) | ~10,000 | 🔴 Bloqueado | `.claudeignore` → ignorado |
| `pnpm-lock.yaml` (lock file) | ~15,000 | 🔴 Bloqueado | `.claudeignore` → ignorado |
| `*.log` files | ~5,000 | 🔴 Bloqueado | `.claudeignore` → ignorado |
| **Total Bloqueado** | **~210,000** | ✅ **ECONOMIZADO** | — |

### Contexto Necessário (~8,000-12,000 tokens)

| Item | Tokens | Necessário? |
|------|--------|-------------|
| `CLAUDE.md` | 2,500 | ✅ SIM (guia) |
| `docs/architecture/` (5 files) | 3,500 | ✅ SIM (padrões) |
| `docs/critical/` (2 main files) | 2,000 | ✅ SIM (anti-regressão) |
| `src/types/` & `src/store/` | 1,500 | ✅ SIM (tipos) |
| Specs de trabalho atual | 1,000 | ✅ SIM (contextual) |
| **Total Necessário** | **~10,500** | ✅ **MÍNIMO VIÁVEL** |

### Economia Total

```
Antes (.claudeignore ausente):
  Leitura inicial:        ~220,000 tokens
  Por operação:           ~80,000 tokens
  Por dia (10 ops):       ~800,000 tokens

Depois (.claudeignore ativo):
  Leitura inicial:        ~10,500 tokens  ✅ 95% redução
  Por operação:           ~8,000 tokens   ✅ 90% redução
  Por dia (10 ops):       ~80,000 tokens  ✅ 90% redução

Economia mensal (22 dias trabalho):
  220,000 - 22 * 80,000 = 1,760,000 tokens economizados
```

---

## 🎯 Estratégia por Cenário

### Cenário 1: Leitura Inicial (First Look)
**Objetivo:** Entender o projeto rápido

```
1. Agent executa
2. Lee .claudeignore (ignora node_modules/, dist/, .git/, etc)
3. Lee CLAUDE.md (~2,500 tokens)
4. Lee docs/architecture/ essencial (~2,000 tokens)
5. Pronto para trabalhar com ~4,500 tokens ✅
```

**Tempo:** ~2-3 segundos  
**Tokens:** ~4,500 (vs ~80,000 sem otimização)

---

### Cenário 2: Feature Development (Desenvolvimento de Feature)
**Objetivo:** Implementar nova feature no jogo

```
Agent flow:
1. Lê CLAUDE.md + docs/critical/ (~3,000 tokens)
2. Lê spec relevante de feature (~1,500 tokens)
3. Lê arquivos .ts de origem (~2,000 tokens)
4. Escreve código + testes
5. Roda pnpm verify (build log = descartado, não lido)
```

**Total:** ~6,500 tokens (vs ~100,000+ sem otimização)  
**Economia:** 93%

---

### Cenário 3: Code Review / Bug Fix
**Objetivo:** Revisar mudanças, corrigir bugs

```
Agent flow:
1. Lê CLAUDE.md + Critical Files (~3,000 tokens)
2. Lê diff/mudanças (~1,500 tokens)
3. Analisa código afetado (~2,000 tokens)
4. Executa testes (output ignorado)
```

**Total:** ~6,500 tokens  
**Economia:** 92%

---

### Cenário 4: Documentation Audit
**Objetivo:** Atualizar specs e documentação

```
Agent flow:
1. Lê CLAUDE.md (~2,500 tokens)
2. Lê docs/specs/ relevantes (~2,000 tokens)
3. Lê docs/architecture/ (~1,000 tokens)
4. Escreve/atualiza .md files
```

**Total:** ~5,500 tokens  
**Economia:** 94%

---

## 🔧 Como Funciona `.claudeignore`

### Padrões Bloqueados (Automático)

```
❌ node_modules/**           # Dependências compiladas
❌ dist/**                   # Build output
❌ build/**                  # Build output
❌ .git/**                   # Histórico versionado
❌ .vscode/**                # IDE config
❌ .idea/**                  # IDE config
❌ *.log                     # Logs
❌ pnpm-lock.yaml            # Lock files
❌ **/*.mp3 **/*.wav         # Áudio (samples)
❌ **/*.psd **/*.ai          # Design files
```

### Arquivos Sempre Lidos (Exceções)

```
✅ CLAUDE.md                # Guia do projeto
✅ .claude/**               # Configurações
✅ docs/**/*.md            # Documentação
✅ src/**/*.ts             # Código-fonte
✅ tsconfig.json           # Config crítica
✅ package.json            # Deps
```

---

## 📈 Métrica de Saúde

Você pode medir se `.claudeignore` está funcionando:

### Verificar Consumo Real (Estimado)

```bash
# Contar linhas de código que agents DEVEM ler
find src docs -name "*.ts" -o -name "*.tsx" -o -name "*.md" | wc -l
# Saída esperada: ~300-500 arquivos (~500KB total)
# Tokens: ~8,000-12,000

# Contar linhas de LIXO se não houvesse .claudeignore
find . -not -path './.git/*' -type f | wc -l
# Saída sem bloqueio: ~50,000+ arquivos (~2GB total)
# Tokens: ~200,000+
```

### Antes vs Depois (Telemetria)

**Sem otimização:**
- Primeira operação: ~80,000 tokens
- Operações subsequentes: ~50,000 tokens
- Padrão: "sempre relê tudo"

**Com otimização:**
- Primeira operação: ~8,000 tokens
- Operações subsequentes: ~5,000 tokens  
- Padrão: "lê incrementalmente"

---

## ⚡ Quick Wins — Se Precisar Economizar Mais

Se ainda assim consumo estiver alto, considere:

### 1. Mover Specs Antigas para `.claudeignore`
```
# Adicionar ao .claudeignore
docs/specs/rejected/**
docs/specs/archived/**
docs/specs/discovery/**
```

**Economia:** ~2,000 tokens por operação  
**Trade-off:** Agent não consegue referenciar histórico de rejeição

---

### 2. Excluir Test Snapshots
```
# Adicionar ao .claudeignore
**/*.snap
**/__snapshots__/**
```

**Economia:** ~1,000 tokens  
**Trade-off:** Agent não vê snapshot diffs

---

### 3. Lazy-Load de Assets
```
# Já bloqueado, mas confirme:
public/audio_samples/**
public/sprites/**
```

**Economia:** ~5,000 tokens  
**Trade-off:** Nenhum (assets não são código)

---

## 🚨 O QUE NÃO BLOQUEAR

**CRÍTICO:** Estes arquivos SEMPRE devem ser lidos:

```
✅ CLAUDE.md                      # Config do projeto
✅ .claude/claude.json            # Meta do projeto
✅ .claude/.claudeignore          # Config próprio
✅ src/                           # Código-fonte
✅ docs/critical/                 # Anti-regressão
✅ docs/architecture/             # Padrões
✅ package.json                   # Deps
✅ tsconfig.json                  # Tipos
✅ .eslintrc.json                 # Linting
✅ vitest.config.ts               # Testes
```

**Se bloqueador algum desses, o projeto fica inutilizável para agents.**

---

## 📋 Checklist de Segurança

Antes de fazer commit de `.claudeignore`:

- [ ] Bloqueia `node_modules/`? → Economiza ~100k tokens
- [ ] Bloqueia `dist/build/`? → Economiza ~50k tokens
- [ ] Bloqueia `.git/`? → Economiza ~30k tokens
- [ ] Bloqueia `.env` e secrets? → Segurança +1
- [ ] **MANTÉM** CLAUDE.md legível? → ✅ Deve estar em exceção
- [ ] **MANTÉM** `docs/critical/`? → ✅ Deve estar em exceção
- [ ] **MANTÉM** `src/`? → ✅ Deve estar em exceção

---

## 🔄 Manutenção Periódica

### Quando Revisar `.claudeignore`

1. **A cada 3 meses:** Audite novos diretórios (podem ter sido criados)
2. **Quando adicionar deps:** Confirme se nova pasta deve ser bloqueada
3. **Se agent reclamar:** "Arquivo lido desnecessariamente" → adicionar a `.claudeignore`

### Exemplo de Revisão

```bash
# Encontrar arquivos > 1MB desnecessários
find . -type f -size +1M ! -path './node_modules/*' ! -path './.git/*'

# Se encontrar (ex: logs, caches), adicionar ao .claudeignore
```

---

## 📞 Reporting & Feedback

Se agent relatar:
- ❌ "Não consigo ler arquivo de configuração crítico"
- ❌ "Peguei token em lixo desnecessário"

**Ação:**
1. Identifique padrão problemático
2. Ajuste `.claudeignore` ou adicione exceção
3. Commit + push
4. Próxima execução respeitará automaticamente

---

## 📊 Economia Projetada (12 meses)

```
Cenário: 5 agentes Claude, 10 operações por dia, 250 dias/ano

SEM otimização:
  5 agents × 10 ops × 250 dias × 80,000 tokens = 10 bilhões tokens/ano

COM otimização (.claudeignore):
  5 agents × 10 ops × 250 dias × 8,000 tokens = 1 bilhão tokens/ano

ECONOMIA: 90% = 9 bilhões tokens economizados 🎯
```

---

**Versão:** 1.0  
**Última atualização:** 2026-09-03  
**Status:** Ativo e documentado

