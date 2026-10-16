import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { publico, MOTIVOS_DE_DENUNCIA } from '../dados/api'
import { emReais } from '../dominio/dinheiro'
import { linkDoWhatsapp } from '../dominio/telefone'
import type { ProdutoNaVitrine } from '../dominio/tipos'
import { avisar, compartilhar, enderecoCompleto, Foto, useSalvo, useSeguir } from './comum'
import { IconeBandeira, IconeCerto, IconeCoracao, IconeEnviar, IconeMais } from './icones'
import { Link } from './rota'

/**
 * Um produto em tela cheia, como um vídeo no TikTok: fotos de lado a lado,
 * preço e loja embaixo, ações à direita, e o botão do WhatsApp.
 */
export function TelaDoProduto({ produto, aoVer }: { produto: ProdutoNaVitrine; aoVer?: (id: string) => void }) {
  const [salvo, alternarSalvo] = useSalvo(produto)
  const [seguindo, alternarSeguir] = useSeguir({ id: produto.lojaId, nome: produto.lojaNome })
  const [fotoAtual, setFotoAtual] = useState(0)
  const [descricaoAberta, setDescricaoAberta] = useState(false)
  const [denunciando, setDenunciando] = useState(false)
  const tela = useRef<HTMLElement>(null)
  const caminho = `/p/${produto.id}`
  const desconto = produto.precoDe ? Math.round((1 - produto.preco / produto.precoDe) * 100) : 0
  const letra = produto.lojaNome.slice(0, 1).toUpperCase()

  // Conta a vista quando o produto ocupa a maior parte da tela.
  useEffect(() => {
    if (!aoVer || !tela.current) return
    const observador = new IntersectionObserver(([e]) => { if (e?.isIntersecting) aoVer(produto.id) }, { threshold: 0.7 })
    observador.observe(tela.current)
    return () => observador.disconnect()
  }, [aoVer, produto.id])

  function rolouFotos(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    setFotoAtual(Math.round(el.scrollLeft / el.clientWidth))
  }

  async function denunciar(motivo: string) {
    setDenunciando(false)
    try {
      await publico.denunciar(produto.id, motivo)
      avisar('Obrigado! Vamos olhar.')
    } catch (e) {
      avisar((e as Error).message)
    }
  }

  const whatsapp = linkDoWhatsapp(produto.lojaWhatsapp, { titulo: produto.titulo, preco: produto.preco, url: enderecoCompleto(caminho) })

  return (
    <section className="tela" ref={tela} aria-label={produto.titulo}>
      <div className="fotos" onScroll={rolouFotos}>
        {produto.fotos.map((url, i) => (
          <div className="foto" key={url}>
            {/* Só a primeira foto vem logo; as do lado esperam o dedo. */}
            <Foto className="fundo" src={url} alt="" eager={i === 0} />
            <Foto className="frente" src={url} alt={i === 0 ? produto.titulo : `${produto.titulo}, foto ${i + 1}`} letra={letra} eager={i === 0} />
          </div>
        ))}
        {produto.fotos.length === 0 && <div className="foto"><Foto className="frente" src={undefined} alt={produto.titulo} letra={letra} /></div>}
      </div>
      {produto.fotos.length > 1 && (
        <div className="pontos" aria-hidden="true">
          {produto.fotos.map((url, i) => <span key={url} data-atual={i === fotoAtual} />)}
        </div>
      )}

      <div className="acoes">
        <div className="avatar-com-seguir">
          <Link para={`/loja/${produto.lojaId}`} className="avatar-pequeno" aria-label={`Loja ${produto.lojaNome}`}>{letra}</Link>
          <button className="seguir" data-seguindo={seguindo} onClick={alternarSeguir}
            aria-label={seguindo ? `Deixar de seguir ${produto.lojaNome}` : `Seguir ${produto.lojaNome}`}>
            {seguindo ? <IconeCerto tamanho={14} /> : <IconeMais tamanho={14} />}
          </button>
        </div>
        <button className="acao" aria-pressed={salvo} onClick={alternarSalvo}>
          <span className="bola"><IconeCoracao tamanho={34} cheio /></span>{salvo ? 'Salvo' : 'Salvar'}
        </button>
        <button className="acao" onClick={() => compartilhar(produto.titulo, caminho)}>
          <span className="bola"><IconeEnviar tamanho={32} /></span>Enviar
        </button>
        <button className="acao discreta" onClick={() => setDenunciando(true)}>
          <span className="bola"><IconeBandeira tamanho={22} /></span>Denunciar
        </button>
      </div>

      <div className="legenda">
        <Link para={`/loja/${produto.lojaId}`} className="loja">@{produto.lojaNome}{produto.lojaTeste && <span className="selo-teste">TESTE</span>}</Link>
        {/* O nome do produto vem antes e maior: é o que quem rola quer saber. */}
        <h2 className="titulo">{produto.titulo}</h2>
        {produto.descricao && <>
          <div className={`descricao ${descricaoAberta ? '' : 'curta'}`}>{produto.descricao}</div>
          {produto.descricao.length > 90 && (
            <button className="mais" onClick={() => setDescricaoAberta(!descricaoAberta)}>{descricaoAberta ? 'menos' : 'mais'}</button>
          )}
        </>}
        <div className="preco-linha">
          <span className="preco">{emReais(produto.preco)}</span>
          {produto.precoDe && <span className="preco-de">{emReais(produto.precoDe)}</span>}
          {desconto >= 5 && <span className="selo">-{desconto}%</span>}
        </div>
        {produto.lojaTeste
          // Loja de dados de teste: o número é inventado e pode ser de alguém de verdade.
          ? <span className="chamar teste" aria-disabled="true">Loja de teste · sem WhatsApp</span>
          : <a className="chamar" href={whatsapp} target="_blank" rel="noopener noreferrer" onClick={() => publico.clique(produto.id)}>
              <IconeDeConversa /> Chamar no WhatsApp
            </a>}
      </div>

      {denunciando && (
        <Folha titulo="O que há de errado?" fechar={() => setDenunciando(false)}>
          {MOTIVOS_DE_DENUNCIA.map((m) => (
            <button key={m.id} className="botao claro largo" onClick={() => denunciar(m.id)}>{m.nome}</button>
          ))}
        </Folha>
      )}
    </section>
  )
}

/** Folha que sobe de baixo, com fundo escuro: toque fora ou Esc fecha. */
export function Folha({ titulo, fechar, children }: { titulo: string; fechar: () => void; children: React.ReactNode }) {
  const caixa = useRef<HTMLDivElement>(null)
  // Por referência: quem chama passa uma função nova a cada render, e o foco não pode pular.
  const aoFechar = useRef(fechar)
  aoFechar.current = fechar
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null
    caixa.current?.querySelector<HTMLElement>('button')?.focus()
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') aoFechar.current() }
    document.addEventListener('keydown', tecla)
    return () => { document.removeEventListener('keydown', tecla); anterior?.focus() }
  }, [])
  return createPortal(
    <div className="folha-fundo" onClick={fechar}>
      <div className="folha" role="dialog" aria-modal="true" aria-label={titulo} ref={caixa} onClick={(e) => e.stopPropagation()}>
        <div className="folha-alca" aria-hidden="true" />
        <strong className="folha-titulo">{titulo}</strong>
        <div className="folha-opcoes">{children}</div>
        <button className="botao-texto" onClick={fechar}>Cancelar</button>
      </div>
    </div>,
    document.body
  )
}

/** Balão de conversa com telefone, desenhado aqui: não usamos a marca do WhatsApp. */
export function IconeDeConversa() {
  return (
    <svg className="icone-whats" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 20.5l1.3-4A8.5 8.5 0 1 1 8 19.3z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.4-2-1-1 .8a4 4 0 0 1-2.1-2.1l.8-1-1-2z" fill="currentColor" stroke="none" />
    </svg>
  )
}
