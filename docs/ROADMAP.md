# Evolução e Roadmap do Projeto

Este documento descreve ideias, sugestões de melhorias e próximos passos arquiteturais para o jogo.

## Melhorias Futuras (Curto/Médio Prazo)

1. **Geração Procedural de Mapas Complexa**
   - Atualmente, as salas do calabouço são dispostas em um grid estático 3x3 com paredes fixas. 
   - *Melhoria:* Implementar um algoritmo de geração procedural real (BSP Trees, Cellular Automata ou Random Walk) para masmorras imprevisíveis, com bifurcações e corredores longos.

2. **Novos Tipos de Inimigos e Mecânicas**
   - Incluir armadilhas no cenário (espinhos, piso falso, etc.).
   - Inimigos que curam aliados (Necromantes Suporte).
   - Mecânicas de escuridão: salas onde apenas a aura da própria magia ou "tochas" revelam inimigos (Sistema de Fog of War ou Light Sources 2D no Phaser).

3. **Arquitetura de Som Avançada**
   - O `soundEngine.ts` atualmente lida de forma básica com osciladores.
   - *Melhoria:* Implementar um sistema de Audio Spatial (Áudio 3D), onde o ruído e grunhidos dos monstros vêm de seus locais específicos na tela, variando o volume com base na distância.

4. **Variedade de Armas e Itens Ativos**
   - Inclusão de um inventário de magias em que o jogador deve combinar chaves para soltar feitiços, em vez de upgrades automáticos. (Transição do estilo Vampire Survivors para Diablo/Hades).

5. **Armazenamento de Dados na Nuvem (Cloud Persistence)**
   - O placar atual está em `localStorage`. Se os jogadores desejarem competir por um *Global Leaderboard*, deve-se integrar Firestore/Firebase para salvar pontuações atreladas à autenticação (Firebase Auth).

## Testes e Deploy (Instruções para o Desenvolvedor)

### Como rodar em ambiente de Deploy?

Para testar o jogo em um ambiente real fora do painel de visualização de dev:

1. **Compartilhamento Rápido via AI Studio:**
   - No Google AI Studio (ferramenta em que estamos trabalhando), você pode utilizar a opção no menu superior chamada **"Share" (Compartilhar)**.
   - Isso provisiona um container na nuvem temporário e gera um **Link Público** para jogar em nova guia de qualquer dispositivo (ótimo para testar com amigos).

2. **Deploy Definitivo para Produção (Cloud Run / Vercel):**
   - Vá no menu de configurações do projeto no AI Studio e clique em **Export to GitHub** ou **Download ZIP**.
   - Por ser um projeto Frontend padrão construído com Vite (`npm run build` gerando estáticos em `/dist`), a pasta pode ser implantada de forma instantânea em provedores como Cloudflare Pages, Vercel ou Firebase Hosting, apenas executando o push e selecionando framework "Vite" nos painéis de controle.

3. **Deploy Automatizado (Google Cloud Run):**
   - Pela própria interface de configurações do aplicativo no AI Studio você consegue realizar o provisionamento para o Google Cloud Run clicando em "Deploy". Isso gerará uma versão final em uma URL estável.