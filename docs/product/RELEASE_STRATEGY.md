# RELEASE & STORE STRATEGY
*Bloodmage 1995*

> **Nota:** Este documento registra os requisitos futuros para quando o projeto estiver saindo do Beta (Fase 5). Não investir esforço de engenharia nestes itens agora.

## PWA (Fase 3)
A primeira superfície de liberação é o PWA (Progressive Web App).
- Deve suportar instalação local (Adicionar à Tela Inicial).
- Rodar em tela cheia via Manifest.
- *Cache First* para assets críticos (offline fallback).

## Play Store / Android (Fase 5)
Para publicar na Google Play Store, usaremos **TWA (Trusted Web Activity) / Bubblewrap** para envelopar o PWA.

### Requisitos Prévios para Submissão (Store Readiness)
1. **Privacidade e Dados:**
   - Privacy Policy hospedada e acessível dentro do app.
   - Preenchimento do formulário *Data Safety* do Google (mesmo que colete zero dados).
   - Se possuir login: Fluxo de Deleção de Conta (obrigatório).
2. **Classificação Indicativa (Content Rating):**
   - Declaração de violência/gore compatível com o jogo.
3. **Ativos Visuais:**
   - Ícone (512x512).
   - Feature Graphic (1024x500).
   - Screenshots em múltiplas resoluções.
4. **Técnico:**
   - Target API level atualizado conforme regras anuais da Google Play.
   - Keystore / Assinatura do APK/AAB.

## Lançamento Incremental
A distribuição começará via link (PWA) para coleta inicial de métricas sem fricção de loja. Somente com métricas validadas (retenção aceitável), moveremos para empacotamento TWA e submissão na Play Store.
