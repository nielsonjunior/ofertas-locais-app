import { useEffect, useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'

/** Roteamento mínimo: o site tem meia dúzia de endereços e não precisa de biblioteca. */

export function useEndereco(): URL {
  const [url, setUrl] = useState(() => new URL(window.location.href))
  useEffect(() => {
    const mudou = () => setUrl(new URL(window.location.href))
    window.addEventListener('popstate', mudou)
    return () => window.removeEventListener('popstate', mudou)
  }, [])
  return url
}

export function ir(para: string, trocar = false): void {
  if (trocar) window.history.replaceState(null, '', para)
  else window.history.pushState(null, '', para)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo(0, 0)
}

export function Link({ para, children, className, ...resto }: { para: string; children: ReactNode; className?: string; 'aria-current'?: 'page' }) {
  function clicar(e: MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    ir(para)
  }
  return <a href={para} onClick={clicar} className={className} {...resto}>{children}</a>
}

const CHAVE_DA_CIDADE = 'ofertas.cidade'

/** A cidade lembrada neste aparelho. Só conveniência: sem ela, o site pergunta de novo. */
export function cidadeLembrada(): string {
  try { return localStorage.getItem(CHAVE_DA_CIDADE) ?? '' } catch { return '' }
}

export function lembrarCidade(id: string): void {
  try { localStorage.setItem(CHAVE_DA_CIDADE, id) } catch { /* modo anônimo: tudo bem */ }
}
