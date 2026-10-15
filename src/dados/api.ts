import type { Cidade, OfertaNaVitrine } from '../dominio/tipos'

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
  if (init.body && typeof init.body === 'string') cabecalhos['Content-Type'] = 'application/json'

  let resposta: Response
  try {
    resposta = await fetch(url, { ...init, headers: cabecalhos, credentials: 'same-origin' })
  } catch {
    throw new ErroDaApi('sem internet', 0)
  }
  if (resposta.status === 204) return undefined as T
  const corpo = await resposta.json().catch(() => ({}))
  if (!resposta.ok) throw new ErroDaApi(String(corpo.erro ?? 'algo deu errado'), resposta.status)
  return corpo as T
}

export interface PanfletoResumo {
  id: string
  mercadoId: string
  mercadoNome: string
  mercadoEndereco: string
  validoDe: string
  validoAte: string
  paginas: number
  ofertas: number
}

export interface Vitrine {
  cidade: Cidade
  hoje: string
  panfletos: PanfletoResumo[]
  ofertas: OfertaNaVitrine[]
}

export interface PanfletoPublico {
  id: string
  cidadeId: string
  mercadoNome: string
  mercadoEndereco: string
  validoDe: string
  validoAte: string
  vencido: boolean
  paginas: number
  ofertas: OfertaNaVitrine[]
}

export const publico = {
  cidades: () => pedir<Cidade[]>('/api/publico?acao=cidades'),
  vitrine: (cidade: string) => pedir<Vitrine>(`/api/publico?acao=vitrine&cidade=${encodeURIComponent(cidade)}`),
  panfleto: (id: string) => pedir<PanfletoPublico>(`/api/publico?acao=panfleto&id=${encodeURIComponent(id)}`)
}

export function urlDaPagina(panfletoId: string, pagina: number): string {
  return `/api/arquivo?panfleto=${encodeURIComponent(panfletoId)}&pagina=${pagina}`
}

/* --- equipe --- */

export interface Mercado {
  id: string
  cidadeId: string
  nome: string
  endereco: string
  ativo: boolean
}

export interface PanfletoDaLista {
  id: string
  estado: 'lendo' | 'conferir' | 'publicado'
  validoDe: string
  validoAte: string
  mercadoNome: string
  paginas: number
  ofertas: number
  duvidas: number
}

export interface OfertaDaConferencia {
  id: string
  produto: string
  marca: string
  quantidade: string
  preco: number
  precoDe: number | null
  condicao: string
  pagina: number
  confianca: 'alta' | 'baixa'
}

export interface PanfletoDaConferencia {
  id: string
  estado: PanfletoDaLista['estado']
  validoDe: string
  validoAte: string
  mercadoNome: string
  paginas: number
  ofertas: OfertaDaConferencia[]
}

export interface OfertaParaGravar {
  produto: string
  marca: string
  quantidade: string
  preco: string
  precoDe: string
  condicao: string
}

const E = '/api/equipe?acao='

function json(metodo: string, corpo: unknown): RequestInit {
  return { method: metodo, body: JSON.stringify(corpo) }
}

export const equipe = {
  eu: () => pedir<{ usuario: string | null }>(`${E}eu`),
  entrar: (usuario: string, senha: string) => pedir<{ usuario: string }>(`${E}entrar`, json('POST', { usuario, senha })),
  sair: () => pedir<void>(`${E}sair`, { method: 'POST' }),
  mercados: () => pedir<{ cidades: Cidade[]; mercados: Mercado[] }>(`${E}mercados`),
  novoMercado: (cidadeId: string, nome: string, endereco: string) =>
    pedir<{ id: string }>(`${E}mercado`, json('POST', { cidadeId, nome, endereco })),
  novaCidade: (nome: string, uf: string) => pedir<{ id: string }>(`${E}cidade`, json('POST', { nome, uf })),
  panfletos: () => pedir<PanfletoDaLista[]>(`${E}panfletos`),
  novoPanfleto: (mercadoId: string, validoDe: string, validoAte: string) =>
    pedir<{ id: string }>(`${E}panfleto`, json('POST', { mercadoId, validoDe, validoAte })),
  panfleto: (id: string) => pedir<PanfletoDaConferencia>(`${E}panfleto&id=${encodeURIComponent(id)}`),
  validade: (id: string, validoDe: string, validoAte: string) =>
    pedir<void>(`${E}panfleto`, json('PUT', { id, validoDe, validoAte })),
  apagarPanfleto: (id: string) => pedir<void>(`${E}panfleto&id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
  enviarPagina: (panfletoId: string, arquivo: Blob) =>
    pedir<{ pagina: number; lidas: number; descartadas: number; aviso: string }>(
      `${E}pagina&panfleto=${encodeURIComponent(panfletoId)}`,
      { method: 'POST', body: arquivo, headers: { 'Content-Type': arquivo.type } }
    ),
  novaOferta: (panfletoId: string, pagina: number, o: OfertaParaGravar) =>
    pedir<{ id: string }>(`${E}oferta`, json('POST', { panfletoId, pagina, ...o })),
  gravarOferta: (id: string, o: OfertaParaGravar) => pedir<void>(`${E}oferta`, json('PUT', { id, ...o })),
  apagarOferta: (id: string) => pedir<void>(`${E}oferta&id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
  publicar: (id: string) => pedir<void>(`${E}publicar`, json('POST', { id })),
  despublicar: (id: string) => pedir<void>(`${E}despublicar`, json('POST', { id }))
}
