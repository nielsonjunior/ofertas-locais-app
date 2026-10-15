# Ofertas Locais

Os panfletos dos mercados da sua cidade, no celular — no site e no WhatsApp.

O mercado já imprime panfleto toda semana. Aqui ele vira **produto por
produto**: o consumidor busca "arroz" e vê o preço em cada mercado, do mais
barato para o mais caro, com o preço por quilo para comparar tamanhos
diferentes. Começa por Cáceres/MT.

- **Site** — escolha a cidade, veja os panfletos valendo hoje, busque e compare.
- **WhatsApp** — mande "oi", escolha a cidade, mande o nome do produto.
- **Equipe** (`/equipe`) — envia a foto ou o PDF do panfleto, a IA lê cada
  oferta, uma pessoa confere e publica. A oferta sai do ar sozinha quando vence.

O desenho completo está em [docs/specs](docs/specs). O código antigo ficou no
ramo `legado`.

## Pôr no ar (Vercel)

1. Importe o repositório na Vercel (framework: Vite).
2. Em *Storage*, crie um banco **Neon (Postgres)** e um **Blob**; os dois
   preenchem `DATABASE_URL` e `BLOB_READ_WRITE_TOKEN` sozinhos. As tabelas se
   criam sozinhas.
3. Em *Settings › Environment Variables*:
   - `ANTHROPIC_API_KEY` — para a leitura do panfleto.
   - `EQUIPE_INICIAL` — gere com `npm run criar-equipe` no seu computador.
   - `SITE_URL` — o endereço do site, para os links do WhatsApp.
4. Entre em `/equipe` com o usuário criado.

### WhatsApp

1. Em developers.facebook.com, crie um app do tipo *Business* e adicione o
   produto **WhatsApp**. Cadastre o número.
2. Na Vercel: `WHATSAPP_TOKEN` (token permanente de usuário do sistema),
   `WHATSAPP_NUMERO_ID` (Phone number ID), `WHATSAPP_SEGREDO_APP` (App Secret,
   em *Configurações › Básico*) e `WHATSAPP_VERIFICACAO` (uma frase que você
   inventa).
3. Em *WhatsApp › Configuração › Webhook*: URL `https://SEU-SITE/api/whatsapp`,
   token de verificação = a mesma frase. Assine o campo **messages**.

Responder a quem escreveu não é cobrado pela Meta. Mandar oferta sem a pessoa
ter escrito é mensagem de marketing, cobrada — não existe nesta versão.

## Rodar no computador

```bash
npm install
cp .env.example .env    # preencha o que for usar
npm run dev
```

Sem Neon, use um Postgres comum: `DATABASE_URL_LOCAL=postgres://… npm run dev`.

## Conferir

```bash
npm test
npm run typecheck
npm run build
```
