import type { IncomingMessage, ServerResponse } from 'node:http'
import { Readable } from 'node:stream'

/** Pedido e resposta de mentira, do jeito que a Vercel entrega aos endereços. */

export interface Resposta {
  status: number
  cabecalhos: Record<string, string>
  corpo: Buffer
  json: () => any
}

type Endereco = (req: IncomingMessage, res: ServerResponse) => Promise<void>

export async function chamar(
  endereco: Endereco,
  metodo: string,
  url: string,
  opcoes: { corpo?: unknown; cabecalhos?: Record<string, string> } = {}
): Promise<Resposta> {
  const bytes = opcoes.corpo === undefined ? Buffer.alloc(0)
    : Buffer.isBuffer(opcoes.corpo) ? opcoes.corpo
    : Buffer.from(JSON.stringify(opcoes.corpo))

  const req = Readable.from(bytes.length ? [bytes] : []) as unknown as IncomingMessage
  req.method = metodo
  req.url = url
  req.headers = { 'content-length': String(bytes.length), ...lower(opcoes.cabecalhos ?? {}) }

  const cabecalhos: Record<string, string> = {}
  const pedacos: Buffer[] = []
  let terminou: () => void = () => {}
  const fim = new Promise<void>((r) => { terminou = r })

  const res = {
    statusCode: 200,
    headersSent: false,
    setHeader(nome: string, valor: string) { cabecalhos[nome.toLowerCase()] = String(valor) },
    hasHeader(nome: string) { return nome.toLowerCase() in cabecalhos },
    write(p: Uint8Array | string) { this.headersSent = true; pedacos.push(Buffer.from(p)); return true },
    end(p?: Uint8Array | string) { if (p) pedacos.push(Buffer.from(p)); this.headersSent = true; terminou() },
    destroy() { terminou() }
  }

  await endereco(req, res as unknown as ServerResponse)
  await fim
  const corpo = Buffer.concat(pedacos)
  return { status: res.statusCode, cabecalhos, corpo, json: () => JSON.parse(corpo.toString('utf8') || 'null') }
}

function lower(c: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(c).map(([k, v]) => [k.toLowerCase(), v]))
}
