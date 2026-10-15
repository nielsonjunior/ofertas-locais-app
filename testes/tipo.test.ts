import { describe, expect, it } from 'vitest'
import { tipoPelosBytes } from '../api/_tipo'

function com(inicio: number[] | string): Buffer {
  const cabeca = typeof inicio === 'string' ? Buffer.from(inicio, 'latin1') : Buffer.from(inicio)
  return Buffer.concat([cabeca, Buffer.alloc(16)])
}

describe('tipoPelosBytes', () => {
  it('reconhece JPG, PNG, WEBP e PDF', () => {
    expect(tipoPelosBytes(com([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg')
    expect(tipoPelosBytes(com([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png')
    expect(tipoPelosBytes(com('RIFF\0\0\0\0WEBP'))).toBe('image/webp')
    expect(tipoPelosBytes(com('%PDF-1.7'))).toBe('application/pdf')
  })

  it('recusa o resto, mesmo com nome de imagem', () => {
    expect(tipoPelosBytes(com('<html><script>'))).toBeNull()
    expect(tipoPelosBytes(Buffer.from([0xff, 0xd8]))).toBeNull()
  })
})
