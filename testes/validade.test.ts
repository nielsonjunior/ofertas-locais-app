import { describe, expect, it } from 'vitest'
import { dataValida, estaValido, hojeEmCuiaba } from '../src/dominio/validade'

describe('hojeEmCuiaba', () => {
  it('usa o dia de Cuiabá, não o de Greenwich', () => {
    // 02:30 UTC do dia 16 ainda é 22:30 do dia 15 em Cuiabá (UTC-4)
    expect(hojeEmCuiaba(new Date('2026-10-16T02:30:00Z'))).toBe('2026-10-15')
    expect(hojeEmCuiaba(new Date('2026-10-16T04:00:00Z'))).toBe('2026-10-16')
  })
})

describe('estaValido', () => {
  const panfleto = { validoDe: '2026-10-13', validoAte: '2026-10-19' }

  it('vale do primeiro ao último dia, inclusive', () => {
    expect(estaValido(panfleto, '2026-10-13')).toBe(true)
    expect(estaValido(panfleto, '2026-10-19')).toBe(true)
  })

  it('não vale antes nem depois', () => {
    expect(estaValido(panfleto, '2026-10-12')).toBe(false)
    expect(estaValido(panfleto, '2026-10-20')).toBe(false)
  })
})

describe('dataValida', () => {
  it('aceita só AAAA-MM-DD que existe no calendário', () => {
    expect(dataValida('2026-10-15')).toBe(true)
    expect(dataValida('2026-02-30')).toBe(false)
    expect(dataValida('15/10/2026')).toBe(false)
    expect(dataValida('')).toBe(false)
  })
})
