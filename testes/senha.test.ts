import { describe, expect, it } from 'vitest'
import { confere, confereEmTempoConstante, cookieDaSessao, embaralhar, tokenDoCookie } from '../api/_senha'

describe('senha', () => {
  it('confere a senha certa e recusa a errada', async () => {
    const guardado = await embaralhar('pao-de-queijo-42')
    expect(guardado).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/)
    expect(await confere('pao-de-queijo-42', guardado)).toBe(true)
    expect(await confere('pao-de-queijo-43', guardado)).toBe(false)
  })

  it('duas vezes a mesma senha dão hashes diferentes (sal)', async () => {
    expect(await embaralhar('igual')).not.toBe(await embaralhar('igual'))
  })

  it('linha corrompida ou senha vazia não entram', async () => {
    expect(await confere('x', 'lixo')).toBe(false)
    expect(await confere('', await embaralhar('x'))).toBe(false)
  })

  it('usuário que não existe gasta o mesmo hash e não entra', async () => {
    expect(await confereEmTempoConstante('qualquer', undefined)).toBe(false)
  })
})

describe('cookie da sessão', () => {
  it('vai e volta', () => {
    const cookie = cookieDaSessao('abc_DEF-123')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('Secure')
    expect(cookie).toContain('SameSite=Lax')
    expect(tokenDoCookie(`outro=1; ${cookie.split(';')[0]}`)).toBe('abc_DEF-123')
  })

  it('sem cookie ou com token estranho dá null', () => {
    expect(tokenDoCookie(undefined)).toBeNull()
    expect(tokenDoCookie('sessao=tem espaço')).toBeNull()
  })
})
