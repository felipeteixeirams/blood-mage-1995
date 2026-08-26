# ACCOUNT & DATA STRATEGY
*Bloodmage 1995*

## Princípio Fundamental
**Identidade e Salve são problemas separados.**
Neste momento (Fases 0 a 3), o jogo opera **100% Offline / Local Only**.

## Identidade
- **Fase Atual:** *Anonymous Player* (Sem Login).
- **Justificativa:** Adicionar login agora traria dívida técnica e obrigações legais (Privacy Policy, exclusão de dados) prematuramente.
- **Futuro (Fase 5):** Caso o jogo seja validado no Beta e haja demanda para Cloud Save, avaliaremos a integração de um provedor de identidade (ex: Google Sign-in) gerando um `Player ID` único na nuvem.

## Armazenamento (Save Strategy)
- **Fase Atual:** `localStorage` através de uma interface isolada.
- **Regra de Ouro:** O gameplay (`Phaser`) **NUNCA** acessa o `localStorage` diretamente. Todo acesso ocorre via camada de serviço (ex: `gameStorage.ts`) no React/Zustand, que intercepta e aplica fallback/Zod.
- **Futuro (Fase 5):** Cloud Save acoplado ao Player ID (se aplicável).
