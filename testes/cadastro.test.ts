import { describe, expect, it } from 'vitest'
import { validarLoja, validarProduto, validarUsuario } from '../src/dominio/cadastro'
import { CATEGORIAS } from '../src/dominio/categorias'

const loja = {
  nome: ' Casa do Tênis ', categoria: 'roupas', whatsapp: '(65) 99999-0000',
  endereco: 'Rua Coronel Faria, 100', descricao: 'Tênis e chinelos'
}

describe('validarLoja', () => {
  it('aceita e limpa', () => {
    expect(validarLoja(loja)).toEqual({
      nome: 'Casa do Tênis', categoria: 'roupas', whatsapp: '65999990000',
      endereco: 'Rua Coronel Faria, 100', descricao: 'Tênis e chinelos'
    })
  })

  it('recusa sem nome, categoria desconhecida ou WhatsApp inválido', () => {
    expect(() => validarLoja({ ...loja, nome: '' })).toThrow('nome')
    expect(() => validarLoja({ ...loja, categoria: 'armas' })).toThrow('categoria')
    expect(() => validarLoja({ ...loja, whatsapp: '9999' })).toThrow('WhatsApp')
  })
})

describe('validarProduto', () => {
  const produto = { titulo: 'Tênis Nike', descricao: 'Tamanhos 38 a 43', categoria: 'roupas', preco: '349,90', precoDe: '' }

  it('aceita e converte preço para centavos', () => {
    expect(validarProduto(produto)).toEqual({
      titulo: 'Tênis Nike', descricao: 'Tamanhos 38 a 43', categoria: 'roupas', preco: 34990, precoDe: null
    })
  })

  it('preço "de" tem de ser maior', () => {
    expect(validarProduto({ ...produto, precoDe: '399,90' }).precoDe).toBe(39990)
    expect(() => validarProduto({ ...produto, precoDe: '300,00' })).toThrow('"de"')
  })

  it('recusa sem título, preço inválido, categoria desconhecida, texto comprido', () => {
    expect(() => validarProduto({ ...produto, titulo: ' ' })).toThrow('título')
    expect(() => validarProduto({ ...produto, preco: 'grátis' })).toThrow('preço')
    expect(() => validarProduto({ ...produto, categoria: 'x' })).toThrow('categoria')
    expect(() => validarProduto({ ...produto, descricao: 'x'.repeat(1001) })).toThrow('comprid')
  })
})

describe('validarUsuario', () => {
  it('usuário curto, sem espaço, minúsculo; senha de 10+', () => {
    expect(validarUsuario({ usuario: 'Casa.Tenis', senha: 'senha-forte-1' })).toEqual({ usuario: 'casa.tenis', senha: 'senha-forte-1' })
    expect(() => validarUsuario({ usuario: 'com espaço', senha: 'senha-forte-1' })).toThrow('usuário')
    expect(() => validarUsuario({ usuario: 'loja1', senha: 'curta' })).toThrow('senha')
  })
})

describe('CATEGORIAS', () => {
  it('têm id único e nome', () => {
    expect(new Set(CATEGORIAS.map((c) => c.id)).size).toBe(CATEGORIAS.length)
    expect(CATEGORIAS.every((c) => c.nome)).toBe(true)
  })
})
