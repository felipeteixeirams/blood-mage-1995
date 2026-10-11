#!/usr/bin/env node
// Verifica a estrutura da base documental (docs/). Sem dependências.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join, dirname, resolve, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const docs = join(root, 'docs')
const errors = []
const rel = (p) => relative(root, p).split(sep).join('/')
const err = (m) => errors.push(m)

const listFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listFiles(join(dir, e.name)) : [join(dir, e.name)],
  )

const stripCode = (t) => t.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')

/** Destinos relativos (sem âncora) dos links markdown de um arquivo. */
function linksOf(file) {
  const text = stripCode(readFileSync(file, 'utf8'))
  const out = []
  for (const m of text.matchAll(/\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
    let t = m[1]
    if (/^([a-z][a-z0-9+.-]*:|#|\/\/)/i.test(t)) continue
    t = t.split('#')[0].split('?')[0]
    if (!t) continue
    try { t = decodeURIComponent(t) } catch {}
    out.push(t)
  }
  return out
}

const linkedFrom = (readme) =>
  new Set(linksOf(readme).map((t) => resolve(dirname(readme), t).replace(/[\\/]+$/, '')))

// (a) só docs/README.md no primeiro nível
const top = readdirSync(docs, { withFileTypes: true })
for (const e of top) {
  if (e.isFile() && e.name !== 'README.md') err(`(a) arquivo fora de categoria em docs/: ${rel(join(docs, e.name))}`)
}
const categories = top.filter((e) => e.isDirectory()).map((e) => e.name)

// (b) mestre por categoria e arquivos listados
const stages = ['backlog', 'in-progress', 'defining']
const rootLinked = existsSync(join(docs, 'README.md')) ? linkedFrom(join(docs, 'README.md')) : new Set()
for (const cat of categories) {
  const dir = join(docs, cat)
  const master = join(dir, 'README.md')
  // (c) categoria linkada no bootstrap
  const catLinked = [...rootLinked].some((p) => p === dir || p.startsWith(dir + sep))
  if (!catLinked) err(`(c) categoria não linkada em docs/README.md: docs/${cat}/`)
  if (!existsSync(master)) { err(`(b) falta README.md mestre em docs/${cat}/`); continue }
  const linked = linkedFrom(master)
  const recursive = cat === 'specs'
  const files = recursive
    ? listFiles(dir)
    : readdirSync(dir, { withFileTypes: true }).filter((e) => e.isFile()).map((e) => join(dir, e.name))
  for (const f of files) {
    if (f === master) continue
    const inStage = recursive && stages.some((s) => f.startsWith(join(dir, s) + sep))
    // em specs: arquivos de estágio são verificados contra o README do estágio
    let owner = master, set = linked
    if (inStage) {
      const stageDir = join(dir, stages.find((s) => f.startsWith(join(dir, s) + sep)))
      owner = join(stageDir, 'README.md')
      if (f === owner) continue
      if (!existsSync(owner)) { err(`(b) falta README.md em ${rel(stageDir)}/`); continue }
      set = linkedFrom(owner)
    }
    if (!set.has(f)) err(`(b) ${rel(f)} não é linkado em ${rel(owner)}`)
  }
}

// (d) links relativos quebrados
const mdFiles = listFiles(docs).filter((f) => f.endsWith('.md'))
for (const f of ['README.md', 'CLAUDE.md']) if (existsSync(join(root, f))) mdFiles.push(join(root, f))
for (const f of mdFiles) {
  for (const t of linksOf(f)) {
    if (!existsSync(resolve(dirname(f), t))) err(`(d) link quebrado em ${rel(f)}: ${t}`)
  }
}

// (e) critérios de aceite nas specs prontas
for (const stage of ['backlog', 'in-progress']) {
  const dir = join(docs, 'specs', stage)
  if (!existsSync(dir)) continue
  for (const f of listFiles(dir).filter((f) => f.endsWith('.md') && !f.endsWith(sep + 'README.md'))) {
    const text = readFileSync(f, 'utf8')
    const m = text.match(/^## Critérios de aceite[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m)
    if (!m) err(`(e) ${rel(f)} sem seção "## Critérios de aceite"`)
    else if (!/^\s*[-*]\s+\*\*[A-Za-z]+-\d+\*\*\s/m.test(m[1]))
      err(`(e) ${rel(f)}: seção de critérios sem item no formato "- **ID-n** ..."`)
  }
}

// (f) cabeçalho de confiança nos documentos de referência
const refCats = ['architecture', 'engineering', 'gameplay', 'operations', 'product', 'testing', 'ui']
for (const cat of refCats) {
  const dir = join(docs, cat)
  if (!existsSync(dir)) continue
  for (const f of listFiles(dir).filter((f) => f.endsWith('.md') && !f.endsWith(sep + 'README.md'))) {
    const head = readFileSync(f, 'utf8').split('\n').slice(0, 15).join('\n')
    if (!/^\*\*Status:\*\*\s+(verificado|não verificado|histórico)\b/m.test(head))
      err(`(f) ${rel(f)} sem "**Status:** verificado | não verificado | histórico" nas primeiras linhas`)
    if (!/^\*\*Verificado em:\*\*\s+\S/m.test(head))
      err(`(f) ${rel(f)} sem "**Verificado em:** AAAA-MM-DD | —" nas primeiras linhas`)
  }
}

// (g) nomes de arquivo em kebab-case (exceto README.md)
for (const f of listFiles(docs)) {
  const name = f.split(sep).pop()
  if (name !== 'README.md' && !/^[a-z0-9]+(-[a-z0-9]+)*\.[a-z]+$/.test(name))
    err(`(g) nome fora de kebab-case: ${rel(f)}`)
}

// (h) specs: estágio e aprovação do responsável
for (const stage of stages) {
  const dir = join(docs, 'specs', stage)
  if (!existsSync(dir)) continue
  for (const f of listFiles(dir).filter((f) => f.endsWith('.md') && !f.endsWith(sep + 'README.md'))) {
    const head = readFileSync(f, 'utf8').split('\n').slice(0, 12).join('\n')
    if (!/^\*\*Estágio:\*\*/m.test(head)) err(`(h) ${rel(f)} sem "**Estágio:**" no cabeçalho`)
    const appr = head.match(/^\*\*Aprovação do responsável:\*\*(.*)$/m)
    if (!appr) { err(`(h) ${rel(f)} sem "**Aprovação do responsável:**" no cabeçalho`); continue }
    if (stage !== 'defining' && !/aprovada por/i.test(appr[1]))
      err(`(h) ${rel(f)} está em ${stage}/ sem aprovação ("aprovada por <nome> em <data>")`)
  }
}

// (i) cada documento (exceto README.md) aponta de volta para o mestre da sua pasta
for (const f of listFiles(docs).filter((f) => f.endsWith('.md') && !f.endsWith(sep + 'README.md'))) {
  const master = resolve(dirname(f), 'README.md')
  const head = readFileSync(f, 'utf8').split('\n').slice(0, 15).join('\n')
  const ok = linksOf(f).some((t) => resolve(dirname(f), t) === master) && /^\*\*Mestre:\*\*/m.test(head)
  if (!ok) err(`(i) ${rel(f)} sem "**Mestre:** [pasta](README.md)" nas primeiras linhas`)
}

// (j) o registro de ADRs concorda com o status dentro de cada ADR
const registry = join(docs, 'decisions', 'README.md')
if (existsSync(registry)) {
  const reg = readFileSync(registry, 'utf8')
  for (const f of listFiles(join(docs, 'decisions')).filter((f) => /\/\d{4}-[^/]+\.md$/.test(f.split(sep).join('/')))) {
    const num = f.split(sep).pop().slice(0, 4)
    const inFile = readFileSync(f, 'utf8').match(/^\*\*Status:\*\*\s*\**\s*([A-Za-zÀ-ú]+)/m)
    const row = reg.split('\n').find((l) => l.includes(`[${num}]`))
    const inReg = row && row.match(/\|\s*\*\*([A-Za-zÀ-ú]+)\*\*/)
    if (!inFile) err(`(j) ${rel(f)} sem "**Status:**" no cabeçalho`)
    else if (!row) err(`(j) ADR ${num} ausente do registro em docs/decisions/README.md`)
    else if (!inReg || inReg[1].toLowerCase() !== inFile[1].toLowerCase())
      err(`(j) ADR ${num}: status no registro (${inReg ? inReg[1] : '?'}) difere do arquivo (${inFile[1]})`)
  }
}

// aviso (não bloqueante): "Verificado em" com mais de 30 dias
const warnings = []
const today = Date.now()
for (const f of listFiles(docs).filter((f) => f.endsWith('.md'))) {
  const m = readFileSync(f, 'utf8').split('\n').slice(0, 15).join('\n').match(/^\*\*Verificado em:\*\*\s*(\d{4}-\d{2}-\d{2})/m)
  if (m && (today - Date.parse(m[1])) / 86400000 > 30) warnings.push(`${rel(f)} verificado em ${m[1]} (há mais de 30 dias): reverifique contra o código`)
}

if (errors.length) {
  console.error(`docs:check falhou (${errors.length} problema(s)):\n`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
for (const w of warnings) console.warn(`  aviso: ${w}`)
console.log(`docs:check ok (${mdFiles.length} arquivos .md, ${categories.length} categorias)`)
