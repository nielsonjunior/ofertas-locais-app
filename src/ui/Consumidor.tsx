import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { publico, urlDaPagina } from '../dados/api'
import type { PanfletoPublico, Vitrine } from '../dados/api'
import { buscar } from '../dominio/busca'
import type { Cidade } from '../dominio/tipos'
import { CartaoDeOferta } from './CartaoDeOferta'
import { Link, ir, lembrarCidade } from './rota'

function diaMes(data: string): string {
  return `${data.slice(8, 10)}/${data.slice(5, 7)}`
}

function useCarregar<T>(carregar: () => Promise<T>, chave: string) {
  const [estado, setEstado] = useState<{ dado?: T; erro?: string }>({})
  useEffect(() => {
    let vivo = true
    setEstado({})
    carregar().then((dado) => vivo && setEstado({ dado }), (e: Error) => vivo && setEstado({ erro: e.message }))
    return () => { vivo = false }
  }, [chave])
  return estado
}

export function EscolherCidade() {
  const { dado: cidades, erro } = useCarregar<Cidade[]>(publico.cidades, 'cidades')

  function escolher(id: string) {
    lembrarCidade(id)
    ir(`/c/${id}`)
  }

  return (
    <main className="miolo">
      <h1>Os panfletos da sua cidade, no celular</h1>
      <p className="suave">Busque o produto e veja em qual mercado está mais barato esta semana.</p>
      <h2>Em qual cidade você está?</h2>
      {erro && <p className="erro">{erro}</p>}
      {!cidades && !erro && <p className="suave">Carregando…</p>}
      <div className="lista-cidades">
        {cidades?.map((c) => (
          <button key={c.id} className="botao claro" onClick={() => escolher(c.id)}>{c.nome} - {c.uf}</button>
        ))}
      </div>
    </main>
  )
}

function CaixaDeBusca({ cidadeId, inicial = '' }: { cidadeId: string; inicial?: string }) {
  const [texto, setTexto] = useState(inicial)
  useEffect(() => setTexto(inicial), [inicial])
  function enviar(e: FormEvent) {
    e.preventDefault()
    if (texto.trim()) ir(`/busca?cidade=${encodeURIComponent(cidadeId)}&q=${encodeURIComponent(texto.trim())}`)
  }
  return (
    <form className="busca" onSubmit={enviar} role="search">
      <input
        value={texto} onChange={(e) => setTexto(e.target.value)}
        placeholder="arroz, picanha, cerveja…" aria-label="Buscar produto" enterKeyHint="search" maxLength={60}
      />
      <button className="botao">Buscar</button>
    </form>
  )
}

export function PaginaDaCidade({ cidadeId }: { cidadeId: string }) {
  const { dado: vitrine, erro } = useCarregar<Vitrine>(() => publico.vitrine(cidadeId), cidadeId)
  useEffect(() => { if (vitrine) lembrarCidade(cidadeId) }, [vitrine, cidadeId])

  const destaques = useMemo(() => (vitrine?.ofertas ?? [])
    .filter((o) => o.precoDe)
    .sort((a, b) => (a.preco / a.precoDe!) - (b.preco / b.precoDe!))
    .slice(0, 8), [vitrine])

  if (erro) return <main className="miolo"><p className="erro">{erro}</p><Link para="/">Escolher outra cidade</Link></main>
  if (!vitrine) return <main className="miolo"><p className="suave">Carregando…</p></main>

  return (
    <main className="miolo">
      <h1>Ofertas em {vitrine.cidade.nome}</h1>
      <CaixaDeBusca cidadeId={cidadeId} />

      <h2>Panfletos valendo hoje</h2>
      {vitrine.panfletos.length === 0 && <p className="aviso">Ainda não há panfleto valendo em {vitrine.cidade.nome}. Volte daqui a pouco!</p>}
      <div className="grade">
        {vitrine.panfletos.map((p) => (
          <Link key={p.id} para={`/panfleto/${p.id}`} className="cartao">
            <div className="mercado">{p.mercadoNome}</div>
            <div className="suave pequeno">{p.ofertas} ofertas · até {diaMes(p.validoAte)}</div>
          </Link>
        ))}
      </div>

      {destaques.length > 0 && <>
        <h2>Maiores descontos</h2>
        <div className="grade">
          {destaques.map((o) => <CartaoDeOferta key={o.id} oferta={o} />)}
        </div>
      </>}
    </main>
  )
}

export function PaginaDaBusca({ cidadeId, consulta }: { cidadeId: string; consulta: string }) {
  const { dado: vitrine, erro } = useCarregar<Vitrine>(() => publico.vitrine(cidadeId), cidadeId)
  const achadas = useMemo(() => (vitrine ? buscar(vitrine.ofertas, consulta) : []), [vitrine, consulta])

  return (
    <main className="miolo">
      <CaixaDeBusca cidadeId={cidadeId} inicial={consulta} />
      {erro && <p className="erro">{erro}</p>}
      {!vitrine && !erro && <p className="suave">Carregando…</p>}
      {vitrine && <>
        <h1>{achadas.length ? `${achadas.length} ${achadas.length === 1 ? 'oferta' : 'ofertas'} de "${consulta}"` : `Não achei "${consulta}"`}</h1>
        {achadas.length === 0 && <p className="suave">Tente outro nome, ou <Link para={`/c/${cidadeId}`}>veja os panfletos</Link>.</p>}
        <div className="grade">
          {achadas.map((o, i) => <CartaoDeOferta key={o.id} oferta={o} melhor={i === 0 && achadas.length > 1} />)}
        </div>
      </>}
    </main>
  )
}

export function PaginaDoPanfleto({ id }: { id: string }) {
  const { dado: p, erro } = useCarregar<PanfletoPublico>(() => publico.panfleto(id), id)
  const [ver, setVer] = useState<'ofertas' | 'paginas'>('ofertas')

  if (erro) return <main className="miolo"><p className="erro">{erro}</p><Link para="/">Início</Link></main>
  if (!p) return <main className="miolo"><p className="suave">Carregando…</p></main>

  return (
    <main className="miolo">
      <h1>{p.mercadoNome}</h1>
      <p className="suave">{p.mercadoEndereco && `${p.mercadoEndereco} · `}de {diaMes(p.validoDe)} até {diaMes(p.validoAte)}</p>
      {p.vencido && <p className="aviso">Este panfleto já venceu.</p>}
      <div className="linha" role="tablist">
        <button className={`botao pequeno ${ver === 'ofertas' ? '' : 'claro'}`} onClick={() => setVer('ofertas')} aria-selected={ver === 'ofertas'} role="tab">
          {p.ofertas.length} ofertas
        </button>
        {p.paginas > 0 && (
          <button className={`botao pequeno ${ver === 'paginas' ? '' : 'claro'}`} onClick={() => setVer('paginas')} aria-selected={ver === 'paginas'} role="tab">
            Panfleto original
          </button>
        )}
        <Link para={`/c/${p.cidadeId}`} className="pequeno">Outros mercados</Link>
      </div>
      <div style={{ height: 12 }} />
      {ver === 'ofertas'
        ? <div className="grade">{p.ofertas.map((o) => <CartaoDeOferta key={o.id} oferta={o} mostrarMercado={false} />)}</div>
        : <div className="paginas">
            {Array.from({ length: p.paginas }, (_, i) => (
              <img key={i} src={urlDaPagina(p.id, i + 1)} alt={`Página ${i + 1} do panfleto do ${p.mercadoNome}`} loading="lazy" />
            ))}
          </div>}
    </main>
  )
}
