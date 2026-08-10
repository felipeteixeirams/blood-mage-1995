# 🪦 Fase 2: Tela de Morte e Coleta de Cadáver (Corpse Retrieval)

Ao morrer de forma definitiva na masmorra, o jogador deixa para trás seus bens mais preciosos em um túmulo físico.

## ⚙️ Regras de Coleta
- **Criação do Cadáver**: Ao sofrer a morte definitiva, um objeto interativo `Corpse` é instanciado na posição exata `(x, y)` do jogador, guardando seu inventário atual.
- **Marcação no Mapa**: Uma lápide ou ícone fúnebre é exibido no minimapa e na bússola do jogador na run subsequente.
- **Resgate**: O jogador, ao retornar ao local do cadáver, pode interagir para recuperar 100% dos itens perdidos anteriormente. Caso o jogador morra novamente antes de coletar o cadáver antigo, este é destruído de forma definitiva.
