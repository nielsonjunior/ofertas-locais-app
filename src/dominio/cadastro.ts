import { categoriaValida } from './categorias.js'
import { paraCentavos } from './dinheiro.js'
import { normalizarWhatsapp } from './telefone.js'

/**
 * O que o lojista digita, conferido. A mensagem do erro vai direto para a
 * tela, então é escrita para o lojista.
 */

function texto(corpo: Record<string, unknown>, campo: string, nome: string, maximo: number, obrigatorio = false): string {
  const bruto = typeof corpo[campo] === 'string' ? (corpo[campo] as string) : ''
  // Na descrição a quebra de linha conta; no resto, espaço repetido some.
  const valor = (campo === 'descricao' ? bruto.replace(/[ \t]+/g, ' ') : bruto.replace(/\s+/g, ' ')).trim()
  if (obrigatorio && !valor) throw new Error(`preencha ${nome}`)
  if (valor.length > maximo) throw new Error(`${nome} comprido demais (máximo ${maximo})`)
  return valor
}

export interface LojaDigitada {
  nome: string
  categoria: string
  whatsapp: string
  endereco: string
  descricao: string
}

export function validarLoja(corpo: Record<string, unknown>): LojaDigitada {
  const nome = texto(corpo, 'nome', 'o nome da loja', 60, true)
  if (!categoriaValida(corpo.categoria)) throw new Error('escolha a categoria da loja')
  const whatsapp = normalizarWhatsapp(String(corpo.whatsapp ?? ''))
  if (!whatsapp) throw new Error('WhatsApp com DDD, ex.: (65) 99999-0000')
  return {
    nome,
    categoria: corpo.categoria,
    whatsapp,
    endereco: texto(corpo, 'endereco', 'o endereço', 160),
    descricao: texto(corpo, 'descricao', 'a descrição', 500)
  }
}

export interface ProdutoDigitado {
  titulo: string
  descricao: string
  categoria: string
  preco: number
  precoDe: number | null
}

export function validarProduto(corpo: Record<string, unknown>): ProdutoDigitado {
  const titulo = texto(corpo, 'titulo', 'o título', 80, true)
  if (!categoriaValida(corpo.categoria)) throw new Error('escolha a categoria')
  const preco = paraCentavos(corpo.preco)
  if (preco === null || preco <= 0) throw new Error('o preço não é um preço (ex.: 49,90)')
  const de = corpo.precoDe === undefined || corpo.precoDe === null || corpo.precoDe === '' ? null : paraCentavos(corpo.precoDe)
  if (corpo.precoDe && (de === null || de <= preco)) throw new Error('o preço "de" tem de ser maior que o preço')
  return { titulo, descricao: texto(corpo, 'descricao', 'a descrição', 1000), categoria: corpo.categoria, preco, precoDe: de }
}

export function validarUsuario(corpo: Record<string, unknown>): { usuario: string; senha: string } {
  const usuario = String(corpo.usuario ?? '').trim().toLowerCase()
  if (!/^[a-z0-9._-]{3,40}$/.test(usuario)) throw new Error('usuário de 3 a 40 letras, números, ponto ou traço, sem espaço')
  const senha = String(corpo.senha ?? '')
  if (senha.length < 10) throw new Error('a senha precisa de 10 caracteres ou mais')
  if (senha.length > 200) throw new Error('senha comprida demais')
  return { usuario, senha }
}
