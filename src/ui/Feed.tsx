import { useCallback, useEffect, useRef, useState } from 'react'
import { publico } from '../dados/api'
import type { Feed as DadosDoFeed } from '../dados/api'
import { CATEGORIAS } from '../dominio/categorias'
import { Carregando, useCarregar } from './comum'
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

export function Feed({ cidadeId }: { cidadeId: string }) {
  const [categoria, setCategoria] = useState('')
  const { dado, erro } = useCarregar<DadosDoFeed>(() => publico.feed(cidadeId, categoria), `${cidadeId}|${categoria}`)
  const aoVer = useVistas()
  const rolagem = useRef<HTMLDivElement>(null)

  useEffect(() => { if (dado) lembrarCidade(cidadeId) }, [dado, cidadeId])
  useEffect(() => { rolagem.current?.scrollTo({ top: 0 }) }, [categoria])

  return (
    <>
      <header className="feed-topo">
        <div className="linha">
          <Link para={`/c/${cidadeId}`} className="marca">Tik<b>Shop</b></Link>
          <Link para="/?trocar" className="cidade">📍 {dado?.cidade.nome ?? '…'} ▾</Link>
        </div>
        <div className="chips" role="toolbar" aria-label="Categorias">
          <button className="chip" aria-pressed={categoria === ''} onClick={() => setCategoria('')}>Para você</button>
          {CATEGORIAS.map((c) => (
            <button key={c.id} className="chip" aria-pressed={categoria === c.id} onClick={() => setCategoria(c.id)}>
              {c.nome}
            </button>
          ))}
        </div>
      </header>
      <main className="feed" ref={rolagem}>
        {erro && <div className="vazio"><p>{erro}</p><Link para="/?trocar" className="botao">Escolher cidade</Link></div>}
        {!dado && !erro && <Carregando escuro />}
        {dado && dado.produtos.length === 0 && (
          <div className="vazio">
            <p>Nenhum produto {categoria ? 'nesta categoria ' : ''}em {dado.cidade.nome} ainda.</p>
            <Link para="/vender" className="botao">Tem uma loja? Venda aqui</Link>
          </div>
        )}
        {dado?.produtos.map((p) => <TelaDoProduto key={p.id} produto={p} aoVer={aoVer} />)}
      </main>
    </>
  )
}
