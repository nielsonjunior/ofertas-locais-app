import { useCallback, useEffect, useState } from 'react'
import type { ProdutoNaVitrine } from '../dominio/tipos'

/**
 * Carrega uma vez por chave e devolve dado, erro e recarregar. O dado só vale
 * para a chave em que foi carregado: trocar de categoria não mostra a lista
 * da anterior enquanto a nova chega. Recarregar a mesma chave mantém o que
 * está na tela até chegar o novo.
 */
export function useCarregar<T>(carregar: () => Promise<T>, chave: string) {
  const [estado, setEstado] = useState<{ chave: string; dado?: T; erro?: string }>({ chave })
  const [vez, setVez] = useState(0)
  useEffect(() => {
    let vivo = true
    setEstado((e) => (e.chave === chave ? { chave, dado: e.dado } : { chave }))
    carregar().then(
      (dado) => vivo && setEstado({ chave, dado }),
      (e: Error) => vivo && setEstado({ chave, erro: e.message })
    )
    return () => { vivo = false }
    // A chave decide quando recarregar; a função muda a cada render.
  }, [chave, vez])
  const recarregar = useCallback(() => setVez((v) => v + 1), [])
  const daChave = estado.chave === chave
  return { dado: daChave ? estado.dado : undefined, erro: daChave ? estado.erro : undefined, recarregar }
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
