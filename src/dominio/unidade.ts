/**
 * A quantidade da embalagem, para comparar preço entre tamanhos diferentes:
 * arroz de 5 kg contra arroz de 1 kg só se compara em R$/kg.
 *
 * Tudo vira gramas, mililitros ou unidades, inteiros.
 */

export type Base = 'g' | 'ml' | 'un'

export interface Quantidade {
  valor: number
  base: Base
}

const UNIDADES: Record<string, { base: Base; fator: number }> = {
  g: { base: 'g', fator: 1 },
  gr: { base: 'g', fator: 1 },
  grs: { base: 'g', fator: 1 },
  grama: { base: 'g', fator: 1 },
  gramas: { base: 'g', fator: 1 },
  kg: { base: 'g', fator: 1000 },
  kgs: { base: 'g', fator: 1000 },
  quilo: { base: 'g', fator: 1000 },
  quilos: { base: 'g', fator: 1000 },
  ml: { base: 'ml', fator: 1 },
  l: { base: 'ml', fator: 1000 },
  lt: { base: 'ml', fator: 1000 },
  lts: { base: 'ml', fator: 1000 },
  litro: { base: 'ml', fator: 1000 },
  litros: { base: 'ml', fator: 1000 },
  un: { base: 'un', fator: 1 },
  und: { base: 'un', fator: 1 },
  unid: { base: 'un', fator: 1 },
  unidade: { base: 'un', fator: 1 },
  unidades: { base: 'un', fator: 1 },
  duzia: { base: 'un', fator: 12 }
}

function numero(texto: string): number {
  return Number(texto.replace(',', '.'))
}

/** "5 kg", "500g", "2L", "12 un", "6 x 1L", "dúzia" → quantidade; null se não entender. */
export function lerQuantidade(texto: string): Quantidade | null {
  const limpo = texto
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim()
  if (!limpo) return null

  // "6 x 1L", "12x350ml"
  const pacote = /^(\d+)\s*x\s*(\d+(?:[.,]\d+)?)\s*([a-z]+)$/.exec(limpo)
  if (pacote) {
    const unidade = UNIDADES[pacote[3] ?? '']
    if (!unidade) return null
    return montar(numero(pacote[1] ?? '') * numero(pacote[2] ?? '') * unidade.fator, unidade.base)
  }

  // "5 kg", "1,5kg"
  const simples = /^(\d+(?:[.,]\d+)?)\s*([a-z]+)$/.exec(limpo)
  if (simples) {
    const unidade = UNIDADES[simples[2] ?? '']
    if (!unidade) return null
    return montar(numero(simples[1] ?? '') * unidade.fator, unidade.base)
  }

  // "kg", "dúzia" — vendido por quilo ou por dúzia
  const sozinha = UNIDADES[limpo]
  if (sozinha && limpo !== 'un') return montar(sozinha.fator, sozinha.base)
  if (limpo === 'un') return montar(1, 'un')
  return null
}

function montar(valor: number, base: Base): Quantidade | null {
  const redondo = Math.round(valor)
  return redondo > 0 ? { valor: redondo, base } : null
}

export interface PrecoPorUnidade {
  centavos: number
  por: 'kg' | 'L' | 'un'
}

/** 500 g por 499 centavos → 998 centavos por kg. */
export function precoPorUnidade(centavos: number, quantidade: Quantidade | null): PrecoPorUnidade | null {
  if (!quantidade) return null
  if (quantidade.base === 'un') {
    return { centavos: Math.round(centavos / quantidade.valor), por: 'un' }
  }
  return {
    centavos: Math.round((centavos * 1000) / quantidade.valor),
    por: quantidade.base === 'g' ? 'kg' : 'L'
  }
}
