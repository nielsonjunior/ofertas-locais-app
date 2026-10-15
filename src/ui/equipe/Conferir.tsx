import { useCallback, useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { equipe } from '../../dados/api'
import type { OfertaDaConferencia, OfertaParaGravar, PanfletoDaConferencia } from '../../dados/api'
import { prepararPagina } from '../../dados/imagem'
import { Pagina } from '../Pagina'
import { ir } from '../rota'

/**
 * A conferência: as páginas de um lado, as ofertas lidas do outro. Nada vai
 * ao ar sem passar por aqui; o que a IA marcou em dúvida aparece em amarelo
 * e trava a publicação até alguém gravar.
 */

function emTexto(centavos: number | null): string {
  return centavos === null ? '' : (centavos / 100).toFixed(2).replace('.', ',')
}

function paraGravar(o: OfertaDaConferencia): OfertaParaGravar {
  return {
    produto: o.produto, marca: o.marca, quantidade: o.quantidade,
    preco: emTexto(o.preco), precoDe: emTexto(o.precoDe), condicao: o.condicao
  }
}

const VAZIA: OfertaParaGravar = { produto: '', marca: '', quantidade: '', preco: '', precoDe: '', condicao: '' }

function Item({ oferta, pagina, gravar, apagar }: {
  oferta?: OfertaDaConferencia
  pagina: number
  gravar: (o: OfertaParaGravar) => Promise<void>
  apagar?: () => Promise<void>
}) {
  const [campos, setCampos] = useState<OfertaParaGravar>(oferta ? paraGravar(oferta) : VAZIA)
  const [erro, setErro] = useState('')
  const [salvo, setSalvo] = useState(false)
  const mudou = !oferta || JSON.stringify(campos) !== JSON.stringify(paraGravar(oferta))
  const duvida = oferta?.confianca === 'baixa'

  function campo(nome: keyof OfertaParaGravar, rotulo: string, classe = '') {
    return (
      <input
        className={`campo ${classe}`} placeholder={rotulo} aria-label={rotulo} value={campos[nome]} maxLength={120}
        inputMode={nome === 'preco' || nome === 'precoDe' ? 'decimal' : undefined}
        onChange={(e: ChangeEvent<HTMLInputElement>) => { setCampos({ ...campos, [nome]: e.target.value }); setSalvo(false) }}
      />
    )
  }

  async function salvar() {
    setErro('')
    try {
      await gravar(campos)
      if (!oferta) setCampos(VAZIA)
      setSalvo(true)
    } catch (falha) {
      setErro((falha as Error).message)
    }
  }

  return (
    <div className={`item ${duvida ? 'duvida' : ''}`}>
      {campo('produto', 'produto', 'inteira')}
      {campo('marca', 'marca')}
      {campo('quantidade', 'tamanho (5 kg)')}
      {campo('condicao', 'condição')}
      {campo('preco', 'preço')}
      {campo('precoDe', 'preço "de"')}
      <div className="linha acoes">
        <button className="botao pequeno" onClick={salvar} disabled={!mudou && !duvida}>
          {oferta ? (duvida && !mudou ? 'Está certo' : 'Gravar') : `Incluir na pág. ${pagina}`}
        </button>
        {apagar && <button className="botao claro pequeno" onClick={() => apagar().catch((e: Error) => setErro(e.message))}>Apagar</button>}
        {salvo && <span className="pequeno suave">gravado</span>}
      </div>
      {erro && <p className="erro inteira pequeno">{erro}</p>}
    </div>
  )
}

export function Conferir({ id }: { id: string }) {
  const [p, setP] = useState<PanfletoDaConferencia | null>(null)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState('')
  const [validoDe, setValidoDe] = useState('')
  const [validoAte, setValidoAte] = useState('')

  const recarregar = useCallback(async () => {
    try {
      const novo = await equipe.panfleto(id)
      setP(novo)
      setValidoDe(novo.validoDe)
      setValidoAte(novo.validoAte)
    } catch (e) {
      setErro((e as Error).message)
    }
  }, [id])
  useEffect(() => { void recarregar() }, [recarregar])

  async function enviar(e: ChangeEvent<HTMLInputElement>) {
    const arquivos = [...(e.target.files ?? [])]
    e.target.value = ''
    setErro('')
    setAviso('')
    for (const [i, arquivo] of arquivos.entries()) {
      setEnviando(`Lendo página ${i + 1} de ${arquivos.length}… (pode levar um minuto)`)
      try {
        const r = await equipe.enviarPagina(id, await prepararPagina(arquivo))
        setAviso((a) => `${a}Pág. ${r.pagina}: ${r.lidas} ofertas lidas${r.descartadas ? `, ${r.descartadas} descartadas` : ''}. ${r.aviso}\n`)
      } catch (falha) {
        setErro(`${arquivo.name}: ${(falha as Error).message}`)
        break
      }
      await recarregar()
    }
    setEnviando('')
  }

  async function acao(fazer: () => Promise<void>) {
    setErro('')
    try {
      await fazer()
      await recarregar()
    } catch (falha) {
      setErro((falha as Error).message)
    }
  }

  if (!p) return <main className="miolo">{erro ? <p className="erro">{erro}</p> : <p className="suave">Carregando…</p>}</main>

  const duvidas = p.ofertas.filter((o) => o.confianca === 'baixa').length
  const publicado = p.estado === 'publicado'

  return (
    <main className="miolo">
      <div className="linha">
        <h1 style={{ marginRight: 'auto' }}>{p.mercadoNome}</h1>
        {publicado
          ? <>
              <a className="botao claro pequeno" href={`/panfleto/${p.id}`} target="_blank" rel="noreferrer">Ver no site</a>
              <button className="botao claro pequeno" onClick={() => acao(() => equipe.despublicar(p.id))}>Tirar do ar</button>
            </>
          : <button className="botao" onClick={() => acao(() => equipe.publicar(p.id))} disabled={duvidas > 0 || p.ofertas.length === 0}>
              {duvidas > 0 ? `Confira ${duvidas} em amarelo` : 'Publicar'}
            </button>}
      </div>

      <div className="linha">
        <label className="pequeno suave">Vale de <input className="campo" type="date" value={validoDe} onChange={(e) => setValidoDe(e.target.value)} /></label>
        <label className="pequeno suave">até <input className="campo" type="date" value={validoAte} onChange={(e) => setValidoAte(e.target.value)} /></label>
        {(validoDe !== p.validoDe || validoAte !== p.validoAte) &&
          <button className="botao pequeno" onClick={() => acao(() => equipe.validade(p.id, validoDe, validoAte))}>Gravar validade</button>}
      </div>

      {erro && <p className="erro">{erro}</p>}
      {aviso && <p className="aviso" style={{ whiteSpace: 'pre-line' }}>{aviso}</p>}

      {!publicado && (
        <p>
          <label className="botao claro">
            {enviando || 'Enviar páginas (fotos ou PDF)'}
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple hidden onChange={enviar} disabled={Boolean(enviando)} />
          </label>
        </p>
      )}

      <div className="conferencia">
        <div className="paginas">
          {p.paginas.map((tipo, i) => <Pagina key={i} panfletoId={p.id} numero={i + 1} tipo={tipo} />)}
          {p.paginas.length === 0 && <p className="suave">Nenhuma página enviada.</p>}
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <strong>{p.ofertas.length} ofertas</strong>
          {p.ofertas.map((o) => (
            <Item
              key={`${o.id}-${o.confianca}`} oferta={o} pagina={o.pagina}
              gravar={async (campos) => { await equipe.gravarOferta(o.id, campos); await recarregar() }}
              apagar={() => acao(() => equipe.apagarOferta(o.id))}
            />
          ))}
          <strong>Incluir oferta à mão</strong>
          <Item pagina={Math.max(1, p.paginas.length)} gravar={async (campos) => { await equipe.novaOferta(p.id, Math.max(1, p.paginas.length), campos); await recarregar() }} />
          <button className="botao claro pequeno" onClick={() => {
            if (window.confirm('Apagar este panfleto e todas as ofertas dele?')) void acao(async () => { await equipe.apagarPanfleto(p.id); ir('/equipe') })
          }}>Apagar panfleto</button>
        </div>
      </div>
    </main>
  )
}
