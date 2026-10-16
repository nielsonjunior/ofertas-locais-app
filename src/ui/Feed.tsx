import { useCallback, useEffect, useRef, useState } from 'react'
import { publico } from '../dados/api'
import type { Feed as DadosDoFeed } from '../dados/api'
import { comPrimeiroNaFrente, estaPerto } from '../dominio/aparelho'
import { CATEGORIAS, categoriaValida, nomeDaCategoria } from '../dominio/categorias'
import type { ProdutoNaVitrine } from '../dominio/tipos'
import { EsqueletoDoFeed, Marca, useCarregar, useSeguidas } from './comum'
import { TelaDoProduto } from './TelaDoProduto'
import { Link, lembrarCidade } from './rota'

/** Junta as vistas e manda de tempos em tempos: um pedido por produto seria rede demais. */
function useVistas() {
  const pendentes = useRef(new Set<string>())
  const contadas = useRef(new Set<string>())
  useEffect(() => {
    const enviar = () => {
      if (pendentes.current.size === 0) return
      publico.vistas([...pendentes.current])
      pendentes.current.clear()
    }
    // No iPhone, trocar de app nem sempre dispara pagehide; visibilitychange dispara.
    const aoEsconder = () => { if (document.visibilityState === 'hidden') enviar() }
    const t = setInterval(enviar, 5000)
    window.addEventListener('pagehide', enviar)
    document.addEventListener('visibilitychange', aoEsconder)
    return () => {
      clearInterval(t)
      window.removeEventListener('pagehide', enviar)
      document.removeEventListener('visibilitychange', aoEsconder)
      enviar()
    }
  }, [])
  return useCallback((id: string) => {
    if (contadas.current.has(id)) return
    contadas.current.add(id)
    pendentes.current.add(id)
  }, [])
}

const SEGUINDO = 'seguindo'

function categoriaDoEndereco(): string {
  const c = new URLSearchParams(window.location.search).get('categoria') ?? ''
  return categoriaValida(c) ? c : ''
}

/**
 * O feed da cidade. Com `primeiro` (produto aberto por link), ele vem na
 * frente e o feed continua embaixo: quem chegou pelo link não fica sem saída.
 */
export function Feed({ cidadeId, primeiro = null }: { cidadeId: string; primeiro?: ProdutoNaVitrine | null }) {
  const [categoria, setCategoria] = useState(categoriaDoEndereco)
  // "Seguindo" filtra aqui mesmo o feed geral: as lojas seguidas ficam no aparelho.
  const pedida = categoria === SEGUINDO ? '' : categoria
  const { dado, erro, recarregar } = useCarregar<DadosDoFeed>(() => publico.feed(cidadeId, pedida), `${cidadeId}|${pedida}`)
  const seguidas = useSeguidas()
  const aoVer = useVistas()
  const rolagem = useRef<HTMLElement>(null)
  const [atual, setAtual] = useState(0)

  useEffect(() => { if (dado) lembrarCidade(cidadeId) }, [dado, cidadeId])
  useEffect(() => { rolagem.current?.scrollTo({ top: 0 }); setAtual(0) }, [categoria])

  let produtos = dado?.produtos ?? []
  if (categoria === SEGUINDO) produtos = produtos.filter((p) => seguidas.some((s) => s.id === p.lojaId))
  if (!categoria) produtos = comPrimeiroNaFrente(primeiro, produtos)
  const nomeDaCidade = dado?.cidade.nome ?? ''

  function rolou(e: React.UIEvent<HTMLElement>) {
    const el = e.currentTarget
    const agora = Math.round(el.scrollTop / Math.max(el.clientHeight, 1))
    if (agora !== atual) setAtual(agora)
  }

  function escolher(c: string) {
    setCategoria(c)
    // A categoria vai para o endereço: voltar ou compartilhar mantém a aba.
    const url = new URL(window.location.href)
    if (c && c !== SEGUINDO) url.searchParams.set('categoria', c)
    else url.searchParams.delete('categoria')
    window.history.replaceState(null, '', url)
  }

  const abas = [
    { id: '', nome: 'Para você' },
    ...(seguidas.length ? [{ id: SEGUINDO, nome: 'Seguindo' }] : []),
    ...CATEGORIAS.map((c) => ({ id: c.id, nome: c.nome }))
  ]

  return (
    <>
      <header className="feed-topo">
        <div className="linha">
          <Link para={`/c/${cidadeId}`} className="marca"><Marca /></Link>
          <Link para="/?trocar" className="cidade">📍 {nomeDaCidade || '…'} ▾</Link>
        </div>
        <div className="chips" role="toolbar" aria-label="Categorias">
          {abas.map((a) => (
            <button key={a.id || 'todos'} className="chip" aria-pressed={categoria === a.id} onClick={() => escolher(a.id)}>{a.nome}</button>
          ))}
        </div>
      </header>
      <main className="feed" ref={rolagem} onScroll={rolou}>
        {erro && (
          <div className="vazio">
            <p>{erro}</p>
            <button className="botao" onClick={recarregar}>Tentar de novo</button>
            <Link para="/?trocar" className="botao claro">Escolher cidade</Link>
          </div>
        )}
        {/* Só monta o que está perto da tela; o resto é uma tela vazia do mesmo tamanho, para a rolagem não pular. */}
        {produtos.map((p, i) => estaPerto(i, atual)
          ? <TelaDoProduto key={p.id} produto={p} aoVer={aoVer} />
          : <section key={p.id} className="tela" aria-hidden="true" />)}
        {!dado && !erro && <EsqueletoDoFeed />}
        {dado && produtos.length === 0 && (
          <div className="vazio">
            {categoria === SEGUINDO
              ? <p>As lojas que você segue ainda não postaram nada.</p>
              : <p>Nenhum produto {categoria ? `de ${nomeDaCategoria(categoria)} ` : ''}em {nomeDaCidade} ainda.</p>}
            {categoria
              ? <button className="botao" onClick={() => escolher('')}>Ver tudo</button>
              : <Link para="/vender" className="botao">Tem uma loja? Venda aqui</Link>}
          </div>
        )}
        {dado && produtos.length > 0 && (
          <section className="tela fim">
            <div className="vazio">
              <strong className="fim-titulo">Você viu tudo{categoria && categoria !== SEGUINDO ? ` de ${nomeDaCategoria(categoria)}` : ''} em {nomeDaCidade}</strong>
              <button className="botao" onClick={() => rolagem.current?.scrollTo({ top: 0, behavior: 'smooth' })}>Voltar ao começo</button>
              {categoria
                ? <button className="botao claro" onClick={() => escolher('')}>Ver todas as categorias</button>
                : <Link para={`/busca?cidade=${cidadeId}`} className="botao claro">Buscar um produto</Link>}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
