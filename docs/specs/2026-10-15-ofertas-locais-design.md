# Ofertas Locais — o panfleto do mercado no celular, no site e no WhatsApp

Data: 2026-10-15

## O problema

Todo mercado imprime panfleto toda semana. Custa dinheiro, vai para o lixo em
dias, e o consumidor só vê o panfleto que caiu na mão dele. Para comparar o
preço do arroz entre três mercados da cidade, ele precisaria dos três papéis.

## O que vamos construir

Os panfletos da cidade, digitalizados, **produto por produto**:

1. **Site (PWA)** — o consumidor escolhe a cidade e vê os panfletos válidos da
   semana; busca um produto ("arroz 5kg", "picanha") e vê o preço em cada
   mercado, do mais barato para o mais caro, com o preço por kg/litro.
2. **WhatsApp** — o mesmo conteúdo como conversa normal. O consumidor manda
   "oi", diz a cidade uma vez e daí pergunta o que quiser: "arroz", "ofertas do
   Atacadão", "panfletos". O robô responde com as ofertas e o link do panfleto.
3. **Digitalização** — chega a foto ou o PDF do panfleto; uma IA (Claude, com
   visão) lê cada produto, preço, unidade e condição; uma pessoa confere e
   publica. A oferta sai do ar sozinha quando a validade vence.

O consumidor nunca precisa de conta. Ninguém paga para ver.

## Por que o panfleto é "lido" e não só fotografado

Uma foto do panfleto resolve o "ter no celular", mas não resolve o "onde está
mais barato". Ler produto por produto é o que permite a busca, a comparação e
a resposta curta no WhatsApp. A foto continua lá, como prova e para quem
prefere folhear.

## Por que alguém confere antes de publicar

Preço errado no ar é problema com o mercado e com o consumidor (CDC: o preço
anunciado vale). A IA lê bem, mas panfleto tem letra miúda, "leve 3 pague 2",
preço de clube, "a partir de". Nada é publicado sem uma pessoa ter olhado a
tela de conferência, que mostra cada item ao lado do recorte do panfleto e
marca em amarelo o que a IA não tinha certeza.

## WhatsApp — o que dá e o que não dá

- **Canal do WhatsApp não tem API oficial de publicação.** Ferramentas que
  postam em canal usam sessão do WhatsApp Web, contra os termos — o número pode
  ser banido. Canal por cidade pode existir como vitrine, alimentado à mão;
  o produto não depende dele.
- **A conversa usa a API oficial (WhatsApp Business Cloud API, da Meta).**
  Responder a quem escreveu, dentro de 24 h, não é cobrado (mensagem de
  serviço).
- **Mandar oferta sem o consumidor ter escrito** ("chegou o panfleto do
  Atacadão") é mensagem de **marketing**, cobrada por mensagem pela Meta, com
  modelo aprovado e consentimento prévio. Fica para a fase 2, só para quem
  pedir alerta, com "SAIR" funcionando sempre.
- Preços da Meta mudam e as tabelas de terceiros discordam: conferir na tabela
  oficial antes de orçar a fase 2.

## Quem usa

| Quem | O que faz | Fase |
|---|---|---|
| Consumidor | vê panfletos, busca, compara; site ou WhatsApp | 1 |
| Equipe (nós) | cadastra mercado, envia panfleto, confere, publica | 1 |
| Mercado | envia o próprio panfleto e acompanha visualizações | 2 |

Na fase 1 **nós** digitalizamos os panfletos que os mercados já imprimem — é
como o produto ganha conteúdo antes de pedir qualquer coisa ao mercado.
Começa por **Cáceres/MT**.

## Modelo

```
cidade      id, nome, uf                       ("caceres-mt")
mercado     id, cidade, nome, endereco, whatsapp?, ativo
panfleto    id, mercado, validoDe, validoAte, arquivos[], estado
            estado: lendo → conferir → publicado (→ vencido, por data)
oferta      id, panfleto, produto, marca?, quantidade?, unidade?,
            preco (centavos), precoDe? (centavos), condicao?,
            pagina, confianca ('alta'|'baixa'), conferida
contato     wa_id, cidade?, etapa, atualizadoEm      (WhatsApp)
equipe      usuario, senha (scrypt), ativo
```

- Dinheiro **sempre em centavos, inteiro**. Nada de `0.1 + 0.2`.
- **Preço por unidade** (R$/kg, R$/L, R$/un) é calculado, nunca digitado:
  `500 g por R$ 4,99` → `R$ 9,98/kg`. Sem quantidade, não há comparação — a
  oferta aparece, mas fora do ranking por kg.
- **Validade** é por data local de Cuiabá (`America/Cuiaba`): a oferta vale
  até o fim do dia `validoAte`.

## Busca

Sem banco de busca na fase 1. A busca roda sobre as ofertas válidas da cidade
(centenas, não milhões): sem acento, sem maiúscula, singular/plural simples,
todas as palavras da busca precisam aparecer. "arroz 5kg" acha "Arroz Tipo 1
Tio João 5 kg". Ordena pelo preço por unidade quando todas têm, senão pelo
preço.

## Conversa do WhatsApp (fase 1)

```
qualquer mensagem, sem cidade → pergunta a cidade (lista das cidades)
cidade escolhida              → "Pronto! Me diga um produto ou PANFLETOS"
"panfletos"                   → mercados com panfleto válido + link de cada
"cidade"                      → troca a cidade
"sair"                        → apaga o contato
qualquer outro texto          → busca; até 5 ofertas, mais barata primeiro,
                                + link "ver todas" no site
```

A conversa é uma função pura `(contato, texto, ofertasDaCidade) → (contato,
respostas)`; o webhook só a chama e envia. O webhook confere a assinatura
`X-Hub-Signature-256` (HMAC-SHA256 com o segredo do app) antes de ler o corpo.

## Dados pessoais (LGPD)

Do consumidor guardamos só o número do WhatsApp, a cidade e a etapa da
conversa. "SAIR" apaga. Nada de nome, nada de histórico de busca ligado ao
número.

## Pilha

Mesma do Quadro de Máquinas, que já roda em produção:
Vite + React + TypeScript; funções da Vercel em `api/` escritas só com
`node:http`; Postgres (Neon); arquivos no Vercel Blob; Vitest.
IA: Claude (`claude-opus-5-5`) via `@anthropic-ai/sdk`, saída estruturada
validada com Zod.

## Fora da fase 1

Painel do mercado, alerta ativo no WhatsApp, mapa, lista de compras,
estatística para o mercado, outras cidades.
