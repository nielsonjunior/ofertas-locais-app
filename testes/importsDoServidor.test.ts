import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Na Vercel as funções de api/ rodam no Node como módulos ES, e o Node não
 * adivinha extensão: `import './busca'` quebra a função só depois de
 * publicada. Este teste segue todo import de verdade a partir de api/ e exige
 * `.js` no caminho.
 */

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function importsDeVerdade(arquivo: string): string[] {
  const texto = readFileSync(arquivo, 'utf8')
  const padrao = /^\s*(import|export)\s+(?!type\b)[^'"]*?from\s+['"](\.{1,2}\/[^'"]+)['"]/gm
  return [...texto.matchAll(padrao)].map((m) => m[2] ?? '')
}

describe('o código que roda no servidor', () => {
  it('importa sempre com .js', () => {
    const problemas: string[] = []
    const visitados = new Set<string>()
    const fila = readdirSync(join(RAIZ, 'api')).filter((f) => f.endsWith('.ts')).map((f) => join(RAIZ, 'api', f))
    while (fila.length) {
      const arquivo = fila.pop() as string
      if (visitados.has(arquivo)) continue
      visitados.add(arquivo)
      for (const caminho of importsDeVerdade(arquivo)) {
        if (!caminho.endsWith('.js')) {
          problemas.push(`${arquivo.slice(RAIZ.length + 1)} → '${caminho}'`)
          continue
        }
        fila.push(resolve(dirname(arquivo), caminho.replace(/\.js$/, '.ts')))
      }
    }
    expect(problemas).toEqual([])
  })
})
