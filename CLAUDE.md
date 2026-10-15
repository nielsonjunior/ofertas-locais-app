# CLAUDE.md

**Ofertas Locais**: uma espécie de TikTok Shop local. O consumidor escolhe a
cidade e rola um feed em tela cheia com os produtos à venda nas lojas dela;
gostou, chama a loja no WhatsApp. O lojista se cadastra e posta; o
administrador aprova a loja antes de ela aparecer. Começa por Cáceres/MT.
O porquê de cada decisão está em `docs/specs/2026-10-16-vitrine-local-design.md`.

Tudo em **português**: código, nomes, comentários, testes, commits e telas.

## Comandos

```bash
npm install
npm test               # vitest; testes de banco pulam sem DATABASE_URL_TESTE
npm run typecheck      # tsc -b
npm run build          # tsc -b + vite build
npm run dev            # http://localhost:5173
npm run criar-admin    # gera ADMIN_INICIAL (usuario:sal:hash) para a Vercel
```

Testes de ponta a ponta (endereços de verdade contra um Postgres comum, com
armazém de fotos e WhatsApp de mentira):

```bash
DATABASE_URL_TESTE=postgres://postgres@127.0.0.1:5432/ofertas_teste npm test
```

O banco precisa ter "teste" no nome: o teste apaga tudo antes de rodar.
Para o `npm run dev` usar um Postgres comum no lugar do Neon:
`DATABASE_URL_LOCAL=postgres://…`.

## Onde fica cada coisa

| Pasta | Regra |
|---|---|
| `src/dominio/` | Regras puras: dinheiro, telefone e link do WhatsApp, categorias, cadastro, ordem do feed, busca, conversa do robô. **Não importa tela, banco nem rede.** |
| `src/dados/` | Conversa com `/api` e encolhe foto antes de enviar. |
| `src/ui/` | React. `Feed`/`TelaDoProduto` (o feed), `Paginas` (cidade, produto, loja, busca, salvos), `Vender` (cadastro e painel do lojista), `Admin`. Roteamento próprio em `rota.tsx`. |
| `api/` | Funções da Vercel, só com `node:http`. `publico` (sem login), `conta` (entrar, cadastrar), `loja` (lojista), `admin`, `whatsapp`. Arquivo com `_` é módulo interno. |
| `servidor/` | `api-local.ts` (endereços no `npm run dev`) e `pgLocal.ts` (Postgres comum fingindo ser Neon; nunca publicado). |
| `testes/` | Vitest. Um arquivo por assunto; `pontaAPonta.test.ts` cobre o caminho inteiro. |

Endereço novo em `api/` entra também em `ENDERECOS` de `servidor/api-local.ts`.

## Regras que não podem quebrar

- **O público só vê produto ativo de loja aprovada** (`api/_vitrine.ts`). Site e robô do WhatsApp leem da mesma função.
- **Loja nasce pendente.** Trocar nome ou WhatsApp de loja aprovada volta para análise; loja recusada que corrige volta para a fila; bloqueada derruba a sessão do lojista.
- **Toda instrução do lojista filtra pela loja da sessão** (`and loja_id = ${loja}`). O id que vem do navegador nunca basta.
- **Quem protege o dado é o servidor.** `exigirConta(req, papel)` em todo endereço de lojista e admin; o que muda algo exige `X-Requested-With: ofertas` (CSRF), inclusive entrar e cadastrar.
- **Fotos no Blob público, nome aleatório, pasta da loja.** O produto só aceita foto da própria pasta (`fotosDaLoja`); o tipo vem dos bytes (`_tipo.ts`).
- **Dinheiro em centavos, inteiro.** `paraCentavos` lê, `emReais` mostra.
- **WhatsApp guardado só com dígitos e DDD** (`normalizarWhatsapp`); o link é montado por `linkDoWhatsapp`.
- **Feed nunca põe dois seguidos da mesma loja** se houver outra para intercalar (`ordenarFeed`).
- **Login:** mesma resposta para usuário inexistente, senha errada e travado; tentativa reservada antes do hash; freio por endereço.
- **Consumidor não tem conta.** Salvos ficam no aparelho. Do robô do WhatsApp guardamos só número e cidade; "SAIR" apaga.
- **Imports em `api/` (e no que `api/` importa) terminam em `.js`**; o teste `importsDoServidor` barra.
- **Segredo nunca no repositório.** `.env` está no `.gitignore`; o modelo é `.env.example`.

## Como o código é escrito

- TypeScript estrito, `noUncheckedIndexedAccess`, `import type` para tipos.
- Regra nova nasce em `src/dominio/` com teste antes; tela e servidor só chamam.
- Comentário diz **por quê**, em português corrido.
- Mensagem de erro (`ErroDoCliente`) é escrita para quem lê na tela.
- Tabelas se criam sozinhas em `api/_banco.ts` (`create table if not exists`).
  Mudança de coluna em tabela que já existe precisa de `alter table … if not exists` ali também.

## Trabalho

- Projeto com **ECC** instalado (plugin `ecc@ecc`, escopo do projeto, sem
  hooks): planejar → teste antes → revisão em contexto novo
  (`ecc:code-reviewer`, `ecc:security-reviewer`).
- Antes de commitar: `npm test`, `npm run typecheck`, `npm run build`.
- Commit em português, dizendo o que mudou para quem usa.
