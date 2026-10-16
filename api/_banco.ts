import { neon } from '@neondatabase/serverless'
import type { NeonQueryFunction } from '@neondatabase/serverless'
import { urlDoBanco } from './_ambiente.js'

/**
 * Conexão com o Postgres (Neon) e as tabelas, criadas sozinhas na primeira
 * chamada de cada instância — não há SQL para rodar à mão.
 *
 * Dinheiro em centavos (integer).
 */

export type Sql = NeonQueryFunction<false, false>

let conexao: Sql | null = null
let pronto: Promise<void> | null = null

export function temBanco(): boolean {
  return Boolean(urlDoBanco())
}

function conectar(): Sql {
  if (conexao) return conexao
  const url = urlDoBanco()
  if (!url) throw new Error('o banco não está ligado neste site (DATABASE_URL); veja /api/saude')
  conexao ??= neon(url)
  return conexao
}

const TABELAS = [
  `create table if not exists cidades (
    id text primary key,
    nome text not null,
    uf text not null
  )`,
  // Loja só aparece no feed aprovada. Trocar nome ou WhatsApp volta para
  // pendente: é assim que se barra golpe em conta tomada (ver api/loja.ts).
  `create table if not exists lojas (
    id text primary key,
    cidade_id text not null references cidades(id),
    nome text not null,
    categoria text not null,
    whatsapp text not null,
    endereco text not null default '',
    descricao text not null default '',
    estado text not null default 'pendente',
    criada_em timestamptz not null default now()
  )`,
  `create index if not exists lojas_da_cidade on lojas (cidade_id, estado)`,
  // Loja de dados de teste (admin › Exemplos): não abre WhatsApp e some com um botão.
  `alter table lojas add column if not exists teste boolean not null default false`,
  `create table if not exists contas (
    usuario text primary key,
    senha text not null,
    papel text not null check (papel in ('admin', 'lojista')),
    loja_id text references lojas(id) on delete cascade,
    ativo boolean not null default true
  )`,
  // O token da sessão fica só no cookie; aqui vai o hash dele.
  `create table if not exists sessoes (
    token_hash text primary key,
    usuario text not null references contas(usuario) on delete cascade,
    expira_em timestamptz not null
  )`,
  // Contadores dos freios (login, cadastro, denúncia, vistas), numa janela de
  // 15 minutos. A chave diz o assunto e de quem: "entrar:1.2.3.4".
  `create table if not exists tentativas (
    endereco text primary key,
    janela timestamptz not null,
    total integer not null
  )`,
  `create table if not exists produtos (
    id text primary key,
    loja_id text not null references lojas(id) on delete cascade,
    titulo text not null,
    descricao text not null default '',
    categoria text not null,
    preco integer not null check (preco > 0),
    preco_de integer,
    fotos jsonb not null default '[]',
    ativo boolean not null default true,
    -- Tirado do ar pela administração: o lojista não reativa (ativo é só dele).
    removido boolean not null default false,
    criado_em timestamptz not null default now(),
    vistas integer not null default 0,
    cliques integer not null default 0
  )`,
  // Toda foto enviada, com a loja dona. O produto só aceita foto desta lista:
  // assim não entra endereço de outro armazém, nem de outra loja.
  `create table if not exists fotos (
    url text primary key,
    loja_id text not null references lojas(id) on delete cascade,
    criada_em timestamptz not null default now()
  )`,
  `create index if not exists fotos_da_loja on fotos (loja_id, criada_em)`,
  `create index if not exists produtos_da_loja on produtos (loja_id, criado_em desc)`,
  `create table if not exists denuncias (
    id text primary key,
    produto_id text not null references produtos(id) on delete cascade,
    motivo text not null,
    criada_em timestamptz not null default now(),
    resolvida boolean not null default false
  )`,
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
