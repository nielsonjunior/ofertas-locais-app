import type { ProdutoNaVitrine } from './tipos'

/**
 * Regras do que fica no aparelho do consumidor (ele não tem conta): o que o
 * feed monta, buscas recentes, lojas seguidas e salvos.
 */

/**
 * O feed tem até 300 produtos, mas o celular só precisa montar os que estão
 * perto da tela: montar todos pedia centenas de fotos de uma vez. Dois para
 * trás (para voltar sem tela preta) e três para a frente (a próxima foto já
 * chega baixada).
 */
export function estaPerto(indice: number, atual: number): boolean {
  return indice >= atual - 2 && indice <= atual + 3
}

/** Quem abre um produto por link vê ele primeiro, e o feed da cidade continua embaixo. */
export function comPrimeiroNaFrente(primeiro: ProdutoNaVitrine | null, produtos: ProdutoNaVitrine[]): ProdutoNaVitrine[] {
  if (!primeiro) return produtos
  return [primeiro, ...produtos.filter((p) => p.id !== primeiro.id)]
}

export const MAXIMO_DE_BUSCAS = 8

export function lembrarBusca(recentes: string[], termo: string): string[] {
  const limpo = termo.trim().replace(/\s+/g, ' ')
  if (!limpo) return recentes
  const chave = limpo.toLocaleLowerCase('pt-BR')
  return [limpo, ...recentes.filter((r) => r.toLocaleLowerCase('pt-BR') !== chave)].slice(0, MAXIMO_DE_BUSCAS)
}

export interface LojaSeguida {
  id: string
  nome: string
}

export function alternarSeguida(seguidas: LojaSeguida[], loja: LojaSeguida): LojaSeguida[] {
  if (seguidas.some((l) => l.id === loja.id)) return seguidas.filter((l) => l.id !== loja.id)
  return [{ id: loja.id, nome: loja.nome }, ...seguidas]
}

export type ProdutoSalvo = ProdutoNaVitrine & { indisponivel?: boolean }

/**
 * O salvo é uma cópia do dia em que foi salvo. Com a lista do que está no ar
 * agora, troca preço e fotos pelos de hoje e marca o que saiu (vendido,
 * pausado ou removido), sem apagar: quem decide tirar é o consumidor.
 */
export function atualizarSalvos(salvos: ProdutoNaVitrine[], noAr: ProdutoNaVitrine[]): ProdutoSalvo[] {
  const atuais = new Map(noAr.map((p) => [p.id, p]))
  return salvos.map((s) => {
    const atual = atuais.get(s.id)
    return atual ? { ...atual, indisponivel: false } : { ...s, indisponivel: true }
  })
}
