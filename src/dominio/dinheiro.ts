/**
 * Dinheiro mora em centavos, inteiro. Com reais em ponto flutuante,
 * 0,1 + 0,2 dá 0,30000000000000004 e a comparação de preço erra no centavo.
 */

/**
 * "4,99", "R$ 1.299,90", "12" ou 4.99 → centavos. Devolve null para o que não
 * é preço (vazio, negativo, texto). Ponto com 1 ou 2 casas e sem vírgula é
 * decimal ("4.99", como a IA às vezes devolve); ponto com 3 casas é milhar.
 */
export function paraCentavos(valor: unknown): number | null {
  if (typeof valor === 'number') {
    if (!Number.isFinite(valor) || valor < 0) return null
    return Math.round(valor * 100)
  }

  const texto = String(valor ?? '').replace(/r\$/i, '').replace(/\s/g, '')
  if (!/^\d[\d.,]*$/.test(texto)) return null

  let inteiro: string
  let decimal = ''
  if (texto.includes(',')) {
    const partes = texto.split(',')
    if (partes.length !== 2) return null
    inteiro = (partes[0] ?? '').replace(/\./g, '')
    decimal = partes[1] ?? ''
  } else if (/^\d+\.\d{1,2}$/.test(texto)) {
    ;[inteiro = '', decimal = ''] = texto.split('.')
  } else {
    inteiro = texto.replace(/\./g, '')
  }

  if (!/^\d+$/.test(inteiro) || !/^\d{0,2}$/.test(decimal)) return null
  return Number(inteiro) * 100 + Number(decimal.padEnd(2, '0'))
}

/** 129990 → "R$ 1.299,90" */
export function emReais(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL'
  }).replace(/ /g, ' ')
}
