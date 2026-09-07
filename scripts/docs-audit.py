#!/usr/bin/env python3
import os
import re
import sys
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS_DIR = ROOT / 'docs'
SPECS_DIR = DOCS_DIR / 'specs'
ARCHIVE_DIR = DOCS_DIR / 'archive'

def run_audit():
    print("🔍 Running Documentation Audit (docs/)...")
    has_errors = False

    # (a) Check internal links
    broken_links = []
    for root, _, files in os.walk(DOCS_DIR):
        for f in files:
            if not f.endswith('.md'):
                continue
            fp = Path(root) / f
            try:
                content = fp.read_text(encoding='utf-8')
            except Exception as e:
                print(f"Error reading {fp}: {e}")
                continue

            # Strip code fences and inline code
            clean = re.sub(r'```.*?```', '', content, flags=re.DOTALL)
            clean = re.sub(r'`[^`]+`', '', clean)

            # Wikilinks: [[target]] or [[target|label]]
            for wl in re.findall(r'\[\[([^\]]+)\]\]', clean):
                target = wl.split('|')[0].strip().split('#')[0].strip()
                if not target or target.startswith('http') or 'XX' in target or 'caminho/arquivo' in target:
                    continue

                if target.startswith('docs/') or target.startswith('/'):
                    resolved = (ROOT / target.lstrip('/')).resolve()
                else:
                    resolved = (fp.parent / target).resolve()

                is_src_arc = (ARCHIVE_DIR in fp.parents or fp.parent == ARCHIVE_DIR)
                is_dst_arc = (ARCHIVE_DIR in resolved.parents or resolved.parent == ARCHIVE_DIR or resolved == ARCHIVE_DIR)

                # Exception: links inside archive pointing to archive
                if is_src_arc and is_dst_arc:
                    continue

                if not resolved.exists():
                    broken_links.append((str(fp.relative_to(ROOT)), 'wikilink', target, str(resolved)))

            # Markdown links: [text](path)
            for text, target in re.findall(r'\[([^\]]+)\]\(([^)]+)\)', clean):
                target = target.strip().split('#')[0].split('?')[0].strip()
                if not target or target.startswith('http') or target.startswith('mailto:') or target.startswith('#') or 'XX' in target:
                    continue

                if target.startswith('docs/') or target.startswith('/'):
                    resolved = (ROOT / target.lstrip('/')).resolve()
                else:
                    resolved = (fp.parent / target).resolve()

                is_src_arc = (ARCHIVE_DIR in fp.parents or fp.parent == ARCHIVE_DIR)
                is_dst_arc = (ARCHIVE_DIR in resolved.parents or resolved.parent == ARCHIVE_DIR or resolved == ARCHIVE_DIR)

                # Exception: links inside archive pointing to archive
                if is_src_arc and is_dst_arc:
                    continue

                if not resolved.exists():
                    broken_links.append((str(fp.relative_to(ROOT)), 'mdlink', target, str(resolved)))

    if broken_links:
        has_errors = True
        print(f"\n❌ (a) Found {len(broken_links)} broken internal links:")
        for b in broken_links:
            print(f"  - In {b[0]}: [{b[1]}] '{b[2]}' -> expected at '{b[3]}'")
    else:
        print("✅ (a) No broken internal links found.")

    # (b) Specs index audit
    spec_folders = ['in-progress', 'delivered', 'backlog', 'discovery', 'rejected']
    specs_index_file = SPECS_DIR / 'README.md'
    index_content = specs_index_file.read_text(encoding='utf-8')

    existing_spec_files = set()
    for folder in spec_folders:
        fdir = SPECS_DIR / folder
        if fdir.exists():
            for sf in fdir.glob('**/*.md'):
                existing_spec_files.add(sf.relative_to(SPECS_DIR).as_posix())

    referenced_spec_files = set()
    index_lines_broken = []

    for match in re.finditer(r'\[([^\]]+)\]\(([^)]+)\)', index_content):
        link_path = match.group(2).strip().split('#')[0]
        if not link_path or link_path.startswith('http'):
            continue
        resolved_spec = (SPECS_DIR / link_path).resolve()
        if resolved_spec.is_relative_to(SPECS_DIR):
            rel_spec = resolved_spec.relative_to(SPECS_DIR).as_posix()
            if rel_spec != 'README.md':
                referenced_spec_files.add(rel_spec)
                if not resolved_spec.exists():
                    index_lines_broken.append((match.group(0), link_path))

    unindexed_spec_files = existing_spec_files - referenced_spec_files

    if unindexed_spec_files or index_lines_broken:
        has_errors = True
        print("\n❌ (b) Specs Index Discrepancies:")
        if unindexed_spec_files:
            print(f"  Unindexed spec files ({len(unindexed_spec_files)}):")
            for u in sorted(unindexed_spec_files):
                print(f"    - docs/specs/{u}")
        if index_lines_broken:
            print(f"  Broken index references ({len(index_lines_broken)}):")
            for match_str, lpath in index_lines_broken:
                print(f"    - {match_str} -> {lpath}")
    else:
        print("✅ (b) Specs Index (docs/specs/README.md) is 100% in sync.")

    # (c) Byte-identical duplicate files in docs/specs/
    hashes = {}
    duplicates = []

    for sf in SPECS_DIR.glob('**/*.md'):
        if sf.is_file():
            h = hashlib.sha256(sf.read_bytes()).hexdigest()
            rel_p = sf.relative_to(ROOT).as_posix()
            if h in hashes:
                duplicates.append((hashes[h], rel_p))
            else:
                hashes[h] = rel_p

    if duplicates:
        has_errors = True
        print(f"\n❌ (c) Found {len(duplicates)} byte-identical duplicate pairs in docs/specs/:")
        for f1, f2 in duplicates:
            print(f"  - {f1} <==> {f2}")
    else:
        print("✅ (c) No byte-identical duplicates found in docs/specs/.")

    if has_errors:
        print("\n⚠️ Audit completed with findings requiring correction.")
        sys.exit(1)
    else:
        print("\n🎉 Audit passed! All checks clean.")
        sys.exit(0)

if __name__ == '__main__':
    run_audit()
