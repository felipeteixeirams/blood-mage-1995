import path from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@assets': path.resolve(__dirname, 'attached_assets'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    // Quick win #1 de docs/reviews/AUDIT_REPORT_QUALIDADE_CODIGO_2026.md
    // (27/08): mock global mínimo de `phaser` (ver tests/setup.ts pro porquê
    // e pro que NÃO foi consolidado de propósito) — roda antes de cada
    // arquivo de teste; suítes com `vi.mock('phaser', ...)` próprio
    // continuam sobrescrevendo esse default normalmente.
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/utils/localStorage.ts', 'src/utils/joystickResponse.ts', 'src/store/gameStore.ts', 'src/game/systems/CombatFeel.ts', 'src/game/systems/ContractSystem.ts', 'src/utils/textureGenerator.ts', 'src/game/systems/PostFXSystem.ts'],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
      },
    },
  },
});
