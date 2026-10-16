import { CATEGORIAS } from './categorias.js'

/**
 * Dados de teste: lojas e produtos inventados para encher o feed e ver o app
 * funcionando com volume. Tudo sai marcado como teste no banco e some com um
 * botão no admin. As fotos são as imagens de exemplo em public/exemplos, que
 * dizem "imagem de exemplo" — ninguém confunde com produto de verdade.
 */

/** Teto de produtos por geração: o bastante para testar volume sem encher o banco. */
export const LIMITE_DE_EXEMPLOS = 5000

interface Modelo {
  nome: string
  /** Preço base em reais. */
  preco: number
}

const CATALOGO: Record<string, Modelo[]> = {
  mercado: [
    { nome: 'Arroz Tipo 1 5 kg', preco: 26 }, { nome: 'Feijão Carioca 1 kg', preco: 8 }, { nome: 'Óleo de Soja 900 ml', preco: 7 },
    { nome: 'Café Torrado 500 g', preco: 18 }, { nome: 'Açúcar Cristal 5 kg', preco: 21 }, { nome: 'Leite Integral 1 L', preco: 5 },
    { nome: 'Macarrão Espaguete 500 g', preco: 4 }, { nome: 'Picanha Bovina kg', preco: 69 }, { nome: 'Frango Inteiro kg', preco: 12 },
    { nome: 'Cerveja Lata 12 un', preco: 40 }, { nome: 'Refrigerante 2 L', preco: 9 }, { nome: 'Sabão em Pó 1,6 kg', preco: 19 }
  ],
  lanches: [
    { nome: 'Bolo de Pote de Ninho', preco: 12 }, { nome: 'Pão Caseiro', preco: 15 }, { nome: 'Coxinha (cento)', preco: 75 },
    { nome: 'Torta Holandesa', preco: 65 }, { nome: 'Brigadeiro Gourmet (caixa 12)', preco: 30 }, { nome: 'Pão de Queijo kg', preco: 32 },
    { nome: 'Salgado Assado', preco: 7 }, { nome: 'Bolo de Aniversário 2 kg', preco: 140 }, { nome: 'Esfiha de Carne', preco: 6 },
    { nome: 'Pudim de Leite', preco: 35 }
  ],
  roupas: [
    { nome: 'Tênis Esportivo', preco: 299 }, { nome: 'Camiseta Básica', preco: 49 }, { nome: 'Calça Jeans', preco: 159 },
    { nome: 'Vestido Floral', preco: 129 }, { nome: 'Chinelo', preco: 35 }, { nome: 'Jaqueta Corta-vento', preco: 189 },
    { nome: 'Bermuda Tactel', preco: 59 }, { nome: 'Bota de Couro', preco: 349 }, { nome: 'Boné Aba Curva', preco: 69 },
    { nome: 'Kit 3 Meias', preco: 29 }
  ],
  eletronicos: [
    { nome: 'Fone Bluetooth', preco: 119 }, { nome: 'Carregador Turbo USB-C', preco: 59 }, { nome: 'Capinha Antichoque', preco: 35 },
    { nome: 'Caixa de Som Portátil', preco: 199 }, { nome: 'Película de Vidro', preco: 25 }, { nome: 'Smartwatch', preco: 279 },
    { nome: 'Celular 128 GB', preco: 1299 }, { nome: 'Cabo USB 2 m', preco: 29 }, { nome: 'Power Bank 10000 mAh', preco: 129 },
    { nome: 'Lâmpada Inteligente', preco: 79 }
  ],
  casa: [
    { nome: 'Jogo de Panelas 5 peças', preco: 249 }, { nome: 'Furadeira 650 W', preco: 279 }, { nome: 'Tinta Acrílica 18 L', preco: 329 },
    { nome: 'Vaso de Planta', preco: 45 }, { nome: 'Jogo de Toalhas', preco: 89 }, { nome: 'Ventilador de Mesa', preco: 169 },
    { nome: 'Cadeira de Plástico', preco: 59 }, { nome: 'Saco de Cimento 50 kg', preco: 39 }, { nome: 'Kit Ferramentas', preco: 149 },
    { nome: 'Edredom Casal', preco: 159 }
  ],
  beleza: [
    { nome: 'Batom Matte', preco: 29 }, { nome: 'Perfume 100 ml', preco: 159 }, { nome: 'Creme Hidratante', preco: 39 },
    { nome: 'Kit Esmaltes', preco: 35 }, { nome: 'Shampoo 1 L', preco: 45 }, { nome: 'Corte Masculino', preco: 35 },
    { nome: 'Escova Progressiva', preco: 180 }, { nome: 'Máscara Capilar', preco: 49 }, { nome: 'Base Líquida', preco: 59 },
    { nome: 'Design de Sobrancelha', preco: 40 }
  ],
  pet: [
    { nome: 'Ração Cão Adulto 15 kg', preco: 189 }, { nome: 'Ração Gato 10 kg', preco: 159 }, { nome: 'Bolinha com Corda', preco: 19 },
    { nome: 'Coleira Ajustável', preco: 29 }, { nome: 'Caminha Média', preco: 99 }, { nome: 'Banho e Tosa', preco: 70 },
    { nome: 'Areia Higiênica 4 kg', preco: 25 }, { nome: 'Petisco Dental', preco: 22 }, { nome: 'Antipulgas', preco: 69 },
    { nome: 'Comedouro Inox', preco: 35 }
  ],
  farmacia: [
    { nome: 'Vitamina C 60 cápsulas', preco: 39 }, { nome: 'Protetor Solar FPS 50', preco: 59 }, { nome: 'Escova Dental (3 un)', preco: 15 },
    { nome: 'Fralda Pacote G', preco: 69 }, { nome: 'Termômetro Digital', preco: 29 }, { nome: 'Álcool em Gel 500 ml', preco: 12 },
    { nome: 'Repelente', preco: 25 }, { nome: 'Curativo (caixa)', preco: 10 }, { nome: 'Aparelho de Pressão', preco: 149 },
    { nome: 'Fio Dental', preco: 9 }
  ],
  esporte: [
    { nome: 'Bola de Futebol', preco: 89 }, { nome: 'Chuteira Society', preco: 199 }, { nome: 'Bicicleta Aro 29', preco: 1390 },
    { nome: 'Garrafa Térmica 1 L', preco: 79 }, { nome: 'Luva de Goleiro', preco: 69 }, { nome: 'Vara de Pesca', preco: 159 },
    { nome: 'Kit Halteres', preco: 129 }, { nome: 'Camisa de Time', preco: 149 }, { nome: 'Colchonete', preco: 59 },
    { nome: 'Molinete', preco: 179 }
  ],
  outros: [
    { nome: 'Cesta de Presente', preco: 120 }, { nome: 'Brinquedo Educativo', preco: 59 }, { nome: 'Mochila Escolar', preco: 99 },
    { nome: 'Livro Infantil', preco: 39 }, { nome: 'Caneca Personalizada', preco: 35 }, { nome: 'Buquê de Flores', preco: 89 },
    { nome: 'Quebra-cabeça 1000 peças', preco: 79 }, { nome: 'Kit Festa', preco: 149 }, { nome: 'Agenda 2027', preco: 45 },
    { nome: 'Pelúcia', preco: 69 }
  ]
}

const MARCAS = ['Premium', 'Clássico', 'Promo', 'Linha Top', 'Original', 'Econômico', 'Especial', 'Plus']
const DETALHES = ['Pronta entrega.', 'Entregamos em Cáceres.', 'Pix ou cartão em até 3x.', 'Retire na loja.', 'Garantia de 90 dias.', 'Estoque limitado!', 'Vários tamanhos e cores.', 'Feito no dia.']
const PRIMEIROS = ['Casa', 'Mundo', 'Ponto', 'Cantinho', 'Empório', 'Espaço', 'Bazar', 'Mercadinho', 'Loja', 'Estação']
const SEGUNDOS = ['do Pantanal', 'Bom Preço', 'da Praça', 'São Luiz', 'Rio Paraguai', 'Cavalhada', 'Popular', 'Central', 'da Família', 'Fronteira', 'do Bairro', 'Real']

/** Sorteio com semente: a mesma semente gera os mesmos dados (bom para teste). */
function sorteio(semente: number) {
  let s = semente >>> 0
  const proximo = () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    numero: proximo,
    inteiro: (min: number, max: number) => min + Math.floor(proximo() * (max - min + 1)),
    um: <T>(lista: readonly T[]): T => lista[Math.floor(proximo() * lista.length)]!
  }
}

export interface LojaDeExemplo {
  nome: string
  categoria: string
  whatsapp: string
  endereco: string
  descricao: string
}

export interface ProdutoDeExemplo {
  /** Posição da loja na lista de lojas. */
  loja: number
  titulo: string
  descricao: string
  categoria: string
  preco: number
  precoDe: number | null
  fotos: string[]
  criadoEm: string
}

/** Arredonda para o jeito de preço de loja: 49,90; 129,90; 7,99. */
function precoDeLoja(reais: number): number {
  if (reais < 10) return Math.max(99, Math.round(reais) * 100 - 1)
  return Math.round(reais) * 100 - 10
}

export function gerarExemplos(pedido: { lojas: number; produtosPorLoja: number; semente: number; agora?: Date }):
  { lojas: LojaDeExemplo[]; produtos: ProdutoDeExemplo[] } {
  const { lojas: quantas, produtosPorLoja } = pedido
  if (!Number.isInteger(quantas) || !Number.isInteger(produtosPorLoja) || quantas < 1 || produtosPorLoja < 1) {
    throw new Error('quantidade inválida')
  }
  if (quantas * produtosPorLoja > LIMITE_DE_EXEMPLOS) throw new Error(`no máximo ${LIMITE_DE_EXEMPLOS} produtos de teste por vez`)

  const r = sorteio(pedido.semente)
  const agora = (pedido.agora ?? new Date()).getTime()
  const SETE_DIAS = 7 * 24 * 3600 * 1000

  // Todas as combinações de nome, embaralhadas: cada loja pega uma diferente.
  // Só passando de 120 lojas é que o nome ganha um número no fim.
  const combinacoes = PRIMEIROS.flatMap((a) => SEGUNDOS.map((b) => `${a} ${b}`))
  for (let i = combinacoes.length - 1; i > 0; i--) {
    const j = Math.floor(r.numero() * (i + 1))
    ;[combinacoes[i], combinacoes[j]] = [combinacoes[j]!, combinacoes[i]!]
  }
  const lojas: LojaDeExemplo[] = []
  for (let i = 0; i < quantas; i++) {
    // As lojas se revezam nas categorias: o feed tem de tudo.
    const categoria = CATEGORIAS[i % CATEGORIAS.length]!.id
    const base = combinacoes[i % combinacoes.length]!
    const nome = i < combinacoes.length ? base : `${base} ${Math.floor(i / combinacoes.length) + 1}`
    lojas.push({
      nome,
      categoria,
      // Número só para passar na regra do cadastro: loja de teste não abre WhatsApp.
      whatsapp: `6590000${String(i).padStart(4, '0')}`,
      endereco: `Rua ${r.inteiro(1, 40)}, ${r.inteiro(10, 999)} - Cáceres`,
      descricao: `Loja de teste. ${r.um(DETALHES)}`
    })
  }

  const produtos: ProdutoDeExemplo[] = []
  lojas.forEach((loja, i) => {
    const modelos = CATALOGO[loja.categoria]!
    for (let n = 0; n < produtosPorLoja; n++) {
      const modelo = r.um(modelos)
      const preco = precoDeLoja(modelo.preco * (0.8 + r.numero() * 0.5))
      const emOferta = r.numero() < 0.4
      const precoDe = emOferta ? precoDeLoja((preco / 100) * (1.15 + r.numero() * 0.35)) : null
      const fotos = Array.from({ length: r.inteiro(1, 3) }, () => `/exemplos/${loja.categoria}-${r.inteiro(1, 4)}.jpg`)
      produtos.push({
        loja: i,
        titulo: `${modelo.nome} ${r.um(MARCAS)}`.slice(0, 80),
        descricao: `${r.um(DETALHES)} ${r.um(DETALHES)}`,
        categoria: loja.categoria,
        preco,
        precoDe: precoDe !== null && precoDe > preco ? precoDe : null,
        fotos: [...new Set(fotos)],
        criadoEm: new Date(agora - Math.floor(r.numero() * SETE_DIAS)).toISOString()
      })
    }
  })
  return { lojas, produtos }
}
