import { createHash } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { banco } from './_banco.js'
import type { Sql } from './_banco.js'
import { ErroDoCliente } from './_http.js'
import {
  DIAS_DE_SESSAO, confereEmTempoConstante, cookieApagado, cookieDaSessao, novoToken, tokenDoCookie
} from './_senha.js'

/**
 * Login da equipe que digitaliza os panfletos. Quem protege o dado é o
 * servidor: todo endereço da equipe passa por exigirEquipe.
 */

const ERROS_ANTES_DO_FREIO = 5
const MINUTOS_DE_FREIO = 15
const TENTATIVAS_POR_ENDERECO = 20

function hashDoToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Cria o primeiro usuário a partir de EQUIPE_INICIAL ("usuario:sal:hash")
 * quando a tabela está vazia. Com alguém cadastrado, não muda nada.
 */
async function garantirPrimeiro(sql: Sql): Promise<void> {
  const inicial = process.env.EQUIPE_INICIAL ?? ''
  const [usuario, sal, hash] = inicial.split(':')
  if (!usuario || !sal || !hash) return
  const [{ total } = { total: 0 }] = await sql`select count(*)::int as total from equipe where ativo`
  if (Number(total) > 0) return
  await sql`insert into equipe (usuario, senha) values (${usuario.toLowerCase()}, ${`${sal}:${hash}`})
            on conflict (usuario) do update set senha = excluded.senha, ativo = true, erros = 0, bloqueado_ate = null`
}

/** O endereço de quem pede. Na Vercel, o primeiro de x-forwarded-for é posto pela própria Vercel. */
function enderecoDe(req: IncomingMessage): string {
  const encaminhado = String(req.headers['x-forwarded-for'] ?? '').split(',')[0]?.trim()
  return (encaminhado || req.socket?.remoteAddress || 'desconhecido').slice(0, 64)
}

/**
 * Mesma resposta para usuário inexistente, senha errada e usuário travado:
 * quem está de fora não descobre quem existe nem quem travou.
 */
const NAO_CONFERE = `usuário ou senha não conferem (depois de ${ERROS_ANTES_DO_FREIO} erros, o acesso trava por ${MINUTOS_DE_FREIO} minutos)`

export async function entrar(req: IncomingMessage, res: ServerResponse, usuarioDigitado: string, senha: string): Promise<string> {
  const sql = await banco()
  await garantirPrimeiro(sql)
  const usuario = usuarioDigitado.trim().toLowerCase()

  // Freio por endereço: impede que alguém de fora fique travando a equipe
  // ou chutando senha de vários usuários.
  const [porEndereco] = await sql`
    insert into tentativas (endereco, janela, total) values (${enderecoDe(req)}, now(), 1)
    on conflict (endereco) do update set
      total = case when tentativas.janela < now() - make_interval(mins => ${MINUTOS_DE_FREIO}) then 1 else tentativas.total + 1 end,
      janela = case when tentativas.janela < now() - make_interval(mins => ${MINUTOS_DE_FREIO}) then now() else tentativas.janela end
    returning total`
  if (Number(porEndereco?.total) > TENTATIVAS_POR_ENDERECO) {
    throw new ErroDoCliente(`muitas tentativas deste endereço; espere ${MINUTOS_DE_FREIO} minutos`, 429)
  }

  // A tentativa é reservada antes de conferir a senha, numa instrução só: cem
  // pedidos ao mesmo tempo não passam do limite, porque o banco faz fila na linha.
  const [reserva] = await sql`
    update equipe set
      erros = case when bloqueado_ate < now() then 1 else erros + 1 end,
      bloqueado_ate = case when (case when bloqueado_ate < now() then 1 else erros + 1 end) >= ${ERROS_ANTES_DO_FREIO}
                           then now() + make_interval(mins => ${MINUTOS_DE_FREIO}) end
     where usuario = ${usuario} and ativo and (bloqueado_ate is null or bloqueado_ate < now())
    returning senha`

  // O hash roda sempre, até para usuário inexistente ou travado: o tempo da
  // resposta não conta quem existe.
  const ok = await confereEmTempoConstante(senha, reserva ? String(reserva.senha) : undefined)
  if (!ok) throw new ErroDoCliente(NAO_CONFERE, 401)

  await sql`update equipe set erros = 0, bloqueado_ate = null where usuario = ${usuario}`
  await sql`delete from tentativas where janela < now() - interval '1 day'`
  const token = novoToken()
  await sql`insert into sessoes (token_hash, usuario, expira_em)
            values (${hashDoToken(token)}, ${usuario}, now() + make_interval(days => ${DIAS_DE_SESSAO}))`
  await sql`delete from sessoes where expira_em < now()`
  res.setHeader('Set-Cookie', cookieDaSessao(token))
  return usuario
}

export async function sair(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const token = tokenDoCookie(req.headers.cookie)
  if (token) {
    const sql = await banco()
    await sql`delete from sessoes where token_hash = ${hashDoToken(token)}`
  }
  res.setHeader('Set-Cookie', cookieApagado())
}

/**
 * Quem está logado, ou erro 401. Pedidos que mudam algo precisam também do
 * cabeçalho X-Requested-With: outro site não consegue mandá-lo sem
 * permissão do navegador, e isso fecha a porta do CSRF.
 */
export async function exigirEquipe(req: IncomingMessage): Promise<string> {
  if (req.method !== 'GET' && req.headers['x-requested-with'] !== 'ofertas') {
    throw new ErroDoCliente('pedido sem a marca do site', 403)
  }
  const usuario = await quemEsta(req)
  if (!usuario) throw new ErroDoCliente('entre com usuário e senha', 401)
  return usuario
}

/** Quem está logado, ou null — sem exigir. */
export async function quemEsta(req: IncomingMessage): Promise<string | null> {
  const token = tokenDoCookie(req.headers.cookie)
  if (!token) return null
  const sql = await banco()
  const [linha] = await sql`
    select s.usuario from sessoes s join equipe e on e.usuario = s.usuario
     where s.token_hash = ${hashDoToken(token)} and s.expira_em > now() and e.ativo`
  return linha ? String(linha.usuario) : null
}
