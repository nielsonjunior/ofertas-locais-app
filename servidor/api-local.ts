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
      // O Vite recarrega api/_banco.ts quando um arquivo muda; cada instância
      // nova do módulo recebe a conexão de novo (o pool é um só).
      const urlLocal = process.env.DATABASE_URL_LOCAL
      const ligados = new WeakSet<object>()
      let sql: unknown = null
      async function ligar(): Promise<void> {
        if (!urlLocal) return
        const banco = await server.ssrLoadModule(PASTA_API + '_banco.ts')
        if (ligados.has(banco)) return
        sql ??= (await server.ssrLoadModule(PASTA_SERVIDOR + 'pgLocal.ts')).conexaoLocal(urlLocal).sql
        banco.usarConexao(sql)
        ligados.add(banco)
      }
      for (const endereco of ENDERECOS) {
        server.middlewares.use(endereco, (req, res) => {
          // O Connect tira o prefixo do endereço; o código de api/ espera a URL inteira.
          req.url = endereco + (req.url === '/' ? '' : req.url ?? '')
          const arquivo = PASTA_API + endereco.replace('/api/', '') + '.ts'
          void ligar().then(() => server.ssrLoadModule(arquivo)).then((modulo) => {
            void (modulo.default as (a: unknown, b: unknown) => Promise<void>)(req, res)
          })
        })
      }
    }
  }
}
