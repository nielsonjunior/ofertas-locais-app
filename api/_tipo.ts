export type TipoDaPagina = 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf'

/**
 * O tipo do arquivo pelos primeiros bytes, e não pelo que o navegador diz.
 * Um "panfleto.jpg" que é HTML não entra no armazém.
 */
export function tipoPelosBytes(bytes: Buffer): TipoDaPagina | null {
  if (bytes.length < 12) return null
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (bytes.subarray(0, 4).toString('latin1') === 'RIFF' && bytes.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp'
  if (bytes.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf'
  return null
}

export function extensao(tipo: TipoDaPagina): string {
  return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' }[tipo]
}
