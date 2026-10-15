import { defineConfig } from 'vitest/config'

// Os testes cobrem as regras puras e os endereços com banco e IA de mentira.
export default defineConfig({
  test: { include: ['testes/**/*.test.ts'] }
})
