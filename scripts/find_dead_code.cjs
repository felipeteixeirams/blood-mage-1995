/**
 * Bloodmage 1995 — Dead Code & Orphan Assets Validator
 * 
 * Executa análise estática de AST usando TypeScript para identificar:
 * 1. Arquivos órfãos (arquivos não alcançáveis a partir dos entry points da aplicação)
 * 2. Componentes de template/scaffolding não utilizados (shadcn/radix)
 * 3. Símbolos exportados sem consumidores externos (funções, classes, interfaces, tipos e constantes)
 * 4. Módulos legados ou descontinuados candidatos à limpeza
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

// Cores para formatação de terminal
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const MAGENTA = '\x1b[35m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';

function getAllFiles(dir, exts = ['.ts', '.tsx', '.js', '.jsx']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        results = results.concat(getAllFiles(filePath, exts));
      }
    } else {
      const ext = path.extname(file);
      if (exts.includes(ext) && !file.endsWith('.d.ts')) {
        results.push(filePath);
      }
    }
  });
  return results;
}

function resolveImport(importPath, containingFile, allFilesSet) {
  let targetPath = null;
  if (importPath.startsWith('@/')) {
    targetPath = path.join(SRC_DIR, importPath.slice(2));
  } else if (importPath.startsWith('.')) {
    targetPath = path.resolve(path.dirname(containingFile), importPath);
  } else {
    return null;
  }

  const candidates = [
    targetPath,
    targetPath + '.ts',
    targetPath + '.tsx',
    targetPath + '.js',
    targetPath + '.jsx',
    path.join(targetPath, 'index.ts'),
    path.join(targetPath, 'index.tsx'),
    path.join(targetPath, 'index.js')
  ];

  for (const cand of candidates) {
    if (allFilesSet.has(cand)) {
      return cand;
    }
  }
  return null;
}

console.log(`\n${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════════╗${RESET}`);
console.log(`${BOLD}${CYAN}║     🩸 BLOODMAGE 1995 — VALIDADOR DE CÓDIGO MORTO & ÓRFÃOS       ║${RESET}`);
console.log(`${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════════╝${RESET}\n`);

// 1. Coleta de Arquivos
const srcFiles = getAllFiles(SRC_DIR);
const testFiles = getAllFiles(path.join(ROOT_DIR, 'tests')).concat(
  srcFiles.filter(f => f.includes('.test.') || f.includes('.spec.'))
);
const rootFiles = [
  path.join(ROOT_DIR, 'vite.config.ts'),
  path.join(ROOT_DIR, 'playwright.config.ts')
].filter(f => fs.existsSync(f));

const allProjectFiles = Array.from(new Set([...srcFiles, ...testFiles, ...rootFiles]));
const allFilesSet = new Set(allProjectFiles);

// Entry points para análise de alcançabilidade
const entryPoints = [
  path.join(SRC_DIR, 'main.tsx'),
  path.join(SRC_DIR, 'App.tsx'),
  path.join(SRC_DIR, 'index.css'),
  ...testFiles,
  ...rootFiles
].filter(f => fs.existsSync(f));

// 2. Grafo de Dependências e Coleta de AST
const fileImports = new Map();
const fileImportedBy = new Map();
const fileExports = new Map();
const fileImportsSpecifiers = new Map();

allProjectFiles.forEach(file => {
  fileImports.set(file, new Set());
  fileImportedBy.set(file, new Set());
  fileExports.set(file, []);
  fileImportsSpecifiers.set(file, []);
});

allProjectFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

  function visit(node) {
    // Importações estáticas
    if (ts.isImportDeclaration(node) && node.moduleSpecifier) {
      const moduleSpecifier = node.moduleSpecifier.text;
      const resolved = resolveImport(moduleSpecifier, filePath, allFilesSet);
      if (resolved) {
        fileImports.get(filePath).add(resolved);
        fileImportedBy.get(resolved).add(filePath);

        if (node.importClause) {
          if (node.importClause.name) {
            fileImportsSpecifiers.get(filePath).push({
              name: 'default',
              localName: node.importClause.name.text,
              fromFile: resolved,
              line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1
            });
          }
          if (node.importClause.namedBindings) {
            if (ts.isNamedImports(node.importClause.namedBindings)) {
              node.importClause.namedBindings.elements.forEach(el => {
                fileImportsSpecifiers.get(filePath).push({
                  name: (el.propertyName || el.name).text,
                  localName: el.name.text,
                  fromFile: resolved,
                  line: sourceFile.getLineAndCharacterOfPosition(el.getStart()).line + 1
                });
              });
            } else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
              fileImportsSpecifiers.get(filePath).push({
                name: '*',
                localName: node.importClause.namedBindings.name.text,
                fromFile: resolved,
                line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1
              });
            }
          }
        }
      }
    }

    // Re-exportações
    if (ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const resolved = resolveImport(node.moduleSpecifier.text, filePath, allFilesSet);
        if (resolved) {
          fileImports.get(filePath).add(resolved);
          fileImportedBy.get(resolved).add(filePath);
          if (node.exportClause && ts.isNamedExports(node.exportClause)) {
            node.exportClause.elements.forEach(el => {
              fileImportsSpecifiers.get(filePath).push({
                name: (el.propertyName || el.name).text,
                localName: el.name.text,
                fromFile: resolved,
                line: sourceFile.getLineAndCharacterOfPosition(el.getStart()).line + 1
              });
            });
          }
        }
      }
    }

    // Dynamic import('...')
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const arg = node.arguments[0];
      if (arg && ts.isStringLiteral(arg)) {
        const resolved = resolveImport(arg.text, filePath, allFilesSet);
        if (resolved) {
          fileImports.get(filePath).add(resolved);
          fileImportedBy.get(resolved).add(filePath);
        }
      }
    }

    // Símbolos Exportados
    const isExported = node.modifiers && node.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
    const isDefault = node.modifiers && node.modifiers.some(m => m.kind === ts.SyntaxKind.DefaultKeyword);

    if (isExported) {
      const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      if (ts.isFunctionDeclaration(node) && node.name) {
        fileExports.get(filePath).push({
          name: isDefault ? 'default' : node.name.text,
          type: 'function',
          line: pos.line + 1
        });
      } else if (ts.isClassDeclaration(node) && node.name) {
        fileExports.get(filePath).push({
          name: isDefault ? 'default' : node.name.text,
          type: 'class',
          line: pos.line + 1
        });
      } else if (ts.isInterfaceDeclaration(node) && node.name) {
        fileExports.get(filePath).push({
          name: node.name.text,
          type: 'interface',
          line: pos.line + 1
        });
      } else if (ts.isTypeAliasDeclaration(node) && node.name) {
        fileExports.get(filePath).push({
          name: node.name.text,
          type: 'type',
          line: pos.line + 1
        });
      } else if (ts.isEnumDeclaration(node) && node.name) {
        fileExports.get(filePath).push({
          name: node.name.text,
          type: 'enum',
          line: pos.line + 1
        });
      } else if (ts.isVariableStatement(node)) {
        node.declarationList.declarations.forEach(dec => {
          if (dec.name && ts.isIdentifier(dec.name)) {
            fileExports.get(filePath).push({
              name: dec.name.text,
              type: 'variable/const',
              line: pos.line + 1
            });
          }
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
});

// 3. Travessia BFS para Arquivos Alcançáveis
const reachableFiles = new Set();
const queue = [...entryPoints];
queue.forEach(f => reachableFiles.add(f));

while (queue.length > 0) {
  const current = queue.shift();
  const imports = fileImports.get(current) || new Set();
  for (const imp of imports) {
    if (!reachableFiles.has(imp)) {
      reachableFiles.add(imp);
      queue.push(imp);
    }
  }
}

// 4. Identificar Órfãos
const allOrphans = srcFiles.filter(f => {
  if (f.includes('.test.') || f.includes('.spec.') || f.endsWith('.d.ts')) return false;
  return !reachableFiles.has(f);
});

const legacyAndDeadOrphans = [];
const uiScaffoldingOrphans = [];
const pwaAndUtilsOrphans = [];

allOrphans.forEach(f => {
  const rel = path.relative(ROOT_DIR, f);
  if (rel.startsWith('src/components/ui/')) {
    if (rel.includes('OfflineStatusBadge') || rel.includes('PWAInstallBanner')) {
      pwaAndUtilsOrphans.push(rel);
    } else {
      uiScaffoldingOrphans.push(rel);
    }
  } else if (rel.startsWith('src/lib/utils.ts') || rel.startsWith('src/hooks/usePWA.ts')) {
    pwaAndUtilsOrphans.push(rel);
  } else {
    legacyAndDeadOrphans.push(rel);
  }
});

// 5. Mapear Exports Sem Uso
const allImportedSymbols = new Set();
allProjectFiles.forEach(file => {
  const specifiers = fileImportsSpecifiers.get(file) || [];
  specifiers.forEach(s => {
    allImportedSymbols.add(`${s.fromFile}#${s.name}`);
    if (s.name === '*') {
      const targetExports = fileExports.get(s.fromFile) || [];
      targetExports.forEach(exp => {
        allImportedSymbols.add(`${s.fromFile}#${exp.name}`);
      });
    }
  });
});

const unusedExports = [];
reachableFiles.forEach(file => {
  if (file.includes('.test.') || file.includes('.spec.') || file.endsWith('main.tsx') || file.endsWith('App.tsx') || file.endsWith('vite.config.ts')) {
    return;
  }
  const exports = fileExports.get(file) || [];
  const ownContent = fs.readFileSync(file, 'utf-8');

  exports.forEach(exp => {
    const key = `${file}#${exp.name}`;
    let isUsedExternally = allImportedSymbols.has(key);

    // If not found by AST import bindings, check if symbol name is referenced in any OTHER reachable file
    if (!isUsedExternally) {
      const regex = new RegExp(`\\b${exp.name}\\b`);
      for (const otherFile of reachableFiles) {
        if (otherFile === file) continue;
        const otherContent = fs.readFileSync(otherFile, 'utf-8');
        if (regex.test(otherContent)) {
          isUsedExternally = true;
          break;
        }
      }
    }

    if (!isUsedExternally) {
      const matches = ownContent.match(new RegExp(`\\b${exp.name}\\b`, 'g')) || [];
      unusedExports.push({
        file,
        relativeFile: path.relative(ROOT_DIR, file),
        name: exp.name,
        type: exp.type,
        line: exp.line,
        isInternalOnly: matches.length > 1
      });
    }
  });
});

// 6. Relatório Estruturado

// SEÇÃO 1: CÓDIGO MORTO & ARQUIVOS LEGADOS CANDIDATOS À REMOÇÃO
console.log(`${BOLD}${RED}🗑️  CATEGORIA 1 — CÓDIGO MORTO & ARQUIVOS LEGADOS (Candidatos Fortes à Remoção)${RESET}`);
console.log(`${GRAY}Arquivos órfãos que representam código descontinuado, wrappers vazios ou sistemas Phaser UI legados:${RESET}\n`);

if (legacyAndDeadOrphans.length === 0) {
  console.log(`  ${GREEN}✓ Nenhum arquivo legado morto encontrado.${RESET}\n`);
} else {
  legacyAndDeadOrphans.forEach(rel => {
    let reason = 'Arquivo órfão sem consumidores no runtime';
    if (rel.includes('BestiaryModal')) reason = 'Wrapper vazio de 7 linhas (substituído por CodexModal)';
    if (rel.includes('RotateDeviceOverlay')) reason = 'Componente nulo descontinuado (substituído por orientation.ts)';
    if (rel.includes('JoystickVisual')) reason = 'HUD de joystick descontinuado (substituído por VirtualJoystick.tsx)';
    if (rel.includes('useJoystick')) reason = 'Hook legado (substituído por useFloatingJoystick.ts)';
    if (rel.includes('AchievementNotification')) reason = 'UI legada dentro do Phaser Scene (violação da Regra 7 do AGENTS.md)';
    if (rel.includes('AchievementSystem')) reason = 'Sistema Phaser não acoplado (substituído por React AchievementsModal)';
    if (rel.includes('not-found')) reason = 'Página 404 padrão de template Vite não roteada';
    if (rel.includes('use-mobile') || rel.includes('use-toast')) reason = 'Hooks auxiliares do shadcn/radix não utilizados';

    console.log(`  • ${BOLD}${rel}${RESET}`);
    console.log(`    ${YELLOW}↳ Motivo:${RESET} ${reason}`);
  });
  console.log('');
}

// SEÇÃO 2: SCAFFOLDING GENÉRICO DE TEMPLATE
console.log(`${BOLD}${YELLOW}📦  CATEGORIA 2 — SCAFFOLDING GENÉRICO SHADCN/RADIX (${uiScaffoldingOrphans.length} arquivos)${RESET}`);
console.log(`${GRAY}Componentes gerados pelo boilerplate inicial em src/components/ui/ que o jogo não consome:${RESET}\n`);
console.log(`  ${GRAY}Arquivos:${RESET} ${uiScaffoldingOrphans.slice(0, 10).map(f => path.basename(f)).join(', ')}, ... (+${Math.max(0, uiScaffoldingOrphans.length - 10)} componentes)\n`);

// SEÇÃO 3: COMPONENTES PWA/UTILITÁRIOS PRONTOS PARA MONTAGEM
if (pwaAndUtilsOrphans.length > 0) {
  console.log(`${BOLD}${CYAN}📱  CATEGORIA 3 — COMPONENTES DE PWA RECENTES (Criados na Spec 15 / Prontos para Montagem)${RESET}`);
  console.log(`${GRAY}Arquivos implementados com testes unitários aguardando montagem no App.tsx ou hook:${RESET}\n`);
  pwaAndUtilsOrphans.forEach(rel => {
    console.log(`  • ${CYAN}${rel}${RESET} ${GRAY}(PWA / utilitário testado pronto)${RESET}`);
  });
  console.log('');
}

// SEÇÃO 4: SÍMBOLOS EXPORTADOS NÃO CONSUMIDOS FORA DO ARQUIVO
console.log(`${BOLD}${MAGENTA}🔍  CATEGORIA 4 — EXPORTS NÃO CONSUMIDOS EXTERNAMENTE (${unusedExports.length} símbolos)${RESET}`);
console.log(`${GRAY}Símbolos com export desnecessário (podem ser privados ou removidos):${RESET}\n`);

const internalOnlyExports = unusedExports.filter(e => e.isInternalOnly);
const totallyUnusedExports = unusedExports.filter(e => !e.isInternalOnly);

console.log(`  • ${YELLOW}${internalOnlyExports.length}${RESET} símbolos usados ${BOLD}apenas internamente${RESET} (o prefixo 'export' pode ser removido)`);
console.log(`  • ${RED}${totallyUnusedExports.length}${RESET} símbolos com ${BOLD}zero referências no arquivo e fora dele${RESET} (candidatos à exclusão)\n`);

if (totallyUnusedExports.length > 0) {
  console.log(`${BOLD}Top Símbolos com Zero Referências Totais:${RESET}`);
  totallyUnusedExports.slice(0, 12).forEach(it => {
    console.log(`  • ${BOLD}${it.relativeFile}:${it.line}${RESET} ➔ ${CYAN}${it.type}${RESET} ${BOLD}${it.name}${RESET}`);
  });
  if (totallyUnusedExports.length > 12) {
    console.log(`    ${GRAY}... e mais ${totallyUnusedExports.length - 12} símbolos.${RESET}`);
  }
  console.log('');
}

// RESUMO FINAL
console.log(`${BOLD}${CYAN}══════════════════════════════════════════════════════════════════${RESET}`);
console.log(`${BOLD}📊 RESUMO DA AUDITORIA:${RESET}`);
console.log(`  • Total de arquivos no projeto: ${BOLD}${allProjectFiles.length}${RESET}`);
console.log(`  • Arquivos alcançáveis pela aplicação: ${BOLD}${reachableFiles.size}${RESET}`);
console.log(`  • Arquivos legados/mortos para remoção imediata: ${RED}${legacyAndDeadOrphans.length}${RESET}`);
console.log(`  • Arquivos de UI scaffolding shadcn: ${YELLOW}${uiScaffoldingOrphans.length}${RESET}`);
console.log(`  • Símbolos com export redundante/sem uso: ${MAGENTA}${unusedExports.length}${RESET}`);
console.log(`${BOLD}${CYAN}══════════════════════════════════════════════════════════════════${RESET}\n`);
