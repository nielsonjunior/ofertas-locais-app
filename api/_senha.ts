import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

/**
 * Senha e cookie da equipe. scrypt é do próprio Node: não vale trazer
 * biblioteca de hash para meia dúzia de pessoas.
 */

const derivar = promisify(scrypt) as (senha: string, sal: string, tamanho: number) => Promise<Buffer>
const TAMANHO = 64

export const DIAS_DE_SESSAO = 7
const NOME_DO_COOKIE = 'sessao'

export async function embaralhar(senha: string): Promise<string> {
  const sal = randomBytes(16).toString('hex')
  const hash = await derivar(senha, sal, TAMANHO)
  return `${sal}:${hash.toString('hex')}`
}

export async function confere(senha: string, guardado: string): Promise<boolean> {
  const [sal, hash] = String(guardado ?? '').split(':')
  if (!sal || !hash || !senha) return false
  const esperado = Buffer.from(hash, 'hex')
  if (esperado.length !== TAMANHO) return false
  const calculado = await derivar(senha, sal, TAMANHO)
  // Tempo fixo: === conta, pelo tempo que leva, quantos bytes bateram.
  return timingSafeEqual(calculado, esperado)
}

/**
 * Alvo para o relógio quando o usuário não existe: o login gasta o mesmo
 * scrypt, e o tempo da resposta não conta quem existe. Nenhuma senha bate.
 */
const HASH_ISCA =
  'a7b3c8666a0cdd0d1976e34f18f292f7:e92ce019bb9a51489afe71df6fb6c20a' +
  'db1a772d13a161c9c1cf6c49aec152858226f9c1547eca7456dfeb112678a3d3' +
  '3d0c1ae2ce76981495a89cb201e8a332'

export async function confereEmTempoConstante(senha: string, guardado: string | undefined): Promise<boolean> {
  const ok = await confere(senha, guardado ?? HASH_ISCA)
  return guardado ? ok : false
}

export function novoToken(): string {
  return randomBytes(32).toString('base64url')
}

export function cookieDaSessao(token: string): string {
  return `${NOME_DO_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DIAS_DE_SESSAO * 86400}`
}

export function cookieApagado(): string {
  return `${NOME_DO_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}

export function tokenDoCookie(cabecalho: string | undefined): string | null {
  for (const parte of String(cabecalho ?? '').split(';')) {
    const [nome, ...resto] = parte.trim().split('=')
    if (nome !== NOME_DO_COOKIE) continue
    const valor = resto.join('=')
    return /^[A-Za-z0-9_-]{8,128}$/.test(valor) ? valor : null
  }
  return null
}
