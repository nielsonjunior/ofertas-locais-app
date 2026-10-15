import { describe, expect, it } from 'vitest'
import { ordenarFeed } from '../src/dominio/feed'

function p(id: string, lojaId: string, criadoEm: string) {
  return { id, lojaId, criadoEm }
}

describe('ordenarFeed', () => {
  it('mais novos primeiro', () => {
    const r = ordenarFeed([p('a', 'L1', '2026-10-01'), p('b', 'L2', '2026-10-03'), p('c', 'L3', '2026-10-02')])
    expect(r.map((x) => x.id)).toEqual(['b', 'c', 'a'])
  })

  it('não põe dois seguidos da mesma loja quando há outra para intercalar', () => {
    const r = ordenarFeed([
      p('a1', 'A', '2026-10-05T10:00'), p('a2', 'A', '2026-10-05T09:00'), p('a3', 'A', '2026-10-05T08:00'),
      p('b1', 'B', '2026-10-04'), p('c1', 'C', '2026-10-03')
    ])
    expect(r.map((x) => x.id)).toEqual(['a1', 'b1', 'a2', 'c1', 'a3'])
  })

  it('quando só sobra uma loja, ela segue em ordem', () => {
    const r = ordenarFeed([p('a1', 'A', '3'), p('a2', 'A', '2'), p('b1', 'B', '1')])
    expect(r.map((x) => x.id)).toEqual(['a1', 'b1', 'a2'])
  })

  it('não perde nem repete ninguém', () => {
    const lista = Array.from({ length: 40 }, (_, i) => p(`x${i}`, `L${i % 3}`, String(1000 - i)))
    const r = ordenarFeed(lista)
    expect(new Set(r.map((x) => x.id)).size).toBe(40)
  })

  it('não mexe na lista recebida', () => {
    const lista = [p('a', 'A', '1'), p('b', 'B', '2')]
    ordenarFeed(lista)
    expect(lista.map((x) => x.id)).toEqual(['a', 'b'])
  })
})
