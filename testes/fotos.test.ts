import { describe, expect, it } from 'vitest'
import { fotosDaLoja } from '../api/_fotos'

const BASE = 'https://abc123.public.blob.vercel-storage.com'

describe('fotosDaLoja', () => {
  it('aceita foto do nosso Blob, na pasta da loja', () => {
    expect(fotosDaLoja('L1', [`${BASE}/produtos/L1/x.jpg`])).toEqual([`${BASE}/produtos/L1/x.jpg`])
  })

  it('recusa foto de outra loja, de outro site, sem https ou com truque no caminho', () => {
    for (const url of [
      `${BASE}/produtos/L2/x.jpg`,
      'https://golpe.exemplo/produtos/L1/x.jpg',
      'https://public.blob.vercel-storage.com.golpe.exemplo/produtos/L1/x.jpg',
      `http://abc123.public.blob.vercel-storage.com/produtos/L1/x.jpg`,
      `${BASE}/produtos/L1/x.jpg?rastreio=1`,
      'javascript:alert(1)',
      'nada'
    ]) {
      expect(() => fotosDaLoja('L1', [url]), url).toThrow('foto')
    }
  })

  it('de 1 a 5 fotos', () => {
    expect(() => fotosDaLoja('L1', [])).toThrow('pelo menos')
    expect(() => fotosDaLoja('L1', Array(6).fill(`${BASE}/produtos/L1/x.jpg`))).toThrow('máximo')
    expect(() => fotosDaLoja('L1', 'texto')).toThrow()
  })
})
