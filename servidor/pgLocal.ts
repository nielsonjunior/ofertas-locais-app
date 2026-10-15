import pg from 'pg'
import type { Sql } from '../api/_banco'

/**
 * Um Postgres comum fingindo ser o driver do Neon: o mesmo jeito de chamar
 * (sql`...`, sql.query, sql.transaction). Serve aos testes de ponta a ponta
 * (DATABASE_URL_TESTE) e ao `npm run dev` sem Neon (DATABASE_URL_LOCAL).
 * Nunca roda publicado.
 */

export const URL_DE_TESTE = process.env.DATABASE_URL_TESTE ?? ''

interface Consulta extends PromiseLike<Record<string, unknown>[]> {
  texto: string
  valores: unknown[]
}

export function conexaoLocal(url: string): { sql: Sql; fechar: () => Promise<void>; limpar: () => Promise<void> } {
  const pool = new pg.Pool({ connectionString: url, max: 4 })

  function consulta(texto: string, valores: unknown[], cliente: pg.Pool | pg.PoolClient = pool): Consulta {
    return {
      texto,
      valores,
      then(ok, falha) {
        return cliente.query(texto, valores).then((r) => r.rows as Record<string, unknown>[]).then(ok, falha)
      }
    }
  }

  const sql = ((partes: TemplateStringsArray, ...valores: unknown[]) => {
    const texto = partes.reduce((acc, parte, i) => acc + (i > 0 ? `$${i}` : '') + parte, '')
    return consulta(texto, valores)
  }) as unknown as Sql & Record<string, unknown>

  sql.query = ((texto: string, valores: unknown[] = []) => consulta(texto, valores)) as never
  sql.transaction = (async (consultas: Consulta[]) => {
    const cliente = await pool.connect()
    try {
      await cliente.query('begin')
      const saida = []
      for (const c of consultas) saida.push((await cliente.query(c.texto, c.valores)).rows)
      await cliente.query('commit')
      return saida
    } catch (erro) {
      await cliente.query('rollback')
      throw erro
    } finally {
      cliente.release()
    }
  }) as never

  return {
    sql,
    fechar: () => pool.end(),
    limpar: async () => {
      // Apaga o banco inteiro: só num banco cujo nome diz que é de teste.
      if (!/teste/.test(new URL(url).pathname)) throw new Error('limpar() só em banco com "teste" no nome')
      await pool.query(`drop schema public cascade; create schema public`)
    }
  }
}
