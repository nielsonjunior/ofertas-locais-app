import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { alternarSeguida, lembrarBusca } from '../dominio/aparelho'
import type { LojaSeguida } from '../dominio/aparelho'
import type { ProdutoNaVitrine } from '../dominio/tipos'
import { Sacola } from './icones'

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

/* --- esperando: o formato do que vem, em cinza, passa mais rapidez que "Carregando…" --- */

export function Carregando() {
  return (
    <main className="miolo" aria-busy="true" aria-label="Carregando">
      <div className="esqueleto" style={{ height: 26, width: '55%', marginTop: 8 }} />
      <div className="esqueleto" style={{ height: 14, width: '80%', marginTop: 14 }} />
      <div className="esqueleto" style={{ height: 14, width: '65%', marginTop: 8 }} />
      <EsqueletoDaGrade />
    </main>
  )
}

export function EsqueletoDaGrade() {
  return (
    <div className="grade" style={{ marginTop: 20 }} aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => <div key={i} className="quadro esqueleto" />)}
    </div>
  )
}

export function EsqueletoDoFeed() {
  return (
    <section className="tela" aria-busy="true" aria-label="Carregando">
      <div className="esqueleto-feed">
        <div className="esqueleto" style={{ height: 16, width: 140 }} />
        <div className="esqueleto" style={{ height: 20, width: '70%' }} />
        <div className="esqueleto" style={{ height: 30, width: 130 }} />
        <div className="esqueleto" style={{ height: 46, width: '100%' }} />
      </div>
    </section>
  )
}

/* --- foto: se não carregar, um quadro com a inicial da loja, nunca o texto solto --- */

export function Foto({ src, alt, className, letra = '', eager = false }:
  { src: string | undefined; alt: string; className?: string; letra?: string; eager?: boolean }) {
  const [quebrou, setQuebrou] = useState(false)
  useEffect(() => setQuebrou(false), [src])
  if (!src || quebrou) {
    return <div className={`${className ?? ''} sem-foto`} role={alt ? 'img' : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true}>{letra}</div>
  }
  return <img className={className} src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setQuebrou(true)} />
}

/* --- logo --- */

export function Marca() {
  return <span className="marca-desenho"><Sacola /><span>Tik<b>Shop</b></span></span>
}

/* --- aviso rápido embaixo da tela (no lugar do alert do navegador) --- */

let avisoAtual = ''
const quemOuveOAviso = new Set<() => void>()
let temporizador: ReturnType<typeof setTimeout> | undefined

export function avisar(texto: string): void {
  avisoAtual = texto
  quemOuveOAviso.forEach((f) => f())
  clearTimeout(temporizador)
  temporizador = setTimeout(() => { avisoAtual = ''; quemOuveOAviso.forEach((f) => f()) }, 2600)
}

export function Aviso() {
  const texto = useSyncExternalStore((f) => { quemOuveOAviso.add(f); return () => quemOuveOAviso.delete(f) }, () => avisoAtual)
  return <div className="toast" role="status" aria-live="polite" data-visivel={Boolean(texto)}>{texto}</div>
}

/* --- guardado no aparelho: o consumidor não tem conta --- */

/**
 * O que está no aparelho pode ter vindo de uma versão antiga do site, ou ter
 * sido mexido: item fora do formato é descartado, em vez de quebrar a tela.
 */
function lerLista<T>(chave: string, valido: (x: unknown) => x is T): T[] {
  try {
    const lista: unknown = JSON.parse(localStorage.getItem(chave) ?? '[]')
    return Array.isArray(lista) ? lista.filter(valido) : []
  } catch {
    return []
  }
}

function gravarLista(chave: string, lista: unknown[]): void {
  try { localStorage.setItem(chave, JSON.stringify(lista)) } catch { /* modo anônimo: fica só nesta visita */ }
}

/** Uma lista do aparelho que várias telas leem ao mesmo tempo (seguir no feed muda a aba "Seguindo"). */
function listaDoAparelho<T>(chave: string, maximo: number, valido: (x: unknown) => x is T) {
  let cache = lerLista(chave, valido)
  const ouvintes = new Set<() => void>()
  return {
    ler: () => cache,
    gravar(lista: T[]) {
      cache = lista.slice(0, maximo)
      gravarLista(chave, cache)
      ouvintes.forEach((f) => f())
    },
    assinar(f: () => void) { ouvintes.add(f); return () => { ouvintes.delete(f) } }
  }
}

const ehTexto = (x: unknown): x is string => typeof x === 'string'
const objeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null
const ehProduto = (x: unknown): x is ProdutoNaVitrine =>
  objeto(x) && ehTexto(x.id) && ehTexto(x.titulo) && ehTexto(x.lojaId) && ehTexto(x.lojaNome) &&
  typeof x.preco === 'number' && Array.isArray(x.fotos) && x.fotos.every(ehTexto)
const ehLoja = (x: unknown): x is LojaSeguida => objeto(x) && ehTexto(x.id) && ehTexto(x.nome)

const salvos = listaDoAparelho('ofertas.salvos', 200, ehProduto)
const seguidas = listaDoAparelho('ofertas.seguidas', 300, ehLoja)
const buscas = listaDoAparelho('ofertas.buscas', 8, ehTexto)

export const lerSalvos = salvos.ler
export const gravarSalvos = salvos.gravar

export function useSalvos(): ProdutoNaVitrine[] {
  return useSyncExternalStore(salvos.assinar, salvos.ler)
}

export function useSalvo(produto: ProdutoNaVitrine): [boolean, () => void] {
  const lista = useSalvos()
  const salvo = lista.some((p) => p.id === produto.id)
  const alternar = useCallback(() => {
    const sem = salvos.ler().filter((p) => p.id !== produto.id)
    salvos.gravar(salvo ? sem : [produto, ...sem])
  }, [produto, salvo])
  return [salvo, alternar]
}

export function useSeguidas(): LojaSeguida[] {
  return useSyncExternalStore(seguidas.assinar, seguidas.ler)
}

export function useSeguir(loja: LojaSeguida): [boolean, () => void] {
  const lista = useSeguidas()
  const seguindo = lista.some((l) => l.id === loja.id)
  const alternar = useCallback(() => {
    seguidas.gravar(alternarSeguida(seguidas.ler(), loja))
    avisar(seguindo ? `Deixou de seguir ${loja.nome}` : `Seguindo ${loja.nome}`)
  }, [loja, seguindo])
  return [seguindo, alternar]
}

export function useBuscasRecentes(): [string[], (termo: string) => void, () => void] {
  const lista = useSyncExternalStore(buscas.assinar, buscas.ler)
  const lembrar = useCallback((termo: string) => buscas.gravar(lembrarBusca(buscas.ler(), termo)), [])
  const limpar = useCallback(() => buscas.gravar([]), [])
  return [lista, lembrar, limpar]
}

/** Endereço completo de uma página do site, para compartilhar e para a mensagem do WhatsApp. */
export function enderecoCompleto(caminho: string): string {
  return `${window.location.origin}${caminho}`
}

/** Compartilha pelo celular; sem isso, copia o link e avisa. */
export async function compartilhar(titulo: string, caminho: string): Promise<void> {
  const url = enderecoCompleto(caminho)
  try {
    if (navigator.share) {
      await navigator.share({ title: titulo, text: titulo, url })
      return
    }
    await navigator.clipboard.writeText(url)
    avisar('Link copiado')
  } catch {
    // Fechou a janela de compartilhar: não é erro.
  }
}
