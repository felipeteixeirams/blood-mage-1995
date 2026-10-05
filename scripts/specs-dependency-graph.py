#!/usr/bin/env python3
"""
Gera grafo visual de dependências entre specs do Bloodmage 1995.
Analisa DEPENDENCY_MAP.yaml e gera markdown + ASCII diagram.

Usage:
  python3 scripts/specs-dependency-graph.py

Output:
  docs/specs/DEPENDENCY_GRAPH.md (markdown com visualização)
"""

import yaml
import sys
from pathlib import Path
from datetime import datetime

REPO_ROOT = Path(__file__).parent.parent
DEPENDENCY_MAP = REPO_ROOT / "docs/specs/DEPENDENCY_MAP.yaml"
OUTPUT = REPO_ROOT / "docs/specs/DEPENDENCY_GRAPH.md"

def load_map():
    """Carrega DEPENDENCY_MAP.yaml"""
    with open(DEPENDENCY_MAP, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data.get("specs", {})

def categorize_specs(specs):
    """Separa specs por status de bloqueamento"""
    blocked = {}
    ready = {}
    in_qa = {}

    for spec_id, spec_data in specs.items():
        blockers = spec_data.get("blocked_by", [])
        status = spec_data.get("status", "unknown")

        if blockers:
            blocked[spec_id] = spec_data
        elif status == "in-progress" and spec_data.get("blocking_on"):
            in_qa[spec_id] = spec_data
        else:
            ready[spec_id] = spec_data

    return blocked, ready, in_qa

def generate_dependency_tree(specs):
    """Gera árvore ASCII de dependências"""
    lines = []

    def add_spec_tree(spec_id, spec_data, indent=0, visited=None):
        if visited is None:
            visited = set()
        if spec_id in visited:
            return
        visited.add(spec_id)

        name = spec_data.get("name", "Unknown")
        status = spec_data.get("status", "?")
        status_icon = {"backlog": "📋", "in-progress": "🔨", "scope-definition": "📝", "blocked": "🔒"}.get(status, "❓")

        prefix = "  " * indent + ("└─ " if indent > 0 else "")
        lines.append(f"{prefix}{status_icon} [{spec_id}] {name}")

        blockers = spec_data.get("blocked_by", [])
        for blocker in blockers:
            blocker_id = blocker.get("spec_id")
            reason = blocker.get("reason", "Unknown")
            blocker_status = blocker.get("status", "")

            if blocker_id:
                if blocker_id in specs:
                    add_spec_tree(blocker_id, specs[blocker_id], indent + 1, visited)
            else:
                # Bloqueador externo
                blocker_icon = "⛔" if blocker_status == "waiting_decision" else "⏳"
                prefix_ext = "  " * (indent + 1) + "└─ "
                lines.append(f"{prefix_ext}{blocker_icon} BLOQUEADO: {reason}")

    for spec_id, spec_data in specs.items():
        if not spec_data.get("blocked_by"):
            add_spec_tree(spec_id, spec_data)

    return "\n".join(lines)

def generate_markdown(specs):
    """Gera markdown com todos os gráficos e tabelas"""
    blocked, ready, in_qa = categorize_specs(specs)

    md = []
    md.append("# 📊 Spec Dependency Graph — Bloodmage 1995")
    md.append("")
    md.append(f"**Última atualização:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    md.append("")
    md.append("---")
    md.append("")

    # ===== SUMÁRIO =====
    md.append("## 📈 Sumário de Status")
    md.append("")
    md.append(f"- 🔒 **Bloqueados:** {len(blocked)} specs")
    md.append(f"- ✅ **Prontos:** {len(ready)} specs")
    md.append(f"- 🔍 **Em QA/Validação:** {len(in_qa)} specs")
    md.append("")

    # ===== BLOQUEADOS =====
    if blocked:
        md.append("---")
        md.append("")
        md.append("## 🔒 Bloqueados (Não Iniciar)")
        md.append("")
        md.append("| Spec | Nome | Bloqueado Por | Status |")
        md.append("|------|------|---------------|--------|")

        for spec_id in sorted(blocked.keys()):
            spec = blocked[spec_id]
            blockers = spec.get("blocked_by", [])
            blocker_str = ""
            for b in blockers:
                if b.get("spec_id"):
                    blocker_str = f"Spec {b['spec_id']}"
                else:
                    blocker_str = "Decisão externa"
            blocker_reason = blockers[0].get("reason", "?") if blockers else "?"
            status = blockers[0].get("status", "?") if blockers else "?"

            md.append(f"| {spec_id} | {spec.get('name', '?')} | {blocker_str} | {status} |")

        md.append("")
        md.append("### Detalhes de Bloqueadores Externos")
        md.append("")
        for spec_id in sorted(blocked.keys()):
            spec = blocked[spec_id]
            if spec.get("blockers_are_external"):
                blocker_owner = spec.get("blocker_owner", "?")
                md.append(f"**[{spec_id}] {spec.get('name')}**")
                md.append(f"- Bloqueado por: {blocker_owner}")
                md.append(f"- Razão: {spec.get('blocked_by', [{}])[0].get('reason', '?')}")
                md.append("")

    # ===== PRONTOS =====
    if ready:
        md.append("---")
        md.append("")
        md.append("## ✅ Prontos para Implementar")
        md.append("")
        md.append("| Spec | Nome | Status | Readiness |")
        md.append("|------|------|--------|-----------|")

        for spec_id in sorted(ready.keys()):
            spec = ready[spec_id]
            status = spec.get("status", "?")
            gates = spec.get("readiness_gates", [])
            if gates:
                gate_status = "✅ Todos" if all(g.get("status") == "✅" for g in gates) else "⚠️ Parcial"
            else:
                gate_status = "❓ Não definido"
            md.append(f"| {spec_id} | {spec.get('name', '?')} | {status} | {gate_status} |")

        md.append("")

    # ===== EM QA =====
    if in_qa:
        md.append("---")
        md.append("")
        md.append("## 🔍 Em QA/Validação (Código Pronto, Bloqueado em Playtest)")
        md.append("")
        for spec_id in sorted(in_qa.keys()):
            spec = in_qa[spec_id]
            md.append(f"**[{spec_id}] {spec.get('name')}**")
            md.append(f"- Progresso: {spec.get('progress', '?')}")
            md.append(f"- Bloqueado em: {spec.get('blocking_on', '?')}")
            md.append(f"- Nota: {spec.get('note', 'N/A')}")
            md.append("")

    # ===== DEPENDÊNCIA TREE =====
    md.append("---")
    md.append("")
    md.append("## 🌳 Árvore de Dependências")
    md.append("")
    md.append("```")
    md.append(generate_dependency_tree(specs))
    md.append("```")
    md.append("")

    # ===== LEGENDA =====
    md.append("---")
    md.append("")
    md.append("## 🔑 Legenda")
    md.append("")
    md.append("| Ícone | Significado |")
    md.append("|-------|-------------|")
    md.append("| 📋 | Spec em Backlog |")
    md.append("| 🔨 | Spec em Desenvolvimento |")
    md.append("| 📝 | Spec em Definição de Escopo |")
    md.append("| 🔒 | Spec Bloqueada |")
    md.append("| ⛔ | Bloqueado por Decisão Externa |")
    md.append("| ⏳ | Aguardando Recurso Externo |")
    md.append("| ✅ | Pronto/Completo |")
    md.append("")

    return "\n".join(md)

def main():
    try:
        specs = load_map()
        if not specs:
            print("❌ Nenhuma spec encontrada em DEPENDENCY_MAP.yaml")
            sys.exit(1)

        md = generate_markdown(specs)

        OUTPUT.write_text(md, encoding="utf-8")
        print(f"✅ Dependency graph gerado: {OUTPUT}")
        print(f"   - {len([s for s in specs.values() if s.get('blocked_by')])} specs bloqueadas")
        print(f"   - {len([s for s in specs.values() if not s.get('blocked_by') and s.get('status') != 'in-progress'])} specs prontas")

    except FileNotFoundError:
        print(f"❌ Arquivo não encontrado: {DEPENDENCY_MAP}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Erro: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
