import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { publico } from '../dados/api'
import type { Feed as DadosDoFeed, LojaPublica } from '../dados/api'
import { atualizarSalvos } from '../dominio/aparelho'
import type { ProdutoSalvo } from '../dominio/aparelho'
import { buscar } from '../dominio/busca'
import { CATEGORIAS, nomeDaCategoria } from '../dominio/categorias'
import { emReais } from '../dominio/dinheiro'
import { mostrarTelefone } from '../dominio/telefone'
import type { Cidade } from '../dominio/tipos'
import {
  Carregando, compartilhar, EsqueletoDaGrade, EsqueletoDoFeed, Foto, gravarSalvos, lerSalvos, Marca,
  useBuscasRecentes, useCarregar, useSalvos, useSeguidas, useSeguir
} from './comum'
import { Feed } from './Feed'
import { IconeFechar, IconeRelogio } from './icones'
import { IconeDeConversa } from './TelaDoProduto'
import { Link, cidadeLembrada, ir, lembrarCidade } from './rota'

export function EscolherCidade() {
  const { dado: cidades, erro } = useCarregar<Cidade[]>(publico.cidades, 'cidades')
  return (
    <main className="miolo">
      <div className="marca-grande"><Marca /></div>
      <h1>O que as lojas da sua cidade estão vendendo, agora</h1>
      <p className="suave">Role, encontre e chame a loja no WhatsApp.</p>
      <h2>Em qual cidade você está?</h2>
      {erro && <p className="erro">{erro}</p>}
      <div style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
        {!cidades && !erro && <div className="esqueleto" style={{ height: 48 }} />}
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

/** Um produto aberto por link (compartilhado no WhatsApp): ele primeiro, e o feed da cidade continua. */
export function PaginaDoProduto({ id }: { id: string }) {
  const { dado, erro } = useCarregar(() => publico.produto(id), id)
  if (erro) {
    return (
      <main className="miolo">
        <h1>Este produto saiu do ar</h1>
        <p className="suave">A loja pode ter vendido ou pausado. Veja o que mais tem na sua cidade.</p>
        <Link para="/" className="botao">Ver outros produtos</Link>
      </main>
    )
  }
  if (!dado) return <main className="feed"><EsqueletoDoFeed /></main>
  return <Feed key={dado.cidadeId} cidadeId={dado.cidadeId} primeiro={dado} />
}

export function GradeDeProdutos({ produtos, mostrarLoja = false, aoTirar }:
  { produtos: ProdutoSalvo[]; mostrarLoja?: boolean; aoTirar?: (id: string) => void }) {
  return (
    <div className="grade">
      {produtos.map((p) => (
        <div key={p.id} className="quadro-caixa">
          <Link para={`/p/${p.id}`} className="quadro">
            <Foto src={p.fotos[0]} alt="" letra={p.lojaNome.slice(0, 1).toUpperCase()} />
            {p.indisponivel && <span className="pausado">saiu do ar</span>}
            <span className="rotulo">
              <span className="nome">{p.titulo}</span>
              <span className="valor">{emReais(p.preco)}</span>
              {mostrarLoja && <span className="de-loja">{p.lojaNome}</span>}
            </span>
          </Link>
          {aoTirar && (
            <button className="tirar" onClick={() => aoTirar(p.id)} aria-label={`Tirar ${p.titulo} dos salvos`}>
              <IconeFechar tamanho={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

function BotaoSeguir({ loja }: { loja: { id: string; nome: string } }) {
  const [seguindo, alternar] = useSeguir(loja)
  return <button className={`botao ${seguindo ? 'claro' : ''}`} onClick={alternar} aria-pressed={seguindo}>{seguindo ? 'Seguindo' : 'Seguir'}</button>
}

export function PaginaDaLoja({ id }: { id: string }) {
  const { dado: loja, erro } = useCarregar<LojaPublica>(() => publico.loja(id), id)
  if (erro) return <main className="miolo"><p className="erro">{erro}</p><Link para="/">Início</Link></main>
  if (!loja) return <Carregando />
  const link = `https://wa.me/55${loja.whatsapp}?text=${encodeURIComponent(`Olá! Vi a ${loja.nome} no Tik Shop.`)}`
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
          <BotaoSeguir loja={loja} />
          {!loja.teste && <a className="botao amarelo" href={link} target="_blank" rel="noopener noreferrer"><IconeDeConversa /> WhatsApp</a>}
          <button className="botao claro" onClick={() => compartilhar(loja.nome, `/loja/${loja.id}`)}>Compartilhar</button>
        </div>
        <div className="pequeno suave">{loja.teste ? 'Loja de teste · sem WhatsApp' : mostrarTelefone(loja.whatsapp)}</div>
      </div>
      <div className="abas-perfil"><span>▦ Produtos</span></div>
      <GradeDeProdutos produtos={loja.produtos} />
    </main>
  )
}

export function PaginaDaBusca({ cidadeId, consulta }: { cidadeId: string; consulta: string }) {
  const cidade = cidadeId || cidadeLembrada()
  const { dado, erro } = useCarregar<DadosDoFeed | null>(() => (cidade ? publico.feed(cidade) : Promise.resolve(null)), cidade)
  const [texto, setTexto] = useState(consulta)
  const [recentes, lembrar, limpar] = useBuscasRecentes()
  useEffect(() => setTexto(consulta), [consulta])
  useEffect(() => { if (consulta) lembrar(consulta) }, [consulta, lembrar])
  const achados = useMemo(() => (dado && consulta ? buscar(dado.produtos, consulta) : []), [dado, consulta])

  const buscarPor = (termo: string) => ir(`/busca?cidade=${encodeURIComponent(cidade)}&q=${encodeURIComponent(termo.trim())}`, true)
  function enviar(e: FormEvent) {
    e.preventDefault()
    if (texto.trim()) buscarPor(texto)
  }

  if (!cidade) return <EscolherCidade />
  return (
    <main className="miolo">
      <form className="busca" onSubmit={enviar} role="search">
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="tênis, bolo, ração…"
          aria-label="Buscar produto" enterKeyHint="search" maxLength={60} autoFocus={!consulta} type="search" />
        <button className="botao">Buscar</button>
      </form>
      {erro && <p className="erro">{erro}</p>}

      {!consulta && <>
        {recentes.length > 0 && <>
          <div className="linha" style={{ justifyContent: 'space-between' }}>
            <h2 style={{ margin: '8px 0' }}>Buscas recentes</h2>
            <button className="botao-texto" onClick={limpar}>Limpar</button>
          </div>
          <div className="recentes">
            {recentes.map((r) => (
              <button key={r} className="recente" onClick={() => buscarPor(r)}><IconeRelogio tamanho={16} /> {r}</button>
            ))}
          </div>
        </>}
        <h2>Categorias</h2>
        <div className="atalhos">
          {CATEGORIAS.map((c) => (
            <Link key={c.id} para={`/c/${cidade}?categoria=${c.id}`} className="atalho">
              <span className="atalho-icone" aria-hidden="true">{c.icone}</span>{c.nome}
            </Link>
          ))}
        </div>
      </>}

      {consulta && !dado && !erro && <EsqueletoDaGrade />}
      {dado && consulta && <>
        <p className="suave">
          {achados.length ? `${achados.length} em ${dado.cidade.nome}` : `Não achei "${consulta}" em ${dado.cidade.nome}. Tente outra palavra ou veja as categorias.`}
        </p>
        {achados.length === 0 && <Link para={`/busca?cidade=${cidade}`} className="botao claro">Ver categorias</Link>}
        <GradeDeProdutos produtos={achados} mostrarLoja />
      </>}
    </main>
  )
}

export function PaginaDosSalvos() {
  const salvos = useSalvos()
  const seguidas = useSeguidas()
  const [situacao, setSituacao] = useState<Map<string, boolean>>(new Map())

  // O salvo guarda o preço do dia; ao abrir, busca o de hoje e marca o que saiu do ar.
  useEffect(() => {
    const ids = lerSalvos().map((p) => p.id)
    if (ids.length === 0) return
    let vivo = true
    publico.produtos(ids).then((noAr) => {
      if (!vivo) return
      const atualizados = atualizarSalvos(lerSalvos(), noAr)
      setSituacao(new Map(atualizados.map((p) => [p.id, Boolean(p.indisponivel)])))
      gravarSalvos(atualizados.map(({ indisponivel: _, ...p }) => p))
    }, () => { /* sem internet: mostra o que guardou */ })
    return () => { vivo = false }
  }, [])

  const tirar = (id: string) => gravarSalvos(lerSalvos().filter((p) => p.id !== id))
  const lista: ProdutoSalvo[] = salvos.map((p) => ({ ...p, indisponivel: situacao.get(p.id) ?? false }))
  const foraDoAr = lista.filter((p) => p.indisponivel).length

  return (
    <main className="miolo">
      <h1>Salvos</h1>
      {seguidas.length > 0 && <>
        <h2>Lojas que você segue</h2>
        <div className="seguidas">
          {seguidas.map((l) => (
            <Link key={l.id} para={`/loja/${l.id}`} className="seguida">
              <span className="avatar-medio" aria-hidden="true">{l.nome.slice(0, 1).toUpperCase()}</span>
              <span className="seguida-nome">{l.nome}</span>
            </Link>
          ))}
        </div>
        <h2>Produtos</h2>
      </>}
      {lista.length === 0
        ? <p className="suave">Toque no coração de um produto para guardar aqui. Fica só neste aparelho.</p>
        : <>
          {foraDoAr > 0 && (
            <div className="linha" style={{ justifyContent: 'space-between', margin: '0 0 10px' }}>
              <span className="suave pequeno">{foraDoAr === 1 ? '1 saiu do ar' : `${foraDoAr} saíram do ar`}</span>
              <button className="botao-texto" onClick={() => gravarSalvos(lerSalvos().filter((p) => !situacao.get(p.id)))}>Tirar os que saíram</button>
            </div>
          )}
          <GradeDeProdutos produtos={lista} mostrarLoja aoTirar={tirar} />
        </>}
    </main>
  )
}
