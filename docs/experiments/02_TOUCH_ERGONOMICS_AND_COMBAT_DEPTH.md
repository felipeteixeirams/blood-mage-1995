# Experimento 02: Ergonomia Touch Avançada, Safe Area & Profundidade de Combate

## 🎯 1. Hipótese
Em dispositivos móveis de diferentes tamanhos de mão, recortes de tela (Notches e Dynamic Island) e preferências de lateralidade (canhotos vs destros), oferecer calibração ergonômica da área de toque e respeito às bordas seguras reduz o cansaço dos polegares e eleva a retenção D1/D7.

---

## 🔍 2. Variáveis em Teste

### A. Ergonomia e Controles Touch
1. **Safe Area Insets:**
   - Adaptação dinâmica de `env(safe-area-inset-*)` no HUD, garantindo que botões de pausa, barras de vida e botões de ação nunca fiquem sob a câmera frontal ou os cantos curvos.
2. **Escala do Joystick Virtual (`virtualStickScale`):**
   - Opções: `'small'` (0.8x / 80px), `'medium'` (1.0x / 100px - padrão), `'large'` (1.25x / 125px).
   - Medir a precisão de esquiva e taxa de falsos toques em telas menores (<6.1") vs telas grandes (>6.7").
3. **Modo Canhoto (`leftHandedMode`):**
   - Inversão de layout: Joystick de movimento no quadrante inferior direito e botões de magia/esquiva no quadrante inferior esquerdo.
4. **Joystick Flutuante vs Fixo (`floatingStick`):**
   - Modo fixo (ancorado) vs Modo dinâmico (surge onde o polegar toca no semi-plano lateral).

### B. Profundidade de Combate & Telegrafias
1. **Telegrafias de Chefes Multiestágio:**
   - Linhas de carga, círculos concêntricos e arcos de impacto telegrafados com área de perigo visual (Danger Zone) no chão da arena.
2. **Ritual de Bênçãos (Cartas de Sangue):**
   - Sinergias entre magias (ex: Blood Bolt congelante + Nova explosiva) com toque único no polegar sem interromper o fluxo mental.

---

## 📊 3. Critérios de Avaliação (Filtro de Sucesso Mobile)
- **Fricção Zero:** O jogador consegue alterar entre Destro e Canhoto e ajustar a escala com 1 toque no menu de configurações.
- **60 FPS Estável:** Zero impacto de Garbage Collection ou repaints no loop de renderização do toque.
- **Retenção & Ergonomia:** Feedback táctil suave e ausência de toques perdidos em sessões de 5-10 minutos.

---

## 📈 4. Status do Experimento
- [x] Hipótese definida e mapeada na Bíblia Mobile.
- [ ] Implementação do suporte a Safe Area e opções de Joystick no Settings.
- [ ] Testes de usabilidade e calibração de escala.
- [ ] Conclusão e integração.
