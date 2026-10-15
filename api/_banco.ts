import { neon } from '@neondatabase/serverless'
import type { NeonQueryFunction } from '@neondatabase/serverless'

/**
 * Conexão com o Postgres (Neon) e as tabelas, criadas sozinhas na primeira
 * chamada de cada instância — não há SQL para rodar à mão.
 *
 * Dinheiro em centavos (integer). Datas de validade em texto AAAA-MM-DD,
 * comparadas com a data de Cuiabá (src/dominio/validade.ts).
 */

export type Sql = NeonQueryFunction<false, false>

let conexao: Sql | null = null
let pronto: Promise<void> | null = null

export function temBanco(): boolean {
  return Boolean(process.env.DATABASE_URL ?? process.env.POSTGRES_URL)
}

function conectar(): Sql {
  if (conexao) return conexao
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
  if (!url) throw new Error('o banco não está ligado neste site (DATABASE_URL)')
  conexao ??= neon(url)
  return conexao
}

const TABELAS = [
  `create table if not exists cidades (
    id text primary key,
    nome text not null,
    uf text not null
  )`,
  `create table if not exists mercados (
    id text primary key,
    cidade_id text not null references cidades(id),
    nome text not null,
    endereco text not null default '',
    ativo boolean not null default true,
    criado_em timestamptz not null default now()
  )`,
  `create table if not exists panfletos (
    id text primary key,
    mercado_id text not null references mercados(id),
    valido_de text not null default '',
    valido_ate text not null default '',
    estado text not null default 'lendo',
    paginas jsonb not null default '[]',
    criado_por text not null,
    criado_em timestamptz not null default now(),
    publicado_em timestamptz
  )`,
  `create index if not exists panfletos_vitrine on panfletos (estado, valido_ate)`,
  `create table if not exists ofertas (
    id text primary key,
    panfleto_id text not null references panfletos(id) on delete cascade,
    produto text not null,
    marca text not null default '',
    quantidade text not null default '',
    preco integer not null check (preco > 0),
    preco_de integer,
    condicao text not null default '',
    pagina integer not null default 1,
    confianca text not null default 'alta'
  )`,
  `create index if not exists ofertas_do_panfleto on ofertas (panfleto_id)`,
  `create table if not exists contatos (
    wa_id text primary key,
    cidade_id text,
    atualizado_em timestamptz not null default now()
  )`,
  // A Meta reenvia o aviso quando não recebe 200 a tempo: sem isto, a mesma
  // mensagem seria respondida duas vezes.
  `create table if not exists mensagens_vistas (
    id text primary key,
    em timestamptz not null default now()
  )`,
  `create table if not exists equipe (
    usuario text primary key,
    senha text not null,
    ativo boolean not null default true,
    erros integer not null default 0,
    bloqueado_ate timestamptz
  )`,
  // O token da sessão fica só no cookie; aqui vai o hash dele.
  `create table if not exists sessoes (
    token_hash text primary key,
    usuario text not null references equipe(usuario),
    expira_em timestamptz not null
  )`,
  `insert into cidades (id, nome, uf) values ('caceres-mt', 'Cáceres', 'MT') on conflict do nothing`
]

/** Só para os testes: troca a conexão por uma que fala com um Postgres local. */
export function usarConexao(sql: Sql): void {
  conexao = sql
  pronto = null
}

/** O banco, com as tabelas garantidas. */
export async function banco(): Promise<Sql> {
  const sql = conectar()
  pronto ??= (async () => {
    for (const comando of TABELAS) await sql.query(comando)
  })().catch((erro: unknown) => {
    pronto = null
    throw erro
  })
  await pronto
  return sql
}
