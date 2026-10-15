import { paraCentavos } from './dinheiro.js'

/**
 * A oferta como a equipe digita ou corrige na conferência. A mensagem do erro
 * vai direto para a tela, então é escrita para quem está conferindo.
 */

export interface OfertaDigitada {
  produto: string
  marca: string
  quantidade: string
  preco: number
  precoDe: number | null
  condicao: string
}

const MAXIMO = 120

function texto(corpo: Record<string, unknown>, campo: string, nome: string): string {
  const valor = typeof corpo[campo] === 'string' ? (corpo[campo] as string).replace(/\s+/g, ' ').trim() : ''
  if (valor.length > MAXIMO) throw new Error(`${nome} comprido demais`)
  return valor
}

export function validarOfertaDigitada(corpo: Record<string, unknown>): OfertaDigitada {
  const produto = texto(corpo, 'produto', 'produto')
  if (!produto) throw new Error('preencha o produto')

  const preco = paraCentavos(corpo.preco)
  if (preco === null || preco <= 0) throw new Error('o preço não é um preço (ex.: 27,99)')

  const deDigitado = corpo.precoDe === undefined || corpo.precoDe === null || corpo.precoDe === '' ? null : corpo.precoDe
  const precoDe = deDigitado === null ? null : paraCentavos(deDigitado)
  if (deDigitado !== null && (precoDe === null || precoDe <= preco)) {
    throw new Error('o preço "de" tem de ser maior que o preço da oferta')
  }

  return {
    produto,
    marca: texto(corpo, 'marca', 'marca'),
    quantidade: texto(corpo, 'quantidade', 'quantidade'),
    preco,
    precoDe,
    condicao: texto(corpo, 'condicao', 'condição')
  }
}
