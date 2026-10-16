import { useState } from 'react'
import type { FormEvent } from 'react'
import { administrador, conta, MOTIVOS_DE_DENUNCIA, publico } from '../dados/api'
import type { LojaNoAdmin } from '../dados/api'
import { nomeDaCategoria } from '../dominio/categorias'
import { emReais } from '../dominio/dinheiro'
import { mostrarTelefone } from '../dominio/telefone'
import type { EstadoDaLoja } from '../dominio/tipos'
import { Carregando, useCarregar } from './comum'
import { Link } from './rota'
import { Entrar } from './Vender'

/** /admin: aprovar lojas e cuidar das denúncias. */
export function Admin() {
  const { dado, recarregar } = useCarregar(conta.eu, 'eu-admin')
  if (!dado) return <Carregando />
  if (dado.sessao?.papel !== 'admin') {
    return (
      <main className="miolo">
        <h1>Administração</h1>
        {dado.sessao && <p className="aviso">Esta conta é de lojista. <Link para="/vender">Ir para a loja</Link></p>}
        {!dado.sessao && <Entrar entrou={recarregar} />}
      </main>
    )
  }
  return <Painel sair={() => conta.sair().then(recarregar)} />
}

const ESTADOS: { id: EstadoDaLoja | ''; nome: string }[] = [
  { id: 'pendente', nome: 'Para aprovar' },
  { id: 'aprovada', nome: 'Aprovadas' },
  { id: 'recusada', nome: 'Recusadas' },
  { id: 'bloqueada', nome: 'Bloqueadas' }
]

function Painel({ sair }: { sair: () => void }) {
  const [aba, setAba] = useState<EstadoDaLoja | '' | 'denuncias' | 'exemplos'>('pendente')
  return (
    <main className="miolo">
      <div className="linha">
        <h1 style={{ marginRight: 'auto' }}>Administração</h1>
        <button className="botao claro pequeno" onClick={sair}>Sair</button>
      </div>
      <div className="abas" style={{ flexWrap: 'wrap' }}>
        {ESTADOS.map((e) => (
          <button key={e.id} className={`botao pequeno ${aba === e.id ? '' : 'claro'}`} onClick={() => setAba(e.id)}>{e.nome}</button>
        ))}
        <button className={`botao pequeno ${aba === 'denuncias' ? '' : 'claro'}`} onClick={() => setAba('denuncias')}>Denúncias</button>
        <button className={`botao pequeno ${aba === 'exemplos' ? '' : 'claro'}`} onClick={() => setAba('exemplos')}>Dados de teste</button>
      </div>
      {aba === 'denuncias' ? <Denuncias /> : aba === 'exemplos' ? <Exemplos /> : <Lojas estado={aba} />}
    </main>
  )
}

function Lojas({ estado }: { estado: EstadoDaLoja | '' }) {
  const { dado, erro, recarregar } = useCarregar(() => administrador.lojas(estado), `lojas|${estado}`)
  const [falha, setFalha] = useState('')
  async function mudar(loja: LojaNoAdmin, novo: EstadoDaLoja) {
    if (novo === 'bloqueada' && !window.confirm(`Bloquear ${loja.nome}? Some do feed e o lojista é desconectado.`)) return
    try {
      await administrador.estado(loja.id, novo)
      recarregar()
    } catch (e) {
      setFalha((e as Error).message)
    }
  }
  if (erro) return <p className="erro">{erro}</p>
  if (!dado) return <p className="suave">Carregando…</p>
  if (dado.lojas.length === 0) return <p className="suave">Nenhuma loja aqui.</p>
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {falha && <p className="erro">{falha}</p>}
      {dado.total > dado.lojas.length && <p className="aviso pequeno">Mostrando as {dado.lojas.length} mais antigas de {dado.total}.</p>}
      {dado.lojas.map((l) => (
        <div key={l.id} className="cartao linha-admin">
          <div className="linha"><strong style={{ marginRight: 'auto' }}>{l.nome}</strong><span className={`estado ${l.estado}`}>{l.estado}</span></div>
          <div className="pequeno suave">{nomeDaCategoria(l.categoria)} · {l.cidade} · usuário {l.usuario} · {l.produtos} {l.produtos === 1 ? "produto" : "produtos"}</div>
          <div className="pequeno">
            WhatsApp <a href={`https://wa.me/55${l.whatsapp}`} target="_blank" rel="noopener noreferrer">{mostrarTelefone(l.whatsapp)}</a>
            {l.endereco && <> · {l.endereco}</>}
          </div>
          {l.descricao && <div className="pequeno" style={{ whiteSpace: 'pre-line' }}>{l.descricao}</div>}
          <div className="linha">
            {l.estado !== 'aprovada' && <button className="botao pequeno" onClick={() => mudar(l, 'aprovada')}>Aprovar</button>}
            {l.estado === 'pendente' && <button className="botao claro pequeno" onClick={() => mudar(l, 'recusada')}>Recusar</button>}
            {l.estado !== 'bloqueada' && <button className="botao claro pequeno" onClick={() => mudar(l, 'bloqueada')}>Bloquear</button>}
            {l.estado === 'aprovada' && <Link para={`/loja/${l.id}`} className="botao claro pequeno">Ver loja</Link>}
          </div>
        </div>
      ))}
    </div>
  )
}

function Denuncias() {
  const { dado, erro, recarregar } = useCarregar(administrador.denuncias, 'denuncias')
  const [falha, setFalha] = useState('')
  async function fazer(acao: () => Promise<void>) {
    try {
      await acao()
      recarregar()
    } catch (e) {
      setFalha((e as Error).message)
    }
  }
  if (erro) return <p className="erro">{erro}</p>
  if (!dado) return <p className="suave">Carregando…</p>
  if (dado.length === 0) return <p className="suave">Nenhuma denúncia em aberto.</p>
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {falha && <p className="erro">{falha}</p>}
      {dado.map((d) => (
        <div key={d.produtoId} className="cartao" style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 12 }}>
          {d.foto ? <img src={d.foto} alt="" style={{ width: 72, height: 96, objectFit: 'cover', borderRadius: 8 }} /> : <div />}
          <div className="linha-admin">
            <strong>{d.titulo}</strong>
            <div className="pequeno">{emReais(d.preco)} · {d.lojaNome}{!d.ativo && ' · fora do ar'}</div>
            <div className="pequeno suave">
              {d.quantas} {d.quantas === 1 ? 'denúncia' : 'denúncias'}: {d.motivos.map((m) => MOTIVOS_DE_DENUNCIA.find((x) => x.id === m)?.nome ?? m).join(', ')}
            </div>
            <div className="linha">
              {d.ativo && <Link para={`/p/${d.produtoId}`} className="botao claro pequeno">Ver</Link>}
              <button className="botao pequeno" onClick={() => fazer(() => administrador.tirarDoAr(d.produtoId))}>Tirar do ar</button>
              <button className="botao claro pequeno" onClick={() => fazer(() => administrador.resolver(d.produtoId))}>Sem problema</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Dados de teste: lojas e produtos inventados para ver o feed cheio. Ficam
 * marcados como teste (não abrem WhatsApp) e saem com um toque.
 */
function Exemplos() {
  const { dado: resumo, recarregar } = useCarregar(administrador.resumoExemplos, 'resumo-exemplos')
  const { dado: cidades } = useCarregar(publico.cidades, 'cidades')
  const [cidadeId, setCidadeId] = useState('caceres-mt')
  const [lojas, setLojas] = useState(40)
  const [porLoja, setPorLoja] = useState(25)
  const [estado, setEstado] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function gerar(e: FormEvent) {
    e.preventDefault()
    setOcupado(true)
    setEstado('Gerando…')
    try {
      const r = await administrador.gerarExemplos(cidadeId, lojas, porLoja)
      setEstado(`Pronto: ${r.lojas} lojas e ${r.produtos} produtos de teste. O feed atualiza em até 1 minuto.`)
      recarregar()
    } catch (falha) {
      setEstado((falha as Error).message)
    } finally {
      setOcupado(false)
    }
  }

  async function apagar() {
    if (!window.confirm('Apagar todas as lojas e produtos de teste? As lojas de verdade não são tocadas.')) return
    setOcupado(true)
    try {
      const r = await administrador.apagarExemplos()
      setEstado(`Apagadas ${r.lojas} lojas de teste e os produtos delas.`)
      recarregar()
    } catch (falha) {
      setEstado((falha as Error).message)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div className="numeros">
        <div><strong>{resumo?.lojas ?? '…'}</strong><span>lojas de teste</span></div>
        <div><strong className="destaque">{resumo?.produtos ?? '…'}</strong><span>produtos de teste</span></div>
      </div>
      <form className="formulario cartao" onSubmit={gerar}>
        <label>Cidade
          <select value={cidadeId} onChange={(e) => setCidadeId(e.target.value)}>
            {cidades?.map((c) => <option key={c.id} value={c.id}>{c.nome} - {c.uf}</option>)}
          </select>
        </label>
        <div className="linha" style={{ flexWrap: 'nowrap' }}>
          <label style={{ flex: 1 }}>Lojas<input type="number" min={1} max={200} value={lojas} onChange={(e) => setLojas(Number(e.target.value))} /></label>
          <label style={{ flex: 1 }}>Produtos por loja<input type="number" min={1} max={100} value={porLoja} onChange={(e) => setPorLoja(Number(e.target.value))} /></label>
        </div>
        <span className="suave pequeno">Total: {lojas * porLoja} produtos (máximo 5.000 por vez). Lojas de teste não abrem WhatsApp.</span>
        <button className="botao" disabled={ocupado}>Gerar dados de teste</button>
      </form>
      <button className="botao claro" onClick={apagar} disabled={ocupado || !resumo?.lojas}>Apagar dados de teste</button>
      {estado && <p className="aviso" role="status">{estado}</p>}
    </div>
  )
}
