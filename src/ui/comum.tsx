import { useCallback, useEffect, useState } from 'react'
import type { ProdutoNaVitrine } from '../dominio/tipos'

/** Carrega uma vez por chave e devolve dado, erro e recarregar. */
export function useCarregar<T>(carregar: () => Promise<T>, chave: string) {
  const [estado, setEstado] = useState<{ dado?: T; erro?: string }>({})
  const [vez, setVez] = useState(0)
  useEffect(() => {
    let vivo = true
    setEstado((e) => ({ dado: e.dado }))
    carregar().then((dado) => vivo && setEstado({ dado }), (e: Error) => vivo && setEstado({ erro: e.message }))
    return () => { vivo = false }
    // A chave decide quando recarregar; a função muda a cada render.
  }, [chave, vez])
  const recarregar = useCallback(() => setVez((v) => v + 1), [])
  return { ...estado, recarregar }
}

export function Carregando({ escuro = false }: { escuro?: boolean }) {
  return <div className={escuro ? 'vazio' : 'miolo suave'}>Carregando…</div>
}

/* --- salvos: ficam só neste aparelho; o consumidor não tem conta --- */

const CHAVE_DOS_SALVOS = 'ofertas.salvos'
const MAXIMO_DE_SALVOS = 200

export function lerSalvos(): ProdutoNaVitrine[] {
  try {
    const lista: unknown = JSON.parse(localStorage.getItem(CHAVE_DOS_SALVOS) ?? '[]')
    return Array.isArray(lista) ? (lista as ProdutoNaVitrine[]) : []
  } catch {
    return []
  }
}

function gravarSalvos(lista: ProdutoNaVitrine[]): void {
  try { localStorage.setItem(CHAVE_DOS_SALVOS, JSON.stringify(lista.slice(0, MAXIMO_DE_SALVOS))) } catch { /* modo anônimo */ }
}

export function useSalvo(produto: ProdutoNaVitrine): [boolean, () => void] {
  const [salvo, setSalvo] = useState(() => lerSalvos().some((p) => p.id === produto.id))
  const alternar = useCallback(() => {
    const lista = lerSalvos().filter((p) => p.id !== produto.id)
    if (!salvo) lista.unshift(produto)
    gravarSalvos(lista)
    setSalvo(!salvo)
  }, [produto, salvo])
  return [salvo, alternar]
}

/** Endereço completo de uma página do site, para compartilhar e para a mensagem do WhatsApp. */
export function enderecoCompleto(caminho: string): string {
  return `${window.location.origin}${caminho}`
}

export async function compartilhar(titulo: string, caminho: string): Promise<'compartilhado' | 'copiado' | 'nada'> {
  const url = enderecoCompleto(caminho)
  try {
    if (navigator.share) {
      await navigator.share({ title: titulo, text: titulo, url })
      return 'compartilhado'
    }
    await navigator.clipboard.writeText(url)
    return 'copiado'
  } catch {
    return 'nada'
  }
}
