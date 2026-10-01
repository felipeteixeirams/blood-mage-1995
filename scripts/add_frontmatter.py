import os, re, sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'docs'))

# Standard keys to inject/merge into every doc's frontmatter.
# Values: agent_context, target_module, priority, status, last_updated, tags
META = {
    "README.md": ("all agents", "docs", "high", "active", "2026-08-10", ["docs", "index", "navigation"]),
    "architecture/00_OVERVIEW.md": ("all agents", "root", "high", "active", "2026-08-09", ["architecture", "overview"]),
    "architecture/01_TECH_STACK.md": ("backend, frontend", "root", "medium", "active", "2026-08-09", ["architecture", "tech-stack"]),
    "architecture/02_CODE_ORGANIZATION.md": ("all agents", "root (monorepo pnpm)", "medium", "active", "2026-08-09", ["architecture", "monorepo"]),
    "architecture/03_PHASER_PATTERNS.md": ("frontend", "artifacts/bloodmage/src/game", "high", "active", "2026-08-09", ["architecture", "phaser", "patterns"]),
    "architecture/04_STATE_MANAGEMENT.md": ("frontend, backend", "src/store", "high", "active", "2026-08-09", ["architecture", "zustand", "zod", "state"]),
    "context/BACKEND_DEVELOPER.md": ("backend", "api-server", "medium", "active", "2026-08-09", ["context", "backend"]),
    "context/FRONTEND_DEVELOPER.md": ("frontend", "artifacts/bloodmage/src", "high", "active", "2026-08-09", ["context", "frontend"]),
    "context/GAME_DESIGNER.md": ("game designer", "n/a", "high", "active", "2026-08-09", ["context", "game-design"]),
    "context/PRODUCT_MANAGER.md": ("product", "n/a", "medium", "active", "2026-08-09", ["context", "product"]),
    "context/QA_ENGINEER.md": ("qa", "root", "medium", "active", "2026-08-09", ["context", "qa"]),
    "critical/00_ANTI_REGRESSION_GUIDE.md": ("all devs", "root", "high", "active", "2026-08-09", ["critical", "anti-regression"]),
    "critical/01_CRITICAL_FILES.md": ("all devs", "root", "high", "active", "2026-08-09", ["critical", "protected-files"]),
    "critical/02_PERFORMANCE_OPTIMIZATION.md": ("frontend", "artifacts/bloodmage/src", "high", "active", "2026-08-09", ["critical", "performance"]),
    "critical/03_TESTING_GATES.md": ("all devs", "root", "high", "active", "2026-08-09", ["critical", "testing", "quality-gate"]),
    "critical/04_PERFORMANCE_METRICS.md": ("all devs", "root", "medium", "active", "2026-08-09", ["critical", "performance", "metrics"]),
    "design/00_DESIGN_PHILOSOPHY.md": ("game designer", "n/a", "medium", "active", "2026-08-09", ["design", "philosophy"]),
    "design/01_VISUAL_IDENTITY.md": ("game designer, frontend", "n/a", "medium", "active", "2026-08-09", ["design", "palette", "visual"]),
    "design/02_UI_PATTERNS.md": ("frontend, game designer", "artifacts/bloodmage/src/components", "high", "active", "2026-08-09", ["design", "ui"]),
    "design/03_ACCESSIBILITY.md": ("all devs", "root", "medium", "active", "2026-08-09", ["design", "accessibility"]),
    "features/00_DUNGEON_SIEGE_EVOLUTION.md": ("product, game designer", "n/a", "high", "active", "2026-08-09", ["features", "roadmap"]),
    "features/01_INCONSCIOUSNESS_PHASE1.md": ("backend, frontend", "artifacts/bloodmage/src/game", "high", "complete", "2026-08-10", ["features", "phase-1", "unconsciousness"]),
    "features/02_DEATH_SCREEN_PHASE2.md": ("backend, frontend", "artifacts/bloodmage/src/game", "high", "draft", "2026-08-09", ["features", "phase-2", "death-screen"]),
    "features/03_STATUS_CONDITIONS_PHASE3.md": ("game designer, backend", "artifacts/bloodmage/src/game", "medium", "draft", "2026-08-09", ["features", "phase-3", "status"]),
    "features/04_CONTINUOUS_WORLD_PHASE4.md": ("game designer, backend", "artifacts/bloodmage/src/game", "medium", "draft", "2026-08-09", ["features", "phase-4", "world"]),
    "gameplay/00_CORE_MECHANICS.md": ("all agents", "n/a", "high", "active", "2026-08-09", ["gameplay", "core-loop"]),
    "gameplay/01_INCONSCIOUSNESS_SYSTEM.md": ("backend, game designer", "artifacts/bloodmage/src/game", "high", "complete", "2026-08-10", ["gameplay", "unconsciousness"]),
    "gameplay/02_COMBAT_FEEL.md": ("game designer, frontend", "artifacts/bloodmage/src/game", "medium", "active", "2026-08-09", ["gameplay", "combat"]),
    "gameplay/03_SKILL_SYSTEM.md": ("game designer, backend", "artifacts/bloodmage/src/game", "medium", "active", "2026-08-09", ["gameplay", "skills", "hemomancy"]),
    "gameplay/04_LOOT_SYSTEM.md": ("backend, game designer", "artifacts/bloodmage/src/game", "medium", "active", "2026-08-09", ["gameplay", "loot"]),
    "gameplay/05_RECORDS_SYSTEM.md": ("frontend, backend", "src", "high", "complete", "2026-08-09", ["gameplay", "records"]),
    "integration/00_LOVABLE_INTEGRATION.md": ("all agents", "n/a", "medium", "active", "2026-08-09", ["integration", "lovable"]),
    "integration/01_VERCEL_DEPLOYMENT.md": ("devops", "vercel", "medium", "active", "2026-08-09", ["integration", "vercel", "deploy"]),
    "integration/02_MCP_SERVERS.md": ("all agents", "n/a", "medium", "active", "2026-08-09", ["integration", "mcp"]),
    "integration/03_AI_AGENT_SETUP.md": ("all agents", "n/a", "medium", "active", "2026-08-09", ["integration", "agents"]),
    "legacy/DISCOVERY_DUNGEON_SIEGE_EVOLUTION.md": ("historical", "n/a", "low", "obsolete", "2026-08-09", ["legacy", "discovery", "dungeon-siege"]),
    "reference/00_QUICK_REFERENCE.md": ("all devs", "root", "high", "active", "2026-08-09", ["reference", "quick"]),
    "reference/01_FILE_STRUCTURE.md": ("all devs", "root", "medium", "active", "2026-08-09", ["reference", "files"]),
    "reference/02_KEY_TYPES.md": ("frontend, backend", "src/types/game.ts", "high", "active", "2026-08-09", ["reference", "types"]),
    "reference/03_API_ENDPOINTS.md": ("backend, frontend", "api-server", "medium", "active", "2026-08-09", ["reference", "api"]),
    "reference/04_COMMON_TASKS.md": ("all devs", "root", "medium", "active", "2026-08-09", ["reference", "tasks"]),
    "reference/docs-documental-base-guia.md": ("all agents", "docs", "medium", "active", "2026-08-10", ["reference", "docs-guide"]),
    "reviews/AUDIT_REPORT_QUALIDADE_2026.md": ("all agents", "root", "high", "complete", "2026-08-10", ["reviews", "audit", "quality"]),
    "reviews/VALIDATION_DUNGEON_SIEGE_2026_08_10.md": ("all agents", "root", "high", "complete", "2026-08-10", ["reviews", "validation"]),
    "specs/README.md": ("product", "docs/specs", "high", "active", "2026-08-10", ["specs", "index", "status"]),
    "specs/andamento/PHASE_1_UNCONSCIOUSNESS_SPEC.md": ("backend, frontend", "artifacts/bloodmage/src/game", "high", "active", "2026-08-10", ["specs", "phase-1", "unconsciousness"]),
    "specs/andamento/SPECS_EVOLUCAO.md": ("all agents", "root", "high", "active", "2026-08-10", ["specs", "evolution"]),
    "specs/andamento/SPEC_DUNGEON_SIEGE_EVOLUTION.md": ("all agents", "root", "high", "active", "2026-08-10", ["specs", "dungeon-siege"]),
    "specs/andamento/01_FASE1_INCONSCIENCIA.md": ("backend, frontend", "artifacts/bloodmage/src/game", "high", "active", "2026-08-10", ["specs", "phase-1", "unconsciousness"]),
    "specs/finalizadas/01_RECORDS_DISPLAY.md": ("frontend, backend", "src", "medium", "complete", "2026-08-09", ["specs", "records", "complete"]),
}

def parse_fm(text):
    m = re.match(r'^---\r?\n(.*?)\r?\n---\r?\n?', text, re.DOTALL)
    if not m:
        return {}, text
    body, rest = m.group(1), text[m.end():]
    fields = {}
    current = None
    for line in body.splitlines():
        if line.startswith('  ') or line.startswith('\t'):
            if current and (fields[current] or current in fields):
                fields[current] += '\n' + line
            continue
        if ':' in line:
            k, v = line.split(':', 1)
            k = k.strip()
            v = v.strip()
            fields[k] = v
            current = k
    return fields, rest

def fmt_fm(fields, rest):
    def clean(v):
        # collapse trailing spaces from splitlines
        return v.rstrip()
    lines = []
    for k in fields:
        v = clean(fields[k])
        if '\n' in v:
            lines.append(f'{k}: {v.splitlines()[0]}')
            for sub in v.splitlines()[1:]:
                lines.append('  ' + sub.lstrip())
        else:
            lines.append(f'{k}: {v}')
    return '---\n' + '\n'.join(lines) + '\n---\n' + rest

def main():
    changed = []
    for rel, meta in META.items():
        p = os.path.join(ROOT, rel)
        if not os.path.exists(p):
            print(f'SKIP (nao existe): {rel}')
            continue
        with open(p, encoding='utf-8') as f:
            text = f.read()
        fields, rest = parse_fm(text)
        agent_context, target_module, priority, status, last_updated, tags = meta
        added = []
        if 'agent_context' not in fields:
            fields['agent_context'] = agent_context; added.append('agent_context')
        if 'target_module' not in fields:
            fields['target_module'] = target_module; added.append('target_module')
        if 'priority' not in fields:
            fields['priority'] = priority; added.append('priority')
        if 'status' not in fields:
            fields['status'] = status; added.append('status')
        if 'last_updated' not in fields:
            fields['last_updated'] = last_updated; added.append('last_updated')
        if 'tags' not in fields:
            fields['tags'] = '[' + ', '.join(tags) + ']'; added.append('tags')
        new_text = fmt_fm(fields, rest)
        if new_text != text:
            with open(p, 'w', encoding='utf-8', newline='') as f:
                f.write(new_text)
            changed.append(f'{rel} (+{",".join(added)})')
    print('\n'.join(changed) if changed else 'nenhuma mudanca')
    print(f'\ntotal alterados: {len(changed)}')

if __name__ == '__main__':
    main()
