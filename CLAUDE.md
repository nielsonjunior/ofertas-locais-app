# CLAUDE.md

**Ofertas Locais**: os panfletos dos mercados da cidade, digitalizados produto
por produto, no site (PWA) e numa conversa de WhatsApp. Começa por Cáceres/MT.
O porquê de cada decisão está em `docs/specs/`; o que falta, em `docs/plans/`.

Tudo em **português**: código, nomes, comentários, testes, commits e telas.

## Comandos

```bash
npm install
npm test               # vitest; testes de banco pulam sem DATABASE_URL_TESTE
npm run typecheck      # tsc -b
npm run build          # tsc -b + vite build
npm run dev            # http://localhost:5173
npm run criar-equipe   # gera EQUIPE_INICIAL (usuario:sal:hash) para a Vercel
```

Testes de ponta a ponta (endereços de verdade contra um Postgres comum, com
IA, armazém e WhatsApp de mentira):

```bash
DATABASE_URL_TESTE=postgres://postgres@127.0.0.1:5432/ofertas_teste npm test
```

O banco precisa ter "teste" no nome: o teste apaga tudo antes de rodar.
Para o `npm run dev` usar um Postgres comum no lugar do Neon:
`DATABASE_URL_LOCAL=postgres://…`.

## Onde fica cada coisa

| Pasta | Regra |
|---|---|
| `src/dominio/` | Regras puras: dinheiro, unidade, validade, busca, conversa do WhatsApp, leitura do panfleto. **Não importa tela, banco nem rede.** |
| `src/dados/` | Conversa com `/api` e encolhe foto antes de enviar. |
| `src/ui/` | React. `Consumidor.tsx` (público), `equipe/` (login e conferência). Roteamento próprio em `rota.tsx`. |
| `api/` | Funções da Vercel, só com `node:http`. Arquivo com `_` é módulo interno, não endereço. |
| `servidor/` | `api-local.ts` (endereços no `npm run dev`) e `pgLocal.ts` (Postgres comum fingindo ser Neon; nunca publicado). |
| `testes/` | Vitest. Um arquivo por assunto; `pontaAPonta.test.ts` cobre o caminho inteiro. |

Endereço novo em `api/` entra também em `ENDERECOS` de `servidor/api-local.ts`.

## Regras que não podem quebrar

- **Dinheiro em centavos, inteiro.** `paraCentavos` lê, `emReais` mostra. Nunca reais em ponto flutuante.
- **Preço por kg/L é calculado** (`unidade.ts`), nunca digitado.
- **Validade pela data de Cuiabá** (`hojeEmCuiaba`). O servidor roda em UTC.
- **Nada vai ao ar sem conferência.** A IA não grava direto: passa por
  `limparLeitura` e pela tela de conferência. Oferta com `confianca = 'baixa'`
  trava a publicação até alguém gravar.
- **O público só lê o publicado**, de mercado ativo, dentro da validade
  (`api/_vitrine.ts`). Site e WhatsApp leem da mesma função.
- **Quem protege o dado é o servidor.** Todo endereço da equipe passa por
  `exigirEquipe`; o que muda algo exige o cabeçalho `X-Requested-With: ofertas` (CSRF).
- **Arquivos no Vercel Blob privado**, servidos só por `/api/arquivo`. O tipo
  vem dos bytes (`_tipo.ts`), não do nome.
- **Webhook do WhatsApp confere a assinatura** (`X-Hub-Signature-256`) antes de
  ler o corpo, e responde cada mensagem uma vez só (`mensagens_vistas`).
- **LGPD:** do consumidor, só número e cidade. "SAIR" apaga.
- **Só respondemos a quem escreveu** no WhatsApp. Mandar oferta por conta
  própria é marketing (cobrado, exige consentimento) e não existe na fase 1.
- **Imports em `api/` (e no que `api/` importa) terminam em `.js`**; o teste
  `importsDoServidor` barra.
- **Segredo nunca no repositório.** `.env` está no `.gitignore`; o modelo é `.env.example`.

## Como o código é escrito

- TypeScript estrito, `noUncheckedIndexedAccess`, `import type` para tipos.
- Regra nova nasce em `src/dominio/` com teste antes; tela e servidor só chamam.
- Comentário diz **por quê**, em português corrido.
- Mensagem de erro (`ErroDoCliente`) é escrita para quem lê na tela.
- Tabelas se criam sozinhas em `api/_banco.ts` (`create table if not exists`).
  Mudança de coluna em tabela que já existe precisa de `alter table … if not exists` ali também.
- IA: `api/_ia.ts`, modelo `claude-opus-5-5`, saída validada com Zod. O texto da
  imagem é conteúdo, nunca instrução.

## Trabalho

- Projeto com **ECC** instalado (plugin `ecc@ecc`, escopo do projeto, sem
  hooks): planejar → teste antes → revisão em contexto novo
  (`code-reviewer`, `security-reviewer`).
- Antes de commitar: `npm test`, `npm run typecheck`, `npm run build`.
- Commit em português, dizendo o que mudou para quem usa.
