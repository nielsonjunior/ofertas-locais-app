/**
 * Encolhe a foto do produto antes de enviar: a Vercel recusa corpo acima de
 * 4,5 MB, e foto de celular passa disso. 1600 px no lado maior basta para a
 * tela cheia do feed.
 */

const LADO_MAXIMO = 1600
const LIMITE = 4 * 1024 * 1024

export async function prepararFoto(arquivo: File): Promise<Blob> {
  if (!arquivo.type.startsWith('image/')) throw new Error('mande uma foto')

  const imagem = await createImageBitmap(arquivo)
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagem.width, imagem.height))
  const tela = document.createElement('canvas')
  tela.width = Math.round(imagem.width * escala)
  tela.height = Math.round(imagem.height * escala)
  const pincel = tela.getContext('2d')
  if (!pincel) throw new Error('este navegador não consegue preparar a foto')
  pincel.drawImage(imagem, 0, 0, tela.width, tela.height)
  imagem.close()

  for (const qualidade of [0.85, 0.7, 0.55]) {
    const blob = await new Promise<Blob | null>((ok) => tela.toBlob(ok, 'image/jpeg', qualidade))
    if (blob && blob.size <= LIMITE) return blob
  }
  throw new Error('foto grande demais mesmo depois de encolher')
}
