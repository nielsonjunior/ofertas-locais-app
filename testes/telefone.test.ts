import { describe, expect, it } from 'vitest'
import { linkDoWhatsapp, mostrarTelefone, normalizarWhatsapp } from '../src/dominio/telefone'

describe('normalizarWhatsapp', () => {
  it('fica só com DDD e número, do jeito que for digitado', () => {
    expect(normalizarWhatsapp('(65) 99999-0000')).toBe('65999990000')
    expect(normalizarWhatsapp('65 9 9999 0000')).toBe('65999990000')
    expect(normalizarWhatsapp('+55 65 99999-0000')).toBe('65999990000')
    expect(normalizarWhatsapp('6533330000')).toBe('6533330000')
  })

  it('recusa sem DDD, DDD inválido ou tamanho errado', () => {
    expect(normalizarWhatsapp('99999-0000')).toBeNull()
    expect(normalizarWhatsapp('(05) 99999-0000')).toBeNull()
    expect(normalizarWhatsapp('65 99999-00000')).toBeNull()
    expect(normalizarWhatsapp('')).toBeNull()
    expect(normalizarWhatsapp('abc')).toBeNull()
  })

  it('celular de 11 dígitos começa com 9', () => {
    expect(normalizarWhatsapp('65 89999-0000')).toBeNull()
  })
})

describe('mostrarTelefone', () => {
  it('formata para ler', () => {
    expect(mostrarTelefone('65999990000')).toBe('(65) 99999-0000')
    expect(mostrarTelefone('6533330000')).toBe('(65) 3333-0000')
  })
})

describe('linkDoWhatsapp', () => {
  it('abre a conversa com a loja e a mensagem pronta', () => {
    const link = linkDoWhatsapp('65999990000', {
      titulo: 'Tênis Nike Revolution 7', preco: 34990, url: 'https://ofertas.exemplo/p/abc'
    })
    expect(link.startsWith('https://wa.me/5565999990000?text=')).toBe(true)
    const texto = decodeURIComponent(link.split('text=')[1] ?? '')
    expect(texto).toContain('*Tênis Nike Revolution 7* — R$ 349,90')
    expect(texto).toContain('https://ofertas.exemplo/p/abc')
    expect(texto).toContain('Ainda tem?')
  })
})
