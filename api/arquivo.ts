import type { IncomingMessage, ServerResponse } from 'node:http'
import { get } from '@vercel/blob'
import { banco } from './_banco.js'
import { quemEsta } from './_equipe.js'
import { ErroDoCliente, parametro, responderErro } from './_http.js'

/**
 * As páginas do panfleto. O armazém é privado: o arquivo só sai por aqui.
 * Panfleto publicado, qualquer um vê; ainda em conferência, só a equipe.
 *
 *   GET /api/arquivo?panfleto=…&pagina=1
 */

interface Pagina {
  caminho: string
  tipo: string
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method !== 'GET') throw new ErroDoCliente('método não aceito', 405)
    const sql = await banco()
    const id = parametro(req, 'panfleto')
    const numero = Number(parametro(req, 'pagina'))
    if (!Number.isInteger(numero) || numero < 1) throw new ErroDoCliente('página inválida')

    const [p] = await sql`select estado, paginas from panfletos where id = ${id}`
    if (!p) throw new ErroDoCliente('panfleto não encontrado', 404)
    const publico = p.estado === 'publicado'
    if (!publico && !(await quemEsta(req))) throw new ErroDoCliente('panfleto não encontrado', 404)

    const pagina = (p.paginas as Pagina[])[numero - 1]
    if (!pagina) throw new ErroDoCliente('página não encontrada', 404)

    const achada = await get(pagina.caminho, { access: 'private' })
    if (!achada || achada.statusCode !== 200) throw new ErroDoCliente('página não encontrada', 404)

    res.statusCode = 200
    res.setHeader('Content-Type', pagina.tipo)
    // O arquivo nunca vira página: sem adivinhar tipo, sem script.
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox")
    res.setHeader('Content-Disposition', 'inline')
    res.setHeader('Cache-Control', publico ? 'public, max-age=3600' : 'private, max-age=300')
    for await (const pedaco of achada.stream as unknown as AsyncIterable<Uint8Array>) res.write(pedaco)
    res.end()
  } catch (erro) {
    responderErro(res, erro)
  }
}
