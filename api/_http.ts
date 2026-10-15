import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * Erro causado pelo que o cliente mandou: responde 400 com a mensagem. Erro
 * inesperado vira 500 com mensagem genérica, para não vazar o que quebrou.
 */
export class ErroDoCliente extends Error {
  constructor(mensagem: string, readonly status = 400) {
    super(mensagem)
  }
}

export function responderJson(res: ServerResponse, status: number, corpo: unknown): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  if (!res.hasHeader('Cache-Control')) res.setHeader('Cache-Control', 'no-store')
  res.end(corpo === undefined ? '' : JSON.stringify(corpo))
}

export function responderErro(res: ServerResponse, erro: unknown): void {
  if (res.headersSent) {
    res.destroy()
    return
  }
  if (erro instanceof ErroDoCliente) {
    responderJson(res, erro.status, { erro: erro.message })
    return
  }
  console.error('erro no servidor:', erro)
  responderJson(res, 500, { erro: 'deu errado do nosso lado; tente de novo' })
}

/** O corpo cru, com teto. A Vercel corta acima de 4,5 MB; o site encolhe a imagem antes. */
export async function lerBytes(req: IncomingMessage, limite: number): Promise<Buffer> {
  if (Number(req.headers['content-length'] ?? 0) > limite) {
    throw new ErroDoCliente(`arquivo grande demais (máximo ${Math.floor(limite / 1024 / 1024)} MB)`, 413)
  }
  const pedacos: Buffer[] = []
  let lido = 0
  for await (const p of req) {
    lido += (p as Buffer).length
    if (lido > limite) throw new ErroDoCliente('arquivo grande demais', 413)
    pedacos.push(p as Buffer)
  }
  return Buffer.concat(pedacos)
}

export async function lerJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const bytes = await lerBytes(req, 256 * 1024)
  if (bytes.length === 0) return {}
  try {
    const valor: unknown = JSON.parse(bytes.toString('utf8'))
    if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) throw new Error()
    return valor as Record<string, unknown>
  } catch {
    throw new ErroDoCliente('envio em formato que não entendi')
  }
}

export function parametro(req: IncomingMessage, nome: string): string {
  return new URL(req.url ?? '', 'http://x').searchParams.get(nome)?.trim() ?? ''
}

/** Texto obrigatório, aparado e com teto. */
export function textoDe(corpo: Record<string, unknown>, campo: string, maximo = 120, obrigatorio = true): string {
  const valor = typeof corpo[campo] === 'string' ? (corpo[campo] as string).replace(/\s+/g, ' ').trim() : ''
  if (obrigatorio && !valor) throw new ErroDoCliente(`faltou ${campo}`)
  if (valor.length > maximo) throw new ErroDoCliente(`${campo} comprido demais`)
  return valor
}
