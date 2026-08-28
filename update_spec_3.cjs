const fs = require('fs');
let content = fs.readFileSync('docs/specs/12_EXPANSION_FRONTS.md', 'utf8');

// Update header
content = content.replace(
  "### Prioridade 2: Frente 3 - Meta-Progressão e Economia",
  "### [CONCLUÍDO] Prioridade 2: Frente 3 - Meta-Progressão e Economia"
);

// Append changelog
const changelog = `

- **[2026-08-26] Frente 3 - Meta-Progressão e Economia:**
  - Status: **CONCLUÍDO**
  - **Implementado:**
    - Menu de \`Árvore de Talentos\` acessível pela \`TitleScene\` e no componente React \`MainMenu\`.
    - Lógica de persistência da evolução roguelite gravada em \`gameStore.ts\`, suportando bônus para vida, dano, vampirismo e recarga de feitiços através de Cristais de Sangue.
    - Inicialização de atributos bônus diretamente na classe \`Player.ts\`, permitindo que os efeitos passivos entrem em vigor instantaneamente ao começar a run.
  - **Validação:** \`npm run build\` passando. 100% tipado.
`;

// Insert changelog before end of file
if (!content.includes("Frente 3 - Meta-Progressão e Economia:\"\n  - Status: **CONCLUÍDO**")) {
    fs.writeFileSync('docs/specs/12_EXPANSION_FRONTS.md', content + changelog);
}
