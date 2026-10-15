# Ofertas Locais

O que as lojas da sua cidade estão vendendo, agora — num feed como o do
TikTok. Role, encontre e chame a loja no WhatsApp.

- **Consumidor** — escolhe a cidade e rola o feed em tela cheia: foto, preço,
  loja. Filtra por categoria, busca, salva, compartilha e toca em **Chamar no
  WhatsApp**: a conversa abre com a mensagem pronta. Não precisa de conta.
- **Lojista** (`/vender`) — cria a loja, posta produtos com até 5 fotos, pausa
  quando acaba o estoque e vê quantas vezes cada produto foi visto e quantas
  pessoas chamaram.
- **Administrador** (`/admin`) — aprova as lojas antes de aparecerem, recusa,
  bloqueia e cuida das denúncias.
- **Robô do WhatsApp** (opcional) — a pessoa manda "tênis" e recebe os
  produtos da cidade com o link.

O desenho completo está em [docs/specs](docs/specs). O código do primeiro
projeto ficou no ramo `legado`, e o do panfleto digital no histórico (`6eadda4`).

## Pôr no ar (Vercel)

1. Importe o repositório na Vercel (framework: Vite).
2. Em *Storage*, crie um banco **Neon (Postgres)** e um **Blob**; os dois
   preenchem `DATABASE_URL` e `BLOB_READ_WRITE_TOKEN` sozinhos. As tabelas se
   criam sozinhas.
3. Em *Settings › Environment Variables*:
   - `ADMIN_INICIAL` — gere com `npm run criar-admin` no seu computador.
   - `SITE_URL` — o endereço do site, para os links do robô do WhatsApp.
4. Entre em `/admin` com o usuário criado. Cáceres já vem cadastrada.

### Robô do WhatsApp (opcional)

O botão "Chamar no WhatsApp" funciona sem nada disto. O robô é para quem
quiser buscar produtos conversando com um número da Ofertas Locais.

1. Em developers.facebook.com, crie um app do tipo *Business* e adicione o
   produto **WhatsApp**. Cadastre o número.
2. Na Vercel: `WHATSAPP_TOKEN`, `WHATSAPP_NUMERO_ID`, `WHATSAPP_SEGREDO_APP`
   (App Secret) e `WHATSAPP_VERIFICACAO` (uma frase que você inventa).
3. Em *WhatsApp › Configuração › Webhook*: URL `https://SEU-SITE/api/whatsapp`,
   token de verificação = a mesma frase. Assine o campo **messages**.

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
