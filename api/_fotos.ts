import { randomBytes } from 'node:crypto'
import { put } from '@vercel/blob'
import { ErroDoCliente } from './_http.js'
import { extensao, tipoPelosBytes } from './_tipo.js'

/**
 * Fotos dos produtos. Ficam no Vercel Blob público — é vitrine, precisa abrir
 * rápido e ser compartilhada —, com nome aleatório e na pasta da loja. O
 * produto só aceita foto da pasta da própria loja, conferida por fotosDaLoja.
 */

export const FOTOS_POR_PRODUTO = 5

/** O Blob público serve neste domínio; foto de outro lugar não entra. */
const DOMINIO_DO_BLOB = '.public.blob.vercel-storage.com'

function pasta(lojaId: string): string {
  return `produtos/${lojaId}/`
}

export async function guardarFoto(lojaId: string, bytes: Buffer): Promise<string> {
  const tipo = tipoPelosBytes(bytes)
  if (!tipo || tipo === 'application/pdf') throw new ErroDoCliente('mande foto JPG, PNG ou WEBP')
  const caminho = `${pasta(lojaId)}${randomBytes(12).toString('base64url')}.${extensao(tipo)}`
  const guardada = await put(caminho, bytes, { access: 'public', contentType: tipo, addRandomSuffix: false })
  return guardada.url
}

/**
 * As fotos que o lojista mandou junto do produto, conferidas: de 1 a 5,
 * endereços do nosso Blob, na pasta desta loja. Assim ninguém pendura foto de
 * outro site (rastreio, golpe) nem pega foto de outra loja.
 */
export function fotosDaLoja(lojaId: string, fotos: unknown): string[] {
  if (!Array.isArray(fotos) || fotos.length === 0) throw new ErroDoCliente('ponha pelo menos uma foto')
  if (fotos.length > FOTOS_POR_PRODUTO) throw new ErroDoCliente(`no máximo ${FOTOS_POR_PRODUTO} fotos`)
  return fotos.map((foto) => {
    let url: URL
    try {
      url = new URL(String(foto))
    } catch {
      throw new ErroDoCliente('foto inválida')
    }
    const nossa = url.protocol === 'https:' && url.hostname.endsWith(DOMINIO_DO_BLOB) &&
      url.pathname.startsWith(`/${pasta(lojaId)}`) && !url.search && !url.hash && !url.pathname.includes('..')
    if (!nossa) throw new ErroDoCliente('foto inválida')
    return url.toString()
  })
}
