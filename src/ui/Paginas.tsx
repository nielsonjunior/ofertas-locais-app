import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { publico } from '../dados/api'
import type { Feed, LojaPublica } from '../dados/api'
import { buscar } from '../dominio/busca'
import { nomeDaCategoria } from '../dominio/categorias'
import { emReais } from '../dominio/dinheiro'
import { mostrarTelefone } from '../dominio/telefone'
import type { Cidade, ProdutoNaVitrine } from '../dominio/tipos'
import { Carregando, compartilhar, lerSalvos, useCarregar } from './comum'
import { IconeDeConversa, TelaDoProduto } from './TelaDoProduto'
import { Link, cidadeLembrada, ir, lembrarCidade } from './rota'

export function EscolherCidade() {
  const { dado: cidades, erro } = useCarregar<Cidade[]>(publico.cidades, 'cidades')
  return (
    <main className="miolo">
      <h1>O que as lojas da sua cidade estão vendendo, agora</h1>
      <p className="suave">Role, encontre e chame a loja no WhatsApp.</p>
      <h2>Em qual cidade você está?</h2>
      {erro && <p className="erro">{erro}</p>}
      {!cidades && !erro && <p className="suave">Carregando…</p>}
      <div style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
        {cidades?.map((c) => (
          <button key={c.id} className="botao claro" style={{ justifyContent: 'flex-start' }}
            onClick={() => { lembrarCidade(c.id); ir(`/c/${c.id}`) }}>
            📍 {c.nome} - {c.uf}
          </button>
        ))}
      </div>
      <p style={{ marginTop: 32 }}><Link para="/vender">Tem uma loja? Venda aqui →</Link></p>
    </main>
  )
}

/** Um produto aberto por link (compartilhado no WhatsApp, por exemplo). */
export function PaginaDoProduto({ id }: { id: string }) {
  const { dado, erro } = useCarregar(() => publico.produto(id), id)
  if (erro) return <main className="miolo"><p className="erro">{erro}</p><Link para="/">Ver outros produtos</Link></main>
  if (!dado) return <main className="feed"><Carregando escuro /></main>
  return (
    <>
      <header className="feed-topo">
        <div className="linha">
          <Link para={`/c/${dado.cidadeId}`} className="marca">← Ofertas<b>Locais</b></Link>
        </div>
      </header>
      <main className="feed"><TelaDoProduto produto={dado} aoVer={(v) => publico.vistas([v])} /></main>
    </>
  )
}

export function GradeDeProdutos({ produtos, mostrarLoja = false }: { produtos: ProdutoNaVitrine[]; mostrarLoja?: boolean }) {
  return (
    <div className="grade">
      {produtos.map((p) => (
        <Link key={p.id} para={`/p/${p.id}`} className="quadro">
          {p.fotos[0] && <img src={p.fotos[0]} alt={p.titulo} loading="lazy" />}
          <span className="rotulo">
            <span className="valor">{emReais(p.preco)}</span>
            {mostrarLoja && <><br />{p.lojaNome}</>}
          </span>
        </Link>
      ))}
    </div>
  )
}

export function PaginaDaLoja({ id }: { id: string }) {
  const { dado: loja, erro } = useCarregar<LojaPublica>(() => publico.loja(id), id)
  if (erro) return <main className="miolo"><p className="erro">{erro}</p><Link para="/">Início</Link></main>
  if (!loja) return <Carregando />
  const link = `https://wa.me/55${loja.whatsapp}?text=${encodeURIComponent(`Olá! Vi a ${loja.nome} no Ofertas Locais.`)}`
  const comDesconto = loja.produtos.filter((p) => p.precoDe).length
  return (
    <main className="miolo">
      <Link para={`/c/${loja.cidadeId}`} className="pequeno suave sem-sublinhado">← {loja.cidadeNome}</Link>
      <div className="perfil">
        <div className="avatar" aria-hidden="true">{loja.nome.slice(0, 1).toUpperCase()}</div>
        <h1 className="arroba" style={{ margin: '4px 0 0' }}>@{loja.nome}</h1>
        <div className="suave pequeno">{nomeDaCategoria(loja.categoria)} · {loja.cidadeNome}</div>
        <div className="contagens">
          <div><strong>{loja.produtos.length}</strong><span>produtos</span></div>
          <div><strong className="destaque">{comDesconto}</strong><span>em oferta</span></div>
        </div>
        {loja.descricao && <p style={{ margin: 0, whiteSpace: 'pre-line' }} className="pequeno">{loja.descricao}</p>}
        {loja.endereco && <div className="pequeno suave">📍 {loja.endereco}</div>}
        <div className="botoes">
          {loja.teste
            ? <span className="botao claro" aria-disabled="true">Loja de teste</span>
            : <a className="botao amarelo" href={link} target="_blank" rel="noopener noreferrer"><IconeDeConversa /> WhatsApp</a>}
          <button className="botao claro" onClick={async () => {
            const r = await compartilhar(loja.nome, `/loja/${loja.id}`)
            if (r === 'copiado') window.alert('Link copiado')
          }}>Compartilhar</button>
        </div>
        {!loja.teste && <div className="pequeno suave">{mostrarTelefone(loja.whatsapp)}</div>}
      </div>
      <div className="abas-perfil"><span>▦ Produtos</span></div>
      <GradeDeProdutos produtos={loja.produtos} />
    </main>
  )
}

export function PaginaDaBusca({ cidadeId, consulta }: { cidadeId: string; consulta: string }) {
  const cidade = cidadeId || cidadeLembrada()
  const { dado, erro } = useCarregar<Feed | null>(() => (cidade ? publico.feed(cidade) : Promise.resolve(null)), cidade)
  const [texto, setTexto] = useState(consulta)
  useEffect(() => setTexto(consulta), [consulta])
  const achados = useMemo(() => (dado && consulta ? buscar(dado.produtos, consulta) : []), [dado, consulta])

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (texto.trim()) ir(`/busca?cidade=${encodeURIComponent(cidade)}&q=${encodeURIComponent(texto.trim())}`, true)
  }

  if (!cidade) return <EscolherCidade />
  return (
    <main className="miolo">
      <form className="busca" onSubmit={enviar} role="search">
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="tênis, bolo, ração…"
          aria-label="Buscar produto" enterKeyHint="search" maxLength={60} autoFocus={!consulta} />
        <button className="botao">Buscar</button>
      </form>
      {erro && <p className="erro">{erro}</p>}
      {!dado && !erro && <p className="suave">Carregando…</p>}
      {dado && consulta && <>
        <p className="suave">
          {achados.length ? `${achados.length} em ${dado.cidade.nome}` : `Não achei "${consulta}" em ${dado.cidade.nome}.`}
        </p>
        <GradeDeProdutos produtos={achados} mostrarLoja />
      </>}
    </main>
  )
}

export function PaginaDosSalvos() {
  const [salvos] = useState(lerSalvos)
  return (
    <main className="miolo">
      <h1>Salvos</h1>
      {salvos.length === 0
        ? <p className="suave">Toque em ♡ num produto para guardar aqui. Fica só neste aparelho.</p>
        : <GradeDeProdutos produtos={salvos} mostrarLoja />}
    </main>
  )
}
