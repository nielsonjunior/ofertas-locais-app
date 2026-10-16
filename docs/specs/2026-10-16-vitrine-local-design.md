# Vitrine local — o feed dos produtos à venda na sua cidade

Data: 2026-10-16. Substitui o desenho do panfleto digital
([2026-10-15](2026-10-15-ofertas-locais-design.md)), que fica como histórico.

## A ideia

Uma espécie de **TikTok Shop local**: a pessoa abre o app, escolhe a cidade e
rola um feed de produtos que estão à venda **agora**, nas lojas da cidade dela.
Gostou, toca em **Chamar no WhatsApp** e conversa direto com a loja, que
combina pagamento e entrega como já faz hoje.

Qualquer comércio entra: mercado, roupa, celular, padaria, pet, material de
construção. O lojista se cadastra sozinho, monta a vitrine e posta. Nós só
aprovamos a loja antes de ela aparecer.

## Decisões (do dono do produto, 2026-10-16)

| Pergunta | Decisão | Por quê |
|---|---|---|
| Como a compra acontece | **Chamar a loja no WhatsApp**, com a mensagem pronta | Lança rápido e sem intermediar dinheiro: sem Pix, estorno nem responsabilidade de pagamento |
| O que o lojista posta | **Fotos** (até 5 por produto); vídeo curto na fase 2 | Foto todo lojista tem; vídeo custa para hospedar e converter |
| Quem cadastra | **O lojista**, e nós aprovamos a loja | Escala sem equipe; a aprovação barra golpe |
| Produto novo de loja aprovada | **Vai direto ao ar**, sem aprovação (decidido em 2026-10-16) | Lojista posta na hora; o controle é a aprovação da loja, a volta para análise quando muda nome ou WhatsApp, e a denúncia |
| Que comércio entra | **Qualquer comércio local**, com categorias | Feed variado é o que prende |

## Quem usa

- **Consumidor** — sem conta. Escolhe a cidade, rola o feed, filtra por
  categoria, busca, salva produtos (no próprio aparelho), abre a loja,
  compartilha e chama no WhatsApp. Pode denunciar um produto.
- **Lojista** — cria a conta da loja (nome, cidade, categoria, WhatsApp,
  endereço). Enquanto não for aprovada, monta a vitrine mas nada aparece.
  Posta, edita, pausa e apaga produtos. Vê quantas vezes cada produto foi visto
  e quantas pessoas chamaram no WhatsApp.
- **Administrador** (nós) — aprova, recusa e bloqueia lojas; vê denúncias e
  tira produto do ar.

## O feed

- Uma tela por produto, de cima para baixo, como o TikTok: foto grande (as
  outras fotos de lado), preço, preço "de" riscado quando houver, nome da loja,
  e os botões **WhatsApp**, **Salvar** e **Compartilhar**.
- Só entra produto **ativo**, de loja **aprovada**, da **cidade escolhida**.
- Ordem: mais novos primeiro, mas **nunca dois seguidos da mesma loja** se
  houver outra para intercalar — senão a loja que posta 30 produtos de uma vez
  toma o feed.
- Filtro por categoria no topo; busca pelo nome (mesma busca sem acento e com
  plural da versão anterior).
- Página própria do produto e da loja, com link para compartilhar no WhatsApp.

## Chamar no WhatsApp

`https://wa.me/55DDDNUMERO?text=...` com a mensagem pronta:

> Olá! Vi no Ofertas Locais: *Tênis Nike Revolution 7* — R$ 349,90.
> https://…/p/abc123 Ainda tem?

O número da loja é público: está na loja, e o lojista concorda com isso no
cadastro. Cada toque conta um clique para o painel do lojista.

## Por que aprovar a loja

Feed aberto vira golpe ("iPhone por R$ 500, paga no Pix"). A loja só aparece
depois que alguém daqui conferiu que ela existe. Produto de loja aprovada vai
ao ar direto; se aparecer problema, a denúncia chega e o administrador tira do
ar ou bloqueia a loja.

## Modelo

```
cidades     id, nome, uf
lojas       id, cidade, nome, categoria, whatsapp, endereco, descricao,
            estado: pendente | aprovada | recusada | bloqueada
contas      usuario, senha (scrypt), papel: admin | lojista, loja?
produtos    id, loja, titulo, descricao, categoria, preco (centavos),
            precoDe? (centavos), fotos[], ativo, criadoEm
            vistas, cliques                  (contadores)
denuncias   id, produto, motivo, criadaEm, resolvida
```

- Dinheiro em centavos, inteiro (mesma regra de antes).
- Fotos no Vercel Blob **público** com nome aleatório: é vitrine, precisa
  abrir rápido e ser compartilhada. O site encolhe a foto antes de enviar
  (lado maior 1600 px) e o servidor confere o tipo pelos bytes.
- WhatsApp guardado só com dígitos, com DDD (`65999990000`); validado no
  cadastro.

## Categorias (fase 1)

Mercado, Padaria e lanches, Roupas e calçados, Celulares e eletrônicos, Casa e
construção, Beleza, Pet, Farmácia, Esporte, Outros.

## O robô do WhatsApp

Continua, agora sobre produtos: a pessoa manda "tênis" e recebe até 5 produtos
da cidade com o link de cada um. Mesmas regras: só responde quem escreveu,
"SAIR" apaga o número.

## O que sai

A digitalização de panfleto pela IA e a tela de conferência. Ficam no
histórico do Git (commit `6eadda4`) para voltar como "importar panfleto" de um
mercado, se fizer falta.

## Fora da fase 1

Vídeo curto, conta do consumidor, seguir loja, pagamento no app, entrega,
anúncio pago e destaque, avaliações, outras cidades além das que o
administrador cadastrar.
