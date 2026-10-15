/** Os tipos que andam entre servidor, site e WhatsApp. Dinheiro em centavos. */

export interface Cidade {
  id: string
  nome: string
  uf: string
}

export type EstadoDaLoja = 'pendente' | 'aprovada' | 'recusada' | 'bloqueada'

export interface Loja {
  id: string
  cidadeId: string
  nome: string
  categoria: string
  /** Só dígitos, com DDD: 65999990000. */
  whatsapp: string
  endereco: string
  descricao: string
  estado: EstadoDaLoja
}

/** O produto como o consumidor vê: com a loja junto. */
export interface ProdutoNaVitrine {
  id: string
  titulo: string
  descricao: string
  categoria: string
  preco: number
  precoDe: number | null
  /** Endereços públicos das fotos, a primeira é a capa. */
  fotos: string[]
  lojaId: string
  lojaNome: string
  lojaWhatsapp: string
  criadoEm: string
}

/** O produto no painel do lojista: com os números dele. */
export interface ProdutoDaLoja extends ProdutoNaVitrine {
  ativo: boolean
  vistas: number
  cliques: number
}
