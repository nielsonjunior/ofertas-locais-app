import type { Cidade, EstadoDaLoja, ProdutoDaLoja, ProdutoNaVitrine } from '../dominio/tipos'

/** Conversa com /api. A mensagem de erro do servidor já vem escrita para a tela. */

export class ErroDaApi extends Error {
  constructor(mensagem: string, readonly status: number) {
    super(mensagem)
  }
}

async function pedir<T>(url: string, init: RequestInit = {}): Promise<T> {
  const metodo = init.method ?? 'GET'
  const cabecalhos: Record<string, string> = { ...(init.headers as Record<string, string>) }
  // Marca do site: o servidor recusa mudança sem ela (CSRF).
  if (metodo !== 'GET') cabecalhos['X-Requested-With'] = 'ofertas'
  if (typeof init.body === 'string') cabecalhos['Content-Type'] = 'application/json'

  let resposta: Response
  try {
    resposta = await fetch(url, { ...init, headers: cabecalhos, credentials: 'same-origin' })
  } catch {
    throw new ErroDaApi('sem internet', 0)
  }
  if (resposta.status === 204) return undefined as T
  const corpo = await resposta.json().catch(() => ({}))
  if (!resposta.ok) throw new ErroDaApi(String(corpo.erro ?? 'algo deu errado; tente de novo'), resposta.status)
  return corpo as T
}

function json(metodo: string, corpo: unknown): RequestInit {
  return { method: metodo, body: JSON.stringify(corpo) }
}

/* --- público --- */

export interface Feed {
  cidade: Cidade
  produtos: ProdutoNaVitrine[]
}

export interface LojaPublica {
  id: string
  nome: string
  categoria: string
  whatsapp: string
  endereco: string
  descricao: string
  cidadeId: string
  cidadeNome: string
  produtos: ProdutoNaVitrine[]
}

export const MOTIVOS_DE_DENUNCIA = [
  { id: 'golpe', nome: 'Parece golpe' },
  { id: 'proibido', nome: 'Produto proibido' },
  { id: 'preco-errado', nome: 'Preço ou produto enganoso' },
  { id: 'ofensivo', nome: 'Conteúdo ofensivo' },
  { id: 'outro', nome: 'Outro motivo' }
] as const

const P = '/api/publico?acao='

export const publico = {
  cidades: () => pedir<Cidade[]>(`${P}cidades`),
  feed: (cidade: string, categoria = '') =>
    pedir<Feed>(`${P}feed&cidade=${encodeURIComponent(cidade)}${categoria ? `&categoria=${encodeURIComponent(categoria)}` : ''}`),
  produto: (id: string) => pedir<ProdutoNaVitrine & { cidadeId: string }>(`${P}produto&id=${encodeURIComponent(id)}`),
  loja: (id: string) => pedir<LojaPublica>(`${P}loja&id=${encodeURIComponent(id)}`),
  denunciar: (produtoId: string, motivo: string) => pedir<void>(`${P}denuncia`, json('POST', { produtoId, motivo })),
  /** Conta sem esperar resposta, e não reclama se falhar: é só estatística. */
  vistas: (ids: string[]) => { void fetch(`${P}vistas`, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) }).catch(() => {}) },
  clique: (id: string) => { void fetch(`${P}clique`, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(() => {}) }
}

/* --- conta --- */

export interface Sessao {
  usuario: string
  papel: 'admin' | 'lojista'
  lojaId: string | null
}

export interface Cadastro {
  usuario: string
  senha: string
  cidadeId: string
  nome: string
  categoria: string
  whatsapp: string
  endereco: string
  descricao: string
  aceite: boolean
}

const C = '/api/conta?acao='

export const conta = {
  eu: () => pedir<{ sessao: Sessao | null }>(`${C}eu`),
  entrar: (usuario: string, senha: string) => pedir<{ sessao: Sessao }>(`${C}entrar`, json('POST', { usuario, senha })),
  sair: () => pedir<void>(`${C}sair`, { method: 'POST' }),
  cadastrar: (dados: Cadastro) => pedir<{ sessao: Sessao }>(`${C}cadastrar`, json('POST', dados))
}

/* --- lojista --- */

export interface MinhaLoja {
  id: string
  cidadeId: string
  nome: string
  categoria: string
  whatsapp: string
  endereco: string
  descricao: string
  estado: EstadoDaLoja
}

export interface ProdutoParaGravar {
  titulo: string
  descricao: string
  categoria: string
  preco: string
  precoDe: string
  fotos: string[]
}

const L = '/api/loja?acao='

export const lojista = {
  minha: () => pedir<{ loja: MinhaLoja; produtos: ProdutoDaLoja[] }>(`${L}minha`),
  gravarLoja: (dados: Omit<MinhaLoja, 'id' | 'cidadeId' | 'estado'>) => pedir<void>(`${L}loja`, json('PUT', dados)),
  enviarFoto: (foto: Blob) => pedir<{ url: string }>(`${L}foto`, { method: 'POST', body: foto, headers: { 'Content-Type': foto.type } }),
  novoProduto: (p: ProdutoParaGravar) => pedir<{ id: string }>(`${L}produto`, json('POST', p)),
  gravarProduto: (id: string, p: ProdutoParaGravar) => pedir<void>(`${L}produto`, json('PUT', { id, ...p })),
  ativo: (id: string, ativo: boolean) => pedir<void>(`${L}ativo`, json('POST', { id, ativo })),
  apagar: (id: string) => pedir<void>(`${L}produto&id=${encodeURIComponent(id)}`, { method: 'DELETE' })
}

/* --- administrador --- */

export interface LojaNoAdmin {
  id: string
  nome: string
  categoria: string
  whatsapp: string
  endereco: string
  descricao: string
  estado: EstadoDaLoja
  cidade: string
  usuario: string
  produtos: number
  criadaEm: string
}

export interface Denuncia {
  produtoId: string
  quantas: number
  motivos: string[]
  titulo: string
  foto: string
  preco: number
  ativo: boolean
  lojaId: string
  lojaNome: string
}

const A = '/api/admin?acao='

export const administrador = {
  lojas: (estado = '') => pedir<{ total: number; lojas: LojaNoAdmin[] }>(`${A}lojas${estado ? `&estado=${estado}` : ''}`),
  estado: (id: string, estado: EstadoDaLoja) => pedir<void>(`${A}estado-da-loja`, json('POST', { id, estado })),
  denuncias: () => pedir<Denuncia[]>(`${A}denuncias`),
  tirarDoAr: (produtoId: string) => pedir<void>(`${A}tirar-do-ar`, json('POST', { produtoId })),
  resolver: (produtoId: string) => pedir<void>(`${A}resolver`, json('POST', { produtoId })),
  novaCidade: (nome: string, uf: string) => pedir<{ id: string }>(`${A}cidade`, json('POST', { nome, uf }))
}
