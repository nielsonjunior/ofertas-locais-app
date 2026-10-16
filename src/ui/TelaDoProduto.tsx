import { useEffect, useRef, useState } from 'react'
import { publico, MOTIVOS_DE_DENUNCIA } from '../dados/api'
import { emReais } from '../dominio/dinheiro'
import { linkDoWhatsapp } from '../dominio/telefone'
import type { ProdutoNaVitrine } from '../dominio/tipos'
import { compartilhar, enderecoCompleto, useSalvo } from './comum'
import { Link } from './rota'

/**
 * Um produto em tela cheia, como um vídeo no TikTok: fotos de lado a lado,
 * preço e loja embaixo, ações à direita, e o botão do WhatsApp.
 */
export function TelaDoProduto({ produto, aoVer }: { produto: ProdutoNaVitrine; aoVer?: (id: string) => void }) {
  const [salvo, alternarSalvo] = useSalvo(produto)
  const [fotoAtual, setFotoAtual] = useState(0)
  const [descricaoAberta, setDescricaoAberta] = useState(false)
  const [aviso, setAviso] = useState('')
  const [denunciando, setDenunciando] = useState(false)
  const tela = useRef<HTMLElement>(null)
  const caminho = `/p/${produto.id}`
  const desconto = produto.precoDe ? Math.round((1 - produto.preco / produto.precoDe) * 100) : 0

  // Conta a vista quando o produto ocupa a maior parte da tela.
  useEffect(() => {
    if (!aoVer || !tela.current) return
    const observador = new IntersectionObserver(([e]) => { if (e?.isIntersecting) aoVer(produto.id) }, { threshold: 0.7 })
    observador.observe(tela.current)
    return () => observador.disconnect()
  }, [aoVer, produto.id])

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(''), 2500)
    return () => clearTimeout(t)
  }, [aviso])

  function rolouFotos(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    setFotoAtual(Math.round(el.scrollLeft / el.clientWidth))
  }

  async function denunciar(motivo: string) {
    setDenunciando(false)
    try {
      await publico.denunciar(produto.id, motivo)
      setAviso('Obrigado! Vamos olhar.')
    } catch (e) {
      setAviso((e as Error).message)
    }
  }

  const whatsapp = linkDoWhatsapp(produto.lojaWhatsapp, { titulo: produto.titulo, preco: produto.preco, url: enderecoCompleto(caminho) })

  return (
    <section className="tela" ref={tela} aria-label={produto.titulo}>
      <div className="fotos" onScroll={rolouFotos}>
        {produto.fotos.map((url, i) => (
          <div className="foto" key={url}>
            <img className="fundo" src={url} alt="" aria-hidden="true" loading={i === 0 ? 'eager' : 'lazy'} />
            <img className="frente" src={url} alt={i === 0 ? produto.titulo : `${produto.titulo}, foto ${i + 1}`} loading={i === 0 ? 'eager' : 'lazy'} />
          </div>
        ))}
      </div>
      {produto.fotos.length > 1 && (
        <div className="pontos" aria-hidden="true">
          {produto.fotos.map((url, i) => <span key={url} data-atual={i === fotoAtual} />)}
        </div>
      )}

      <div className="acoes">
        <Link para={`/loja/${produto.lojaId}`} className="acao" aria-label={`Loja ${produto.lojaNome}`}>
          <span className="avatar-pequeno" aria-hidden="true">{produto.lojaNome.slice(0, 1).toUpperCase()}</span>
        </Link>
        <button className="acao" aria-pressed={salvo} onClick={alternarSalvo} aria-label={salvo ? 'Tirar dos salvos' : 'Salvar'}>
          <span className="bola" aria-hidden="true">♥</span>{salvo ? 'Salvo' : 'Salvar'}
        </button>
        <button className="acao" onClick={async () => {
          const r = await compartilhar(produto.titulo, caminho)
          if (r === 'copiado') setAviso('Link copiado')
        }}>
          <span className="bola" aria-hidden="true">➦</span>Enviar
        </button>
        <button className="acao" onClick={() => setDenunciando(true)} aria-label="Denunciar">
          <span className="bola" aria-hidden="true" style={{ fontSize: 24 }}>⚑</span>
        </button>
      </div>

      <div className="legenda">
        <Link para={`/loja/${produto.lojaId}`} className="loja">@{produto.lojaNome}{produto.lojaTeste && <span className="selo-teste">TESTE</span>}</Link>
        <div className="titulo">{produto.titulo}</div>
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
        {aviso && <div className="pequeno" role="status">{aviso}</div>}
        {denunciando && (
          <div className="cartao" role="dialog" aria-label="Denunciar produto">
            <strong>O que há de errado?</strong>
            <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
              {MOTIVOS_DE_DENUNCIA.map((m) => (
                <button key={m.id} className="botao claro pequeno" onClick={() => denunciar(m.id)}>{m.nome}</button>
              ))}
              <button className="botao pequeno" onClick={() => setDenunciando(false)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </section>
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
