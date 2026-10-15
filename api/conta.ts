import { randomBytes } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { cadastrarLojista, entrar, quemEsta, sair } from './_contas.js'
import { ErroDoCliente, lerJson, parametro, responderErro, responderJson, textoDe } from './_http.js'
import { validarLoja, validarUsuario } from '../src/dominio/cadastro.js'

/**
 * O endereço /api/conta: entrar, sair, quem sou eu e o cadastro de loja.
 *
 *   GET  ?acao=eu
 *   POST ?acao=entrar     { usuario, senha }
 *   POST ?acao=sair
 *   POST ?acao=cadastrar  { usuario, senha, cidadeId, nome, categoria, whatsapp, endereco, descricao, aceite }
 */

function validar<T>(fazer: () => T): T {
  try {
    return fazer()
  } catch (erro) {
    throw new ErroDoCliente((erro as Error).message)
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const rota = `${req.method} ${parametro(req, 'acao')}`
    // Tudo que muda algo só vem do próprio site (CSRF), até entrar e cadastrar.
    if (req.method !== 'GET' && req.headers['x-requested-with'] !== 'ofertas') {
      throw new ErroDoCliente('pedido sem a marca do site', 403)
    }

    switch (rota) {
      case 'GET eu':
        res.setHeader('Cache-Control', 'no-store')
        responderJson(res, 200, { sessao: await quemEsta(req) })
        return

      case 'POST entrar': {
        const corpo = await lerJson(req)
        responderJson(res, 200, { sessao: await entrar(req, res, textoDe(corpo, 'usuario', 60), String(corpo.senha ?? '')) })
        return
      }

      case 'POST sair':
        await sair(req, res)
        responderJson(res, 204, undefined)
        return

      case 'POST cadastrar': {
        const corpo = await lerJson(req)
        if (corpo.aceite !== true) throw new ErroDoCliente('aceite os termos para continuar')
        const conta = validar(() => validarUsuario(corpo))
        const loja = validar(() => validarLoja(corpo))
        const sessao = await cadastrarLojista(req, res, conta, {
          id: randomBytes(9).toString('base64url'), cidadeId: textoDe(corpo, 'cidadeId', 60), ...loja
        })
        responderJson(res, 201, { sessao })
        return
      }

      default:
        throw new ErroDoCliente('pedido desconhecido', 404)
    }
  } catch (erro) {
    responderErro(res, erro)
  }
}
