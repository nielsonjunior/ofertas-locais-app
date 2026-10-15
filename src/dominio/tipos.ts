/** Os tipos que andam entre servidor, site e WhatsApp. Dinheiro em centavos. */

export interface Cidade {
  id: string
  nome: string
  uf: string
}

export interface Mercado {
  id: string
  cidadeId: string
  nome: string
  endereco: string
  ativo: boolean
}

export type EstadoDoPanfleto = 'lendo' | 'conferir' | 'publicado' | 'falhou'

export interface Panfleto {
  id: string
  mercadoId: string
  validoDe: string
  validoAte: string
  estado: EstadoDoPanfleto
  /** Endereços das páginas (imagens ou PDF) no armazém. */
  paginas: string[]
  criadoEm: string
}

export interface Oferta {
  id: string
  panfletoId: string
  produto: string
  marca: string
  /** Como está no panfleto: "5 kg", "6 x 1L". Vazio = não informado. */
  quantidade: string
  preco: number
  /** O "de" do "de R$ X por R$ Y". */
  precoDe: number | null
  /** "leve 3 pague 2", "no cartão do clube", "a partir de 2 un". */
  condicao: string
  pagina: number
  /** A IA marca 'baixa' quando não teve certeza; a conferência olha primeiro esses. */
  confianca: 'alta' | 'baixa'
}

/** A oferta como o consumidor vê: com o mercado junto. */
export interface OfertaNaVitrine {
  id: string
  produto: string
  marca: string
  quantidade: string
  preco: number
  precoDe: number | null
  condicao: string
  mercadoId: string
  mercadoNome: string
  panfletoId: string
}
