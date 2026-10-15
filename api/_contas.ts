import { createHash } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { banco } from './_banco.js'
import type { Sql } from './_banco.js'
import { ErroDoCliente } from './_http.js'
import {
  DIAS_DE_SESSAO, confereEmTempoConstante, cookieApagado, cookieDaSessao, embaralhar, novoToken, tokenDoCookie
} from './_senha.js'

/**
 * Contas de lojista e de administrador. Quem protege o dado é o servidor:
 * todo endereço que mexe em loja passa por exigirConta.
 */

const ERROS_ANTES_DO_FREIO = 5
const MINUTOS_DE_FREIO = 15

export type Papel = 'admin' | 'lojista'

export interface Sessao {
  usuario: string
  papel: Papel
  lojaId: string | null
}

function hashDoToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** O endereço de quem pede. Na Vercel, o primeiro de x-forwarded-for é posto pela própria Vercel. */
function enderecoDe(req: IncomingMessage): string {
  const encaminhado = String(req.headers['x-forwarded-for'] ?? '').split(',')[0]?.trim()
  return (encaminhado || req.socket?.remoteAddress || 'desconhecido').slice(0, 64)
}

/**
 * Conta uma tentativa deste endereço para `assunto` e recusa acima do limite
 * na janela de 15 minutos. Atômico: pedidos simultâneos não passam juntos.
 */
export async function freioPorEndereco(sql: Sql, req: IncomingMessage, assunto: string, limite: number): Promise<void> {
  const chave = `${assunto}:${enderecoDe(req)}`
  const [linha] = await sql`
    insert into tentativas (endereco, janela, total) values (${chave}, now(), 1)
    on conflict (endereco) do update set
      total = case when tentativas.janela < now() - make_interval(mins => ${MINUTOS_DE_FREIO}) then 1 else tentativas.total + 1 end,
      janela = case when tentativas.janela < now() - make_interval(mins => ${MINUTOS_DE_FREIO}) then now() else tentativas.janela end
    returning total`
  if (Number(linha?.total) > limite) {
    throw new ErroDoCliente(`muitas tentativas deste endereço; espere ${MINUTOS_DE_FREIO} minutos`, 429)
  }
}

/**
 * Cria o primeiro administrador a partir de ADMIN_INICIAL ("usuario:sal:hash")
 * quando não há nenhum ativo. Com um administrador ativo, não muda nada.
 */
async function garantirAdmin(sql: Sql): Promise<void> {
  const [usuario, sal, hash] = (process.env.ADMIN_INICIAL ?? '').split(':')
  if (!usuario || !sal || !hash) return
  const [linha] = await sql`select count(*)::int as total from contas where papel = 'admin' and ativo`
  if (Number(linha?.total) > 0) return
  await sql`insert into contas (usuario, senha, papel) values (${usuario.toLowerCase()}, ${`${sal}:${hash}`}, 'admin')
            on conflict (usuario) do update set senha = excluded.senha, papel = 'admin', ativo = true, erros = 0, bloqueado_ate = null`
}

/**
 * Mesma resposta para usuário inexistente, senha errada e usuário travado:
 * quem está de fora não descobre quem existe nem quem travou.
 */
const NAO_CONFERE = `usuário ou senha não conferem (depois de ${ERROS_ANTES_DO_FREIO} erros, o acesso trava por ${MINUTOS_DE_FREIO} minutos)`

async function abrirSessao(sql: Sql, res: ServerResponse, usuario: string): Promise<void> {
  const token = novoToken()
  await sql`insert into sessoes (token_hash, usuario, expira_em)
            values (${hashDoToken(token)}, ${usuario}, now() + make_interval(days => ${DIAS_DE_SESSAO}))`
  await sql`delete from sessoes where expira_em < now()`
  res.setHeader('Set-Cookie', cookieDaSessao(token))
}

export async function entrar(req: IncomingMessage, res: ServerResponse, usuarioDigitado: string, senha: string): Promise<Sessao> {
  const sql = await banco()
  await garantirAdmin(sql)
  const usuario = usuarioDigitado.trim().toLowerCase()
  await freioPorEndereco(sql, req, 'entrar', 20)

  // A tentativa é reservada antes de conferir a senha, numa instrução só: cem
  // pedidos ao mesmo tempo não passam do limite, porque o banco faz fila na linha.
  const [reserva] = await sql`
    update contas set
      erros = case when bloqueado_ate < now() then 1 else erros + 1 end,
      bloqueado_ate = case when (case when bloqueado_ate < now() then 1 else erros + 1 end) >= ${ERROS_ANTES_DO_FREIO}
                           then now() + make_interval(mins => ${MINUTOS_DE_FREIO}) end
     where usuario = ${usuario} and ativo and (bloqueado_ate is null or bloqueado_ate < now())
    returning senha, papel, loja_id`

  // O hash roda sempre, até para usuário inexistente ou travado: o tempo da
  // resposta não conta quem existe.
  const ok = await confereEmTempoConstante(senha, reserva ? String(reserva.senha) : undefined)
  if (!ok || !reserva) throw new ErroDoCliente(NAO_CONFERE, 401)

  await sql`update contas set erros = 0, bloqueado_ate = null where usuario = ${usuario}`
  await sql`delete from tentativas where janela < now() - interval '1 day'`
  await abrirSessao(sql, res, usuario)
  return { usuario, papel: reserva.papel as Papel, lojaId: reserva.loja_id ? String(reserva.loja_id) : null }
}

/** Conta nova de lojista, já com a loja (pendente) e já logada. */
export async function cadastrarLojista(
  req: IncomingMessage, res: ServerResponse,
  conta: { usuario: string; senha: string },
  loja: { id: string; cidadeId: string; nome: string; categoria: string; whatsapp: string; endereco: string; descricao: string }
): Promise<Sessao> {
  const sql = await banco()
  await freioPorEndereco(sql, req, 'cadastro', 5)
  const [cidade] = await sql`select id from cidades where id = ${loja.cidadeId}`
  if (!cidade) throw new ErroDoCliente('cidade desconhecida')
  const senha = await embaralhar(conta.senha)
  try {
    await sql.transaction([
      sql`insert into lojas (id, cidade_id, nome, categoria, whatsapp, endereco, descricao)
          values (${loja.id}, ${loja.cidadeId}, ${loja.nome}, ${loja.categoria}, ${loja.whatsapp}, ${loja.endereco}, ${loja.descricao})`,
      sql`insert into contas (usuario, senha, papel, loja_id) values (${conta.usuario}, ${senha}, 'lojista', ${loja.id})`
    ])
  } catch (erro) {
    // 23505 = chave repetida: o usuário já existe.
    if ((erro as { code?: string }).code === '23505') throw new ErroDoCliente('esse usuário já existe; escolha outro')
    throw erro
  }
  await abrirSessao(sql, res, conta.usuario)
  return { usuario: conta.usuario, papel: 'lojista', lojaId: loja.id }
}

export async function sair(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const token = tokenDoCookie(req.headers.cookie)
  if (token) {
    const sql = await banco()
    await sql`delete from sessoes where token_hash = ${hashDoToken(token)}`
  }
  res.setHeader('Set-Cookie', cookieApagado())
}

/** Quem está logado, ou null — sem exigir. */
export async function quemEsta(req: IncomingMessage): Promise<Sessao | null> {
  const token = tokenDoCookie(req.headers.cookie)
  if (!token) return null
  const sql = await banco()
  const [linha] = await sql`
    select c.usuario, c.papel, c.loja_id from sessoes s join contas c on c.usuario = s.usuario
     where s.token_hash = ${hashDoToken(token)} and s.expira_em > now() and c.ativo`
  return linha ? { usuario: String(linha.usuario), papel: linha.papel as Papel, lojaId: linha.loja_id ? String(linha.loja_id) : null } : null
}

/**
 * Quem está logado com este papel, ou erro. Pedidos que mudam algo precisam
 * também do cabeçalho X-Requested-With: outro site não consegue mandá-lo sem
 * permissão do navegador, e isso fecha a porta do CSRF.
 */
export async function exigirConta(req: IncomingMessage, papel: Papel): Promise<Sessao> {
  if (req.method !== 'GET' && req.headers['x-requested-with'] !== 'ofertas') {
    throw new ErroDoCliente('pedido sem a marca do site', 403)
  }
  const sessao = await quemEsta(req)
  if (!sessao) throw new ErroDoCliente('entre com usuário e senha', 401)
  if (sessao.papel !== papel) throw new ErroDoCliente('sem permissão', 403)
  if (papel === 'lojista' && !sessao.lojaId) throw new ErroDoCliente('conta sem loja', 403)
  return sessao
}
