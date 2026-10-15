import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

/**
 * Faz os endereços /api/... funcionarem no `npm run dev`, com exatamente o
 * mesmo código que roda publicado na Vercel.
 */
const ENDERECOS = ['/api/publico', '/api/equipe', '/api/arquivo', '/api/whatsapp']

const PASTA_API = fileURLToPath(new URL('../api/', import.meta.url))
const PASTA_SERVIDOR = fileURLToPath(new URL('./', import.meta.url))

export function apiLocal(): Plugin {
  return {
    name: 'api-local',
    configureServer(server) {
      // Com DATABASE_URL_LOCAL, os endereços usam um Postgres comum no lugar do Neon.
      const urlLocal = process.env.DATABASE_URL_LOCAL
      const pronto = urlLocal
        ? Promise.all([server.ssrLoadModule(PASTA_API + '_banco.ts'), server.ssrLoadModule(PASTA_SERVIDOR + 'pgLocal.ts')])
            .then(([banco, pg]) => banco.usarConexao(pg.conexaoLocal(urlLocal).sql))
        : Promise.resolve()
      for (const endereco of ENDERECOS) {
        server.middlewares.use(endereco, (req, res) => {
          // O Connect tira o prefixo do endereço; o código de api/ espera a URL inteira.
          req.url = endereco + (req.url === '/' ? '' : req.url ?? '')
          const arquivo = PASTA_API + endereco.replace('/api/', '') + '.ts'
          void pronto.then(() => server.ssrLoadModule(arquivo)).then((modulo) => {
            void (modulo.default as (a: unknown, b: unknown) => Promise<void>)(req, res)
          })
        })
      }
    }
  }
}
