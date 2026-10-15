import { urlDaPagina } from '../dados/api'

/** Uma página do panfleto: imagem aparece; PDF vira link para baixar. */
export function Pagina({ panfletoId, numero, tipo, nome = '' }: { panfletoId: string; numero: number; tipo: string; nome?: string }) {
  const url = urlDaPagina(panfletoId, numero)
  if (tipo === 'application/pdf') {
    return <a className="botao claro" href={url}>Baixar página {numero} (PDF)</a>
  }
  return <img src={url} alt={`Página ${numero}${nome ? ` do panfleto do ${nome}` : ''}`} loading="lazy" />
}
