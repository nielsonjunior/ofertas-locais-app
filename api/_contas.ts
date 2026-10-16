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

const MINUTOS_DE_FREIO = 15
/** Tentativas de um mesmo endereço para um mesmo usuário, por janela. */
const TENTATIVAS_POR_PAR = 5
/**
 * Teto por usuário, somando todos os endereços: segura quem distribui chutes
 * por muitos endereços, e é alto o bastante para que travar o administrador
 * de propósito custe caro.
 */
const TENTATIVAS_POR_CONTA = 100

/** Lojas novas por hora, no site todo. */
const CADASTROS_POR_HORA = 30

export type Papel = 'admin' | 'lojista'

export interface Sessao {
  usuario: string
  papel: Papel
  lojaId: string | null
}

function hashDoToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Expande "2001:db8::1" para os 8 grupos, para cortar no /64. */
function expandirIpv6(ip: string): string[] {
  const [inicio = '', fim = ''] = ip.split('::')
  const a = inicio ? inicio.split(':') : []
  const b = ip.includes('::') ? (fim ? fim.split(':') : []) : []
  return [...a, ...Array(Math.max(0, 8 - a.length - b.length)).fill('0'), ...b]
}

/**
 * O endereço de quem pede. Na Vercel, o primeiro de x-forwarded-for é posto
 * pela própria Vercel. IPv6 conta pelo /64: uma casa recebe milhões de
 * endereços, e trocar o final não pode zerar o freio.
 */
export function enderecoDe(req: IncomingMessage): string {
  const encaminhado = String(req.headers['x-forwarded-for'] ?? '').split(',')[0]?.trim()
  const ip = (encaminhado || req.socket?.remoteAddress || 'desconhecido').slice(0, 64)
  if (ip.includes(':') && !ip.includes('.')) return `${expandirIpv6(ip).slice(0, 4).join(':')}::/64`
  return ip
}

/**
 * Conta uma tentativa para `chave` e devolve quantas já houve na janela de
 * 15 minutos. Atômico: pedidos simultâneos não passam juntos.
 */
async function contar(sql: Sql, chave: string): Promise<number> {
  const [linha] = await sql`
    insert into tentativas (endereco, janela, total) values (${chave.slice(0, 200)}, now(), 1)
    on conflict (endereco) do update set
      total = case when tentativas.janela < now() - make_interval(mins => ${MINUTOS_DE_FREIO}) then 1 else tentativas.total + 1 end,
      janela = case when tentativas.janela < now() - make_interval(mins => ${MINUTOS_DE_FREIO}) then now() else tentativas.janela end
    returning total`
  // Faxina de vez em quando, para a tabela não crescer sem fim.
  if (Math.random() < 0.02) await sql`delete from tentativas where janela < now() - interval '1 day'`
  return Number(linha?.total)
}

/** Recusa acima de `limite` tentativas deste endereço para `assunto`, na janela de 15 minutos. */
export async function freioPorEndereco(sql: Sql, req: IncomingMessage, assunto: string, limite: number, mensagem = ''): Promise<void> {
  if (await contar(sql, `${assunto}:${enderecoDe(req)}`) > limite) {
    throw new ErroDoCliente(mensagem || `muitas tentativas deste endereço; espere ${MINUTOS_DE_FREIO} minutos`, 429)
  }
}

function usuarioDoAdminInicial(): string {
  return (process.env.ADMIN_INICIAL ?? '').split(':')[0]?.trim().toLowerCase() ?? ''
}

/** Nomes que lojista não pode escolher: o do administrador inicial e os que parecem oficiais. */
const RESERVADOS = new Set(['admin', 'administrador', 'adm', 'root', 'suporte', 'ofertas', 'ofertaslocais', 'equipe', 'moderacao'])

export function usuarioReservado(usuario: string): boolean {
  return RESERVADOS.has(usuario) || usuario === usuarioDoAdminInicial()
}

/**
 * Cria o primeiro administrador a partir de ADMIN_INICIAL ("usuario:sal:hash")
 * quando não há nenhum ativo. Com um administrador ativo, não muda nada.
 *
 * Nunca transforma uma conta de lojista em administrador: se o nome já for de
 * um lojista, alguém o pegou antes — e herdaria a sessão aberta como admin.
 */
async function garantirAdmin(sql: Sql): Promise<void> {
  const [usuarioBruto, sal, hash] = (process.env.ADMIN_INICIAL ?? '').split(':')
  const usuario = usuarioBruto?.trim().toLowerCase()
  if (!usuario || !sal || !hash) return
  const [linha] = await sql`select count(*)::int as total from contas where papel = 'admin' and ativo`
  if (Number(linha?.total) > 0) return
  const feitas = await sql`
    insert into contas (usuario, senha, papel) values (${usuario}, ${`${sal}:${hash}`}, 'admin')
    on conflict (usuario) do update set senha = excluded.senha, ativo = true
     where contas.papel = 'admin'
    returning usuario`
  if (feitas.length === 0) {
    console.error('ADMIN_INICIAL usa um nome que já é de lojista; escolha outro usuário para o administrador')
    return
  }
  // Senha nova: sessão antiga deste nome não vale mais.
  await sql`delete from sessoes where usuario = ${usuario}`
}

/** Mesma resposta para usuário inexistente e senha errada: quem está de fora não descobre quem existe. */
const NAO_CONFERE = 'usuário ou senha não conferem'

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
  const endereco = enderecoDe(req)

  // Os freios contam antes de conferir a senha, cada um numa instrução só:
  // cem pedidos ao mesmo tempo não passam juntos. Valem igual para usuário
  // que existe e que não existe, então não contam quem existe.
  //  - por endereço, qualquer usuário: quem varre muitos nomes;
  //  - por usuário e endereço: quem chuta a senha de uma conta;
  //  - por usuário, todos os endereços: quem distribui os chutes.
  // Travar por endereço+usuário, e não só por usuário, impede que um
  // estranho deixe o administrador do lado de fora com 5 senhas erradas.
  const espere = `muitas tentativas; espere ${MINUTOS_DE_FREIO} minutos`
  if (await contar(sql, `entrar:${endereco}`) > 20) throw new ErroDoCliente(espere, 429)
  if (await contar(sql, `par:${usuario}:${endereco}`) > TENTATIVAS_POR_PAR) throw new ErroDoCliente(espere, 429)
  if (await contar(sql, `conta:${usuario}`) > TENTATIVAS_POR_CONTA) throw new ErroDoCliente(espere, 429)

  const [conta] = await sql`
    select c.senha, c.papel, c.loja_id, l.estado as estado_da_loja
      from contas c left join lojas l on l.id = c.loja_id
     where c.usuario = ${usuario} and c.ativo`

  // O hash roda sempre, até para usuário inexistente: o tempo da resposta não conta quem existe.
  const ok = await confereEmTempoConstante(senha, conta ? String(conta.senha) : undefined)
  if (!ok || !conta) throw new ErroDoCliente(NAO_CONFERE, 401)
  if (conta.estado_da_loja === 'bloqueada') throw new ErroDoCliente('esta loja foi bloqueada; fale com o suporte', 403)

  // Acertou: os erros deste endereço não contam mais contra ele.
  await sql`delete from tentativas where endereco = ${`par:${usuario}:${endereco}`.slice(0, 200)}`
  await abrirSessao(sql, res, usuario)
  return { usuario, papel: conta.papel as Papel, lojaId: conta.loja_id ? String(conta.loja_id) : null }
}

/** Conta nova de lojista, já com a loja (pendente) e já logada. */
export async function cadastrarLojista(
  req: IncomingMessage, res: ServerResponse,
  conta: { usuario: string; senha: string },
  loja: { id: string; cidadeId: string; nome: string; categoria: string; whatsapp: string; endereco: string; descricao: string }
): Promise<Sessao> {
  if (usuarioReservado(conta.usuario)) throw new ErroDoCliente('esse usuário já existe; escolha outro')
  const sql = await banco()
  await freioPorEndereco(sql, req, 'cadastro', 5)
  // Teto geral por hora: trocar de endereço não basta para enterrar a fila
  // de aprovação com lojas falsas.
  const [recentes] = await sql`select count(*)::int as total from lojas where criada_em > now() - interval '1 hour' and not teste`
  if (Number(recentes?.total) >= CADASTROS_POR_HORA) throw new ErroDoCliente('muitos cadastros agora; tente de novo em alguns minutos', 429)
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
  // Loja bloqueada perde o acesso na hora, mesmo com sessão aberta.
  const [linha] = await sql`
    select c.usuario, c.papel, c.loja_id from sessoes s
      join contas c on c.usuario = s.usuario
      left join lojas l on l.id = c.loja_id
     where s.token_hash = ${hashDoToken(token)} and s.expira_em > now() and c.ativo
       and (c.papel = 'admin' or l.estado <> 'bloqueada')`
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
