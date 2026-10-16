import { describe, expect, it } from 'vitest'
import { conferirAdmin, tokenDoBlob, urlDoBanco } from '../api/_ambiente'

describe('urlDoBanco', () => {
  it('usa DATABASE_URL, depois POSTGRES_URL', () => {
    expect(urlDoBanco({ DATABASE_URL: 'postgres://a', POSTGRES_URL: 'postgres://b' })).toBe('postgres://a')
    expect(urlDoBanco({ POSTGRES_URL: 'postgresql://b' })).toBe('postgresql://b')
  })

  it('acha a variável com prefixo que a Vercel cria ao conectar o banco', () => {
    expect(urlDoBanco({ STORAGE_DATABASE_URL: 'postgresql://c' })).toBe('postgresql://c')
    expect(urlDoBanco({ OFERTAS_POSTGRES_URL: 'postgres://d' })).toBe('postgres://d')
  })

  it('prefere a ligação pelo pooler e ignora o que não é endereço de Postgres', () => {
    expect(urlDoBanco({ X_DATABASE_URL_UNPOOLED: 'postgres://direto', X_DATABASE_URL: 'postgres://pool' })).toBe('postgres://pool')
    expect(urlDoBanco({ DATABASE_URL: '' })).toBe('')
    expect(urlDoBanco({ DATABASE_URL: '[SENSITIVE]' })).toBe('')
  })
})

describe('tokenDoBlob', () => {
  it('usa BLOB_READ_WRITE_TOKEN ou a variável com prefixo', () => {
    expect(tokenDoBlob({ BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_abc_123' })).toBe('vercel_blob_rw_abc_123')
    expect(tokenDoBlob({ FOTOS_READ_WRITE_TOKEN: 'vercel_blob_rw_def_456' })).toBe('vercel_blob_rw_def_456')
    expect(tokenDoBlob({ OUTRO_TOKEN: 'x' })).toBe('')
  })
})

describe('conferirAdmin', () => {
  it('diz o que há de errado sem mostrar o valor', () => {
    expect(conferirAdmin('')).toBe('faltando')
    expect(conferirAdmin('admin:senha-em-texto')).toBe('formato errado: gere com npm run criar-admin')
    expect(conferirAdmin(` admin:${'a'.repeat(32)}:${'b'.repeat(128)}`)).toBe('ok (usuário admin)')
    expect(conferirAdmin(`admin:${'a'.repeat(32)}:${'b'.repeat(127)}`)).toBe('formato errado: gere com npm run criar-admin')
  })
})
