import { z } from 'zod'
import { normalizar } from './busca.js'
import { paraCentavos } from './dinheiro.js'
import type { Oferta } from './tipos.js'
import { dataValida } from './validade.js'

/**
 * O que a IA devolve ao ler uma página de panfleto, e a limpeza que vem
 * depois. A IA nunca escreve direto no banco: tudo passa por aqui e depois
 * pela conferência de uma pessoa.
 *
 * O preço vem como texto, do jeito que está impresso ("27,99"), e quem
 * converte é paraCentavos — a IA não faz conta.
 */

export const EsquemaDaLeitura = z.object({
  validoDe: z.string().nullable().describe('Primeiro dia de validade impresso, AAAA-MM-DD, ou null'),
  validoAte: z.string().nullable().describe('Último dia de validade impresso, AAAA-MM-DD, ou null'),
  ofertas: z.array(z.object({
    produto: z.string().describe('Nome do produto como impresso, sem marca nem tamanho. Ex.: "Arroz Tipo 1"'),
    marca: z.string().nullable(),
    quantidade: z.string().nullable().describe('Tamanho da embalagem como impresso: "5 kg", "6 x 1L", "kg" quando é vendido por quilo'),
    preco: z.string().describe('O preço que o consumidor paga, como impresso: "27,99"'),
    precoDe: z.string().nullable().describe('O preço "de" riscado, quando houver'),
    condicao: z.string().nullable().describe('"leve 3 pague 2", "no cartão do clube", "a partir de 2 un", limite por CPF'),
    certeza: z.enum(['alta', 'baixa']).describe('baixa quando algum número ou nome ficou difícil de ler')
  }))
})

export type Leitura = z.infer<typeof EsquemaDaLeitura>

export type OfertaLida = Omit<Oferta, 'id' | 'panfletoId'>

export interface LeituraLimpa {
  ofertas: OfertaLida[]
  descartadas: number
  validade: { validoDe: string; validoAte: string } | null
}

const LIMITE_DE_TEXTO = 120
/** Acima disto, num panfleto de mercado, é mais provável erro de leitura do que preço. */
const PRECO_SUSPEITO = 50_000

function texto(valor: string | null): string {
  return (valor ?? '').replace(/\s+/g, ' ').trim().slice(0, LIMITE_DE_TEXTO)
}

export function limparLeitura(leitura: Leitura, pagina: number): LeituraLimpa {
  const ofertas: OfertaLida[] = []
  const vistas = new Set<string>()
  let descartadas = 0

  for (const bruta of leitura.ofertas) {
    const produto = texto(bruta.produto)
    const preco = paraCentavos(bruta.preco)
    if (!produto || preco === null || preco <= 0) {
      descartadas++
      continue
    }

    const quantidade = texto(bruta.quantidade)
    const chave = `${normalizar(produto)}|${normalizar(quantidade)}|${preco}`
    if (vistas.has(chave)) {
      descartadas++
      continue
    }
    vistas.add(chave)

    const de = bruta.precoDe ? paraCentavos(bruta.precoDe) : null
    // Preço impresso sem vírgula ("2799") costuma ser a vírgula que a leitura perdeu.
    const semVirgula = /^\D*\d{3,}\D*$/.test(bruta.preco)
    const suspeito = semVirgula || preco > PRECO_SUSPEITO

    ofertas.push({
      produto,
      marca: texto(bruta.marca),
      quantidade,
      preco,
      precoDe: de !== null && de > preco ? de : null,
      condicao: texto(bruta.condicao),
      pagina,
      confianca: bruta.certeza === 'baixa' || suspeito ? 'baixa' : 'alta'
    })
  }

  const { validoDe, validoAte } = leitura
  const validade = validoDe && validoAte && dataValida(validoDe) && dataValida(validoAte) && validoDe <= validoAte
    ? { validoDe, validoAte }
    : null

  return { ofertas, descartadas, validade }
}
