import { useState } from 'react'
import { administrador, conta, MOTIVOS_DE_DENUNCIA } from '../dados/api'
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
  const [aba, setAba] = useState<EstadoDaLoja | '' | 'denuncias'>('pendente')
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
      </div>
      {aba === 'denuncias' ? <Denuncias /> : <Lojas estado={aba} />}
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
  if (dado.length === 0) return <p className="suave">Nenhuma loja aqui.</p>
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {falha && <p className="erro">{falha}</p>}
      {dado.map((l) => (
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
        <div key={d.id} className="cartao" style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 12 }}>
          {d.foto ? <img src={d.foto} alt="" style={{ width: 72, height: 96, objectFit: 'cover', borderRadius: 8 }} /> : <div />}
          <div className="linha-admin">
            <strong>{d.titulo}</strong>
            <div className="pequeno">{emReais(d.preco)} · {d.lojaNome}{!d.ativo && ' · fora do ar'}</div>
            <div className="pequeno suave">{MOTIVOS_DE_DENUNCIA.find((m) => m.id === d.motivo)?.nome ?? d.motivo}</div>
            <div className="linha">
              {d.ativo && <Link para={`/p/${d.produtoId}`} className="botao claro pequeno">Ver</Link>}
              <button className="botao pequeno" onClick={() => fazer(() => administrador.tirarDoAr(d.produtoId))}>Tirar do ar</button>
              <button className="botao claro pequeno" onClick={() => fazer(() => administrador.resolver(d.id))}>Sem problema</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
