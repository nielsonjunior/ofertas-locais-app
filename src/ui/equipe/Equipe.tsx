import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { equipe } from '../../dados/api'
import type { Mercado, PanfletoDaLista } from '../../dados/api'
import type { Cidade } from '../../dominio/tipos'
import { Link, ir } from '../rota'
import { Conferir } from './Conferir'

const NOME_DO_ESTADO = { lendo: 'sem páginas', conferir: 'conferir', publicado: 'no ar' } as const

function Entrar({ entrou }: { entrou: (usuario: string) => void }) {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [indo, setIndo] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setIndo(true)
    setErro('')
    try {
      entrou((await equipe.entrar(usuario, senha)).usuario)
    } catch (falha) {
      setErro((falha as Error).message)
    } finally {
      setIndo(false)
    }
  }

  return (
    <main className="miolo">
      <h1>Equipe</h1>
      <form className="formulario" onSubmit={enviar}>
        <label>Usuário<input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" autoCapitalize="none" required /></label>
        <label>Senha<input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required /></label>
        {erro && <p className="erro">{erro}</p>}
        <button className="botao" disabled={indo}>{indo ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </main>
  )
}

function NovoPanfleto({ cidades, mercados, recarregar }: { cidades: Cidade[]; mercados: Mercado[]; recarregar: () => void }) {
  const [mercadoId, setMercadoId] = useState('')
  const [novoNome, setNovoNome] = useState('')
  const [novoEndereco, setNovoEndereco] = useState('')
  const [cidadeId, setCidadeId] = useState(cidades[0]?.id ?? '')
  const [validoDe, setValidoDe] = useState('')
  const [validoAte, setValidoAte] = useState('')
  const [erro, setErro] = useState('')

  async function criar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    try {
      let id = mercadoId
      if (id === 'novo') {
        id = (await equipe.novoMercado(cidadeId, novoNome, novoEndereco)).id
        recarregar()
      }
      const { id: panfletoId } = await equipe.novoPanfleto(id, validoDe, validoAte)
      ir(`/equipe/panfleto/${panfletoId}`)
    } catch (falha) {
      setErro((falha as Error).message)
    }
  }

  return (
    <form className="formulario cartao" onSubmit={criar}>
      <strong>Novo panfleto</strong>
      <label>Mercado
        <select value={mercadoId} onChange={(e) => setMercadoId(e.target.value)} required>
          <option value="" disabled>escolha…</option>
          {mercados.filter((m) => m.ativo).map((m) => (
            <option key={m.id} value={m.id}>{m.nome} — {cidades.find((c) => c.id === m.cidadeId)?.nome}</option>
          ))}
          <option value="novo">+ cadastrar mercado</option>
        </select>
      </label>
      {mercadoId === 'novo' && <>
        <label>Cidade
          <select value={cidadeId} onChange={(e) => setCidadeId(e.target.value)}>
            {cidades.map((c) => <option key={c.id} value={c.id}>{c.nome} - {c.uf}</option>)}
          </select>
        </label>
        <label>Nome do mercado<input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} required maxLength={80} /></label>
        <label>Endereço<input value={novoEndereco} onChange={(e) => setNovoEndereco(e.target.value)} maxLength={160} /></label>
      </>}
      <div className="linha">
        <label style={{ flex: 1 }}>Vale de<input type="date" value={validoDe} onChange={(e) => setValidoDe(e.target.value)} /></label>
        <label style={{ flex: 1 }}>até<input type="date" value={validoAte} onChange={(e) => setValidoAte(e.target.value)} /></label>
      </div>
      <span className="suave pequeno">Em branco, a validade vem da leitura do panfleto.</span>
      {erro && <p className="erro">{erro}</p>}
      <button className="botao">Criar e enviar páginas</button>
    </form>
  )
}

function Painel() {
  const [panfletos, setPanfletos] = useState<PanfletoDaLista[] | null>(null)
  const [cadastro, setCadastro] = useState<{ cidades: Cidade[]; mercados: Mercado[] } | null>(null)
  const [erro, setErro] = useState('')

  const recarregar = useCallback(() => {
    equipe.panfletos().then(setPanfletos, (e: Error) => setErro(e.message))
    equipe.mercados().then(setCadastro, (e: Error) => setErro(e.message))
  }, [])
  useEffect(recarregar, [recarregar])

  return (
    <main className="miolo">
      <h1>Panfletos</h1>
      {erro && <p className="erro">{erro}</p>}
      {cadastro && <NovoPanfleto {...cadastro} recarregar={recarregar} />}
      <h2>Recentes</h2>
      {panfletos?.length === 0 && <p className="suave">Nenhum panfleto ainda.</p>}
      <div className="grade">
        {panfletos?.map((p) => (
          <Link key={p.id} para={`/equipe/panfleto/${p.id}`} className="cartao">
            <div className="linha"><span className="mercado">{p.mercadoNome}</span><span className={`estado ${p.estado}`}>{NOME_DO_ESTADO[p.estado]}</span></div>
            <div className="suave pequeno">
              {p.paginas} pág. · {p.ofertas} ofertas{p.duvidas > 0 && ` · ${p.duvidas} em dúvida`}
              {p.validoAte && ` · até ${p.validoAte.slice(8, 10)}/${p.validoAte.slice(5, 7)}`}
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}

export function Equipe({ caminho }: { caminho: string }) {
  const [usuario, setUsuario] = useState<string | null | undefined>(undefined)
  useEffect(() => { equipe.eu().then((r) => setUsuario(r.usuario), () => setUsuario(null)) }, [])

  if (usuario === undefined) return <main className="miolo"><p className="suave">Carregando…</p></main>
  if (!usuario) return <Entrar entrou={setUsuario} />

  const panfletoId = /^\/equipe\/panfleto\/([\w-]+)$/.exec(caminho)?.[1]
  return (
    <>
      <div className="miolo linha pequeno" style={{ paddingBottom: 0 }}>
        <Link para="/equipe">Panfletos</Link>
        <span className="suave" style={{ marginLeft: 'auto' }}>{usuario}</span>
        <button className="botao claro pequeno" onClick={() => equipe.sair().then(() => setUsuario(null))}>Sair</button>
      </div>
      {panfletoId ? <Conferir id={panfletoId} /> : <Painel />}
    </>
  )
}
