import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { apiLocal } from './servidor/api-local'

export default defineConfig(({ mode }) => {
  // Deixa as variáveis do .env visíveis para os endereços de api/ no computador.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
  return { plugins: [react(), apiLocal()] }
})
