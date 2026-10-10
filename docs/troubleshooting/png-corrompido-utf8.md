# PNG/JPG corrompido por gravação como texto UTF-8

**Mestre:** [troubleshooting](README.md)
**Verificado em:** 2026-10-10
**Evidência da solução:** `scripts/verify-assets.cjs` (checa magic bytes e `EF BF BD`), `.husky/pre-commit` (roda `npm run verify`), `.gitattributes` (`*.png binary` etc.)

## Sintoma
- Menu (`TitleScene`, `SettingsScene`, `RecordsScene`) ou sprites aparecem como fallback procedural (formas geométricas) mesmo com o arquivo presente.
- `file <arquivo>.png` responde `data` em vez de `PNG image data`.
- O arquivo "restaurado" volta a ficar corrompido, ou tem tamanho maior que o original.

## Causa raiz
Um binário lido e regravado como string UTF-8 (ferramenta de edição de texto, agente, script com `readFileSync(f, 'utf8')`) tem cada byte inválido em UTF-8 trocado por `U+FFFD` (`EF BF BD`). O primeiro byte do PNG (`0x89`) vira `EF BF BD`, o header some e o decodificador do navegador falha (`loaderror`); o jogo então cai no fallback procedural.

Reproduzido em 2026-10-10: `Buffer.from(buf.toString('utf8'), 'utf8')` sobre `public/icon-192.png` muda o início de `89504e47` para `efbfbd50` e o tamanho de 8419 para 14534 bytes.

A origem exata dos incidentes passados não foi atribuída a uma ferramenta específica. Uma cópia de "backup" pode já estar corrompida: se `md5sum fonte destino` for igual e o arquivo começar com `EF BF BD`, a fonte é o problema.

## Solução
- `scripts/verify-assets.cjs` falha (exit 1) ao achar `EF BF BD` no início ou header que não bate com a extensão; roda em `npm run verify`, chamado pelo hook `.husky/pre-commit`. Trate falha como bloqueante.
- `.gitattributes` marca mídia como `binary`. Isso protege o Git, não protege contra script que lê/grava como texto.
- Regra de trabalho: nunca editar `.png/.jpg/.webp/.gif/.woff2/.mp3/.ogg/.wav` com ferramenta de texto; copiar/baixar usando `Buffer` ou `cp`.
- Restaurar: obter o binário de uma fonte validada (commit íntegro, export original, regeneração pelo script do pipeline), conferir os primeiros bytes (`89 50 4E 47` PNG, `FF D8 FF` JPG) e commitar logo em seguida.

## Como verificar
```bash
node scripts/verify-assets.cjs        # exit 0 = nenhum asset obrigatório corrompido
file src/assets/ui/*                  # todos "PNG image data" ou "JPEG image data"
```
