---
agent_context: all devs
target_module: all
priority: high
status: active
last_updated: 2026-08-13
tags: [critical, troubleshooting, known-issues, assets, phaser]
---

# 🛠️ Troubleshooting & Known Issues (Problemas Conhecidos e Resoluções)

> **Resumo:** Guia prático de diagnóstico, causas-raiz e procedimentos de correção para problemas conhecidos de carregamento de assets híbridos, renderização de cenas Phaser e integração de UI React.

---

## 📌 Índice de Problemas Conhecidos

1. [Menu com Fallback Procedural em vez dos Assets Pixel Art do Lovable](#1-menu-com-fallback-procedural-em-vez-dos-assets-pixel-art)
2. [Canvas com Altura Zero ou Colapso em Modais React](#2-canvas-com-altura-zero-ou-colapso-em-modais-react)
3. [Instanciação Repetida / Memory Leak do Phaser no React](#3-instanciação-repetida--memory-leak-do-phaser-no-react)
4. [Tabela de Diagnóstico Rápido](#4-tabela-de-diagnóstico-rápido)

---

## 1. Menu com Fallback Procedural em vez dos Assets Pixel Art

### 🔴 Sintoma
A tela inicial (`TitleScene`), configurações (`SettingsScene`) ou salão de recordes (`RecordsScene`) exibe gráficos geométricos simples em linhas e caixas douradas (fallback procedural gerado por `textureGenerator.ts`), em vez dos assets de alta fidelidade do Lovable (altar gótico, gárgulas em pedra, tochas vivas com partículas, arco rúnico e logotipo).

### 🔍 Causa-Raiz
1. **Corrupção de Arquivos Binários de Imagem:** Gravação acidental de imagens binárias (PNG/JPG em `src/assets/ui/`) através de ferramentas de edição de texto ou encoding UTF-8 indevido. O arquivo perde seu cabeçalho mágico (`\x89PNG` ou `\xFF\xD8`) e vira texto corrompido (`data`).
2. **Falha Silenciosa de Carregamento:** O loader do Phaser falha ao decodificar a imagem (`loaderror`), aciona o mecanismo de resiliência híbrida e substitui a textura pelo gerador procedural no canvas.
3. **Propriedades Incompatíveis no Loader:** Uso de flags como `this.load.imageLoadType = "HTMLImageElement"` em cenas Phaser que interferem no empacotador Vite.

### 🧪 Como Diagnosticar
Execute no terminal:
```bash
file src/assets/ui/*
```
* **Correto:** `PNG image data, 1088 x 608, 8-bit/color RGBA...`
* **Corrompido:** `src/assets/ui/title-logo.png: data`

Verifique os checksums contra a fonte original do zip:
```bash
unzip -p animated-spark-art-main.zip animated-spark-art-main/src/assets/title-logo.png | md5sum
md5sum src/assets/ui/title-logo.png
```

### 🛠️ Procedimento de Resolução
1. Reextraia os assets binários originais diretamente do zip arquivado:
   ```bash
   unzip -o animated-spark-art-main.zip "animated-spark-art-main/src/assets/*" -d src/assets/ui/
   mv src/assets/ui/animated-spark-art-main/src/assets/* src/assets/ui/
   rm -rf src/assets/ui/animated-spark-art-main
   ```
2. Remova qualquer manipulação forçada de `imageLoadType` do método `preload()` das cenas.
3. Valide o tipo dos arquivos com `file src/assets/ui/*`.
4. Execute os testes e verificação de tipos:
   ```bash
   npm run typecheck && npm test
   ```

---

## 2. Canvas com Altura Zero ou Colapso em Modais React

### 🔴 Sintoma
Ao abrir o `SettingsModal` ou o `HighScoresModal`, o modal aparece com fundo escuro, mas o canvas do Phaser fica com altura 0px, invisível ou distorcido.

### 🔍 Causa-Raiz
Sobrescrita de estilos CSS no container pai (`[&_canvas]:!max-w-full [&_canvas]:!h-auto [&_canvas]:!w-auto`) associado a uma `<div>` sem altura explícita e com `max-w-2xl` colapsando a altura calculada pelo `Phaser.Scale.FIT`.

### 🛠️ Procedimento de Resolução
Defina dimensões base estruturais com proporção 16:9 (`960x540`) no container pai do React:
```tsx
<div 
  ref={containerRef}
  className="w-full max-w-5xl h-[540px] max-h-[90vh] aspect-[16/9] flex items-center justify-center relative shadow-2xl"
/>
```
Configure o Phaser Game com escala proporcional:
```ts
scale: {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
}
```

---

## 3. Instanciação Repetida / Memory Leak do Phaser no React

### 🔴 Sintoma
Queda gradual de FPS no menu principal, efeitos de áudio disparando duplicados ou logs de múltiplos games Phaser sendo criados.

### 🔍 Causa-Raiz
O `useEffect` de instanciação do `Phaser.Game` incluía funções mutáveis de callback (como `onStartGame`, `onOpenSettings`) no array de dependências, provocando destruição e recriação do ciclo de vida da engine a cada re-render do React.

### 🛠️ Procedimento de Resolução
1. Mantenha o `useEffect` de criação com dependências vazias `[]`:
   ```tsx
   useEffect(() => {
     if (!containerRef.current) return;
     const game = new Phaser.Game(config);
     gameRef.current = game;
     return () => {
       game.destroy(true);
       gameRef.current = null;
     };
   }, []);
   ```
2. Atualize callbacks dinâmicos via `game.registry.set(...)` em um segundo `useEffect` leve dependente das props.

---

## 4. Tabela de Diagnóstico Rápido

| Sintoma | Causa Mais Provável | Ferramenta / Comando de Diagnóstico | Ação Imediata |
|---|---|---|---|
| Menu retrô com formas geométricas em vez de texturas | PNG/JPG corrompidos em `src/assets/ui/` | `file src/assets/ui/*` | Reextrair do zip original |
| Modal Phaser invisível / tela preta | Container pai com `height: 0` | Inspecionar DOM (`computed style`) | Adicionar `h-[540px] aspect-[16/9]` |
| Game duplicando canvas | Dependências instáveis no `useEffect` | Checar array de deps no React | Isolar ciclo de vida do Phaser em `[]` |
| Erro de TypeScript em `game.registry` | Tipagem estrita ou `registry.get` sem casting | `npm run typecheck` | Utilizar type assertions seguras `as (...)` |

---

## 🔗 Referências Relacionadas
- [[docs/critical/00_ANTI_REGRESSION_GUIDE.md]] — Regras e guardrails de estabilidade.
- [[docs/integration/00_LOVABLE_INTEGRATION.md]] — Diretrizes de integração de assets e telas do Lovable.
- [[docs/architecture/03_PHASER_PATTERNS.md]] — Padrões de ciclo de vida do Phaser.
