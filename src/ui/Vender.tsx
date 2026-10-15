import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { conta, lojista, publico } from '../dados/api'
import type { Cadastro, MinhaLoja, ProdutoParaGravar, Sessao } from '../dados/api'
import { prepararFoto } from '../dados/imagem'
import { CATEGORIAS } from '../dominio/categorias'
import { emReais } from '../dominio/dinheiro'
import { mostrarTelefone } from '../dominio/telefone'
import type { Cidade, ProdutoDaLoja } from '../dominio/tipos'
import { Carregando, useCarregar } from './comum'
import { Link } from './rota'

/** /vender: entrar ou cadastrar a loja; logado, o painel do lojista. */
export function Vender() {
  const { dado, erro, recarregar } = useCarregar(conta.eu, 'eu')
  if (erro) return <main className="miolo"><p className="erro">{erro}</p></main>
  if (!dado) return <Carregando />
  if (!dado.sessao) return <EntrarOuCadastrar entrou={recarregar} />
  if (dado.sessao.papel === 'admin') return <main className="miolo"><p>Você entrou como administrador.</p><Link para="/admin" className="botao">Ir para o admin</Link></main>
  return <Painel sessao={dado.sessao} saiu={recarregar} />
}

function EntrarOuCadastrar({ entrou }: { entrou: () => void }) {
  const [aba, setAba] = useState<'cadastrar' | 'entrar'>('cadastrar')
  return (
    <main className="miolo">
      <h1>Venda para a sua cidade</h1>
      <p className="suave">Poste seus produtos com foto e preço. Quem gostar chama você no WhatsApp. Sem taxa por venda.</p>
      <div className="abas">
        <button className={`botao pequeno ${aba === 'cadastrar' ? '' : 'claro'}`} onClick={() => setAba('cadastrar')}>Criar minha loja</button>
        <button className={`botao pequeno ${aba === 'entrar' ? '' : 'claro'}`} onClick={() => setAba('entrar')}>Já tenho conta</button>
      </div>
      {aba === 'entrar' ? <Entrar entrou={entrou} /> : <Cadastrar entrou={entrou} />}
    </main>
  )
}

export function Entrar({ entrou }: { entrou: (s: Sessao) => void }) {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [indo, setIndo] = useState(false)
  async function enviar(e: FormEvent) {
    e.preventDefault()
    setIndo(true)
    setErro('')
    try {
      entrou((await conta.entrar(usuario, senha)).sessao)
    } catch (falha) {
      setErro((falha as Error).message)
    } finally {
      setIndo(false)
    }
  }
  return (
    <form className="formulario" onSubmit={enviar}>
      <label>Usuário<input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" autoCapitalize="none" required /></label>
      <label>Senha<input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required /></label>
      {erro && <p className="erro">{erro}</p>}
      <button className="botao" disabled={indo}>{indo ? 'Entrando…' : 'Entrar'}</button>
    </form>
  )
}

function Cadastrar({ entrou }: { entrou: () => void }) {
  const { dado: cidades } = useCarregar<Cidade[]>(publico.cidades, 'cidades')
  const [f, setF] = useState<Cadastro>({
    usuario: '', senha: '', cidadeId: '', nome: '', categoria: '', whatsapp: '', endereco: '', descricao: '', aceite: false
  })
  const [erro, setErro] = useState('')
  const [indo, setIndo] = useState(false)
  const campo = (nome: keyof Cadastro) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [nome]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value })

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setIndo(true)
    setErro('')
    try {
      await conta.cadastrar(f)
      entrou()
    } catch (falha) {
      setErro((falha as Error).message)
    } finally {
      setIndo(false)
    }
  }

  return (
    <form className="formulario" onSubmit={enviar}>
      <label>Nome da loja<input value={f.nome} onChange={campo('nome')} maxLength={60} required /></label>
      <label>Cidade
        <select value={f.cidadeId} onChange={campo('cidadeId')} required>
          <option value="" disabled>escolha…</option>
          {cidades?.map((c) => <option key={c.id} value={c.id}>{c.nome} - {c.uf}</option>)}
        </select>
      </label>
      <label>O que a loja vende
        <select value={f.categoria} onChange={campo('categoria')} required>
          <option value="" disabled>escolha…</option>
          {CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>)}
        </select>
      </label>
      <label>WhatsApp da loja<input value={f.whatsapp} onChange={campo('whatsapp')} inputMode="tel" placeholder="(65) 99999-0000" required /></label>
      <label>Endereço<input value={f.endereco} onChange={campo('endereco')} maxLength={160} placeholder="Rua, número, bairro" /></label>
      <label>Sobre a loja<textarea value={f.descricao} onChange={campo('descricao')} maxLength={500} placeholder="Horário, entrega, formas de pagamento…" /></label>
      <label>Usuário para entrar<input value={f.usuario} onChange={campo('usuario')} autoComplete="username" autoCapitalize="none" placeholder="ex.: casadotenis" required /></label>
      <label>Senha (10 caracteres ou mais)<input type="password" value={f.senha} onChange={campo('senha')} autoComplete="new-password" minLength={10} required /></label>
      <label className="marcar">
        <input type="checkbox" checked={f.aceite} onChange={campo('aceite')} />
        <span>Concordo que o WhatsApp e o endereço da loja aparecem para quem vê meus produtos, e que só vendo produtos legais, com preço e foto verdadeiros.</span>
      </label>
      {erro && <p className="erro">{erro}</p>}
      <button className="botao" disabled={indo}>{indo ? 'Criando…' : 'Criar minha loja'}</button>
      <p className="suave pequeno">Sua loja passa por uma conferência rápida antes de aparecer no feed.</p>
    </form>
  )
}

const AVISO_DO_ESTADO: Record<MinhaLoja['estado'], string> = {
  pendente: 'Sua loja está em análise. Pode ir postando: os produtos aparecem no feed assim que ela for aprovada.',
  aprovada: '',
  recusada: 'Sua loja não foi aprovada. Confira nome e WhatsApp em "Dados da loja" e grave de novo para voltar à análise.',
  bloqueada: 'Sua loja foi bloqueada e não aparece no feed. Fale com o suporte.'
}

function Painel({ sessao, saiu }: { sessao: Sessao; saiu: () => void }) {
  const { dado, erro, recarregar } = useCarregar(lojista.minha, `minha|${sessao.usuario}`)
  const [editando, setEditando] = useState<ProdutoDaLoja | 'novo' | 'loja' | null>(null)

  if (erro) return <main className="miolo"><p className="erro">{erro}</p></main>
  if (!dado) return <Carregando />
  const { loja, produtos } = dado
  const fechar = () => { setEditando(null); recarregar() }

  if (editando === 'loja') return <DadosDaLoja loja={loja} fechar={fechar} />
  if (editando) return <EditarProduto produto={editando === 'novo' ? null : editando} categoriaDaLoja={loja.categoria} fechar={fechar} />

  const vistas = produtos.reduce((s, p) => s + p.vistas, 0)
  const cliques = produtos.reduce((s, p) => s + p.cliques, 0)

  return (
    <main className="miolo">
      <div className="linha">
        <h1 style={{ marginRight: 'auto' }}>{loja.nome}</h1>
        <span className={`estado ${loja.estado}`}>{loja.estado}</span>
      </div>
      {AVISO_DO_ESTADO[loja.estado] && <p className="aviso">{AVISO_DO_ESTADO[loja.estado]}</p>}
      <div className="numeros">
        <span>{produtos.length} produtos</span><span>{vistas} vistas</span><span>{cliques} chamadas no WhatsApp</span>
      </div>
      <div className="linha" style={{ margin: '14px 0' }}>
        <button className="botao" onClick={() => setEditando('novo')}>+ Novo produto</button>
        <button className="botao claro" onClick={() => setEditando('loja')}>Dados da loja</button>
        {loja.estado === 'aprovada' && <Link para={`/loja/${loja.id}`} className="botao claro">Ver como cliente</Link>}
        <button className="botao claro pequeno" style={{ marginLeft: 'auto' }} onClick={() => conta.sair().then(saiu)}>Sair</button>
      </div>
      {produtos.length === 0 && <p className="suave">Nenhum produto ainda. Comece pelo que mais vende.</p>}
      <div className="grade">
        {produtos.map((p) => (
          <button key={p.id} className="quadro" style={{ border: 0, padding: 0, cursor: 'pointer' }} onClick={() => setEditando(p)}>
            {p.fotos[0] && <img src={p.fotos[0]} alt={p.titulo} loading="lazy" />}
            {p.removido ? <span className="pausado">removido pela administração</span> : !p.ativo && <span className="pausado">pausado</span>}
            <span className="rotulo" style={{ textAlign: 'left' }}>
              <span className="valor">{emReais(p.preco)}</span><br />
              👁 {p.vistas} · 💬 {p.cliques}
            </span>
          </button>
        ))}
      </div>
    </main>
  )
}

function DadosDaLoja({ loja, fechar }: { loja: MinhaLoja; fechar: () => void }) {
  const [f, setF] = useState({ nome: loja.nome, categoria: loja.categoria, whatsapp: mostrarTelefone(loja.whatsapp), endereco: loja.endereco, descricao: loja.descricao })
  const [erro, setErro] = useState('')
  async function gravar(e: FormEvent) {
    e.preventDefault()
    try {
      await lojista.gravarLoja(f)
      fechar()
    } catch (falha) {
      setErro((falha as Error).message)
    }
  }
  const campo = (nome: keyof typeof f) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [nome]: e.target.value })
  return (
    <main className="miolo">
      <button className="botao claro pequeno" onClick={fechar}>← Voltar</button>
      <h1>Dados da loja</h1>
      <form className="formulario" onSubmit={gravar}>
        <label>Nome da loja<input value={f.nome} onChange={campo('nome')} maxLength={60} required /></label>
        <label>O que a loja vende
          <select value={f.categoria} onChange={campo('categoria')}>
            {CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>)}
          </select>
        </label>
        <label>WhatsApp<input value={f.whatsapp} onChange={campo('whatsapp')} inputMode="tel" required /></label>
        <label>Endereço<input value={f.endereco} onChange={campo('endereco')} maxLength={160} /></label>
        <label>Sobre a loja<textarea value={f.descricao} onChange={campo('descricao')} maxLength={500} /></label>
        {loja.estado === 'aprovada' && <p className="aviso pequeno">Trocar o nome ou o WhatsApp manda a loja de novo para análise.</p>}
        {erro && <p className="erro">{erro}</p>}
        <button className="botao">Gravar</button>
      </form>
    </main>
  )
}

function emTexto(centavos: number | null): string {
  return centavos === null ? '' : (centavos / 100).toFixed(2).replace('.', ',')
}

function EditarProduto({ produto, categoriaDaLoja, fechar }: { produto: ProdutoDaLoja | null; categoriaDaLoja: string; fechar: () => void }) {
  const [f, setF] = useState<ProdutoParaGravar>(produto
    ? { titulo: produto.titulo, descricao: produto.descricao, categoria: produto.categoria, preco: emTexto(produto.preco), precoDe: emTexto(produto.precoDe), fotos: produto.fotos }
    : { titulo: '', descricao: '', categoria: categoriaDaLoja, preco: '', precoDe: '', fotos: [] })
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState('')

  async function adicionarFotos(e: ChangeEvent<HTMLInputElement>) {
    const arquivos = [...(e.target.files ?? [])].slice(0, 5 - f.fotos.length)
    e.target.value = ''
    setErro('')
    for (const [i, arquivo] of arquivos.entries()) {
      setEnviando(`Enviando foto ${i + 1} de ${arquivos.length}…`)
      try {
        const { url } = await lojista.enviarFoto(await prepararFoto(arquivo))
        // Sobre o estado atual, não sobre o do começo: tirar uma foto durante o envio não volta.
        setF((atual) => ({ ...atual, fotos: [...atual.fotos, url].slice(0, 5) }))
      } catch (falha) {
        setErro((falha as Error).message)
        break
      }
    }
    setEnviando('')
  }

  async function gravar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    try {
      if (produto) await lojista.gravarProduto(produto.id, f)
      else await lojista.novoProduto(f)
      fechar()
    } catch (falha) {
      setErro((falha as Error).message)
    }
  }

  async function acao(fazer: () => Promise<void>) {
    try {
      await fazer()
      fechar()
    } catch (falha) {
      setErro((falha as Error).message)
    }
  }

  const campo = (nome: keyof ProdutoParaGravar) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [nome]: e.target.value })

  return (
    <main className="miolo">
      <button className="botao claro pequeno" onClick={fechar}>← Voltar</button>
      <h1>{produto ? 'Editar produto' : 'Novo produto'}</h1>
      <form className="formulario" onSubmit={gravar}>
        <div>
          <div className="pequeno suave" style={{ marginBottom: 6 }}>Fotos (até 5; a primeira é a capa)</div>
          <div className="miniaturas">
            {f.fotos.map((url, i) => (
              <div className="miniatura" key={url}>
                <img src={url} alt={`Foto ${i + 1}`} />
                <button type="button" aria-label={`Tirar foto ${i + 1}`} disabled={Boolean(enviando)}
                  onClick={() => setF((atual) => ({ ...atual, fotos: atual.fotos.filter((x) => x !== url) }))}>×</button>
              </div>
            ))}
            {f.fotos.length < 5 && (
              <label className="miniatura nova" aria-label="Adicionar fotos">
                {enviando ? '…' : '+'}
                <input type="file" accept="image/*" multiple hidden onChange={adicionarFotos} disabled={Boolean(enviando)} />
              </label>
            )}
          </div>
          {enviando && <p className="suave pequeno">{enviando}</p>}
        </div>
        <label>Título<input value={f.titulo} onChange={campo('titulo')} maxLength={80} placeholder="ex.: Tênis Nike Revolution 7, n° 38 a 43" required /></label>
        <div className="linha" style={{ flexWrap: 'nowrap' }}>
          <label style={{ flex: 1 }}>Preço (R$)<input value={f.preco} onChange={campo('preco')} inputMode="decimal" placeholder="349,90" required /></label>
          <label style={{ flex: 1 }}>Preço "de" (opcional)<input value={f.precoDe} onChange={campo('precoDe')} inputMode="decimal" placeholder="399,90" /></label>
        </div>
        <label>Categoria
          <select value={f.categoria} onChange={campo('categoria')}>
            {CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>)}
          </select>
        </label>
        <label>Descrição<textarea value={f.descricao} onChange={campo('descricao')} maxLength={1000} placeholder="Tamanhos, cores, estado, como entrega…" /></label>
        {erro && <p className="erro">{erro}</p>}
        <button className="botao" disabled={Boolean(enviando)}>{produto ? 'Gravar' : 'Publicar'}</button>
        {produto?.removido && <p className="aviso">Este produto foi removido pela administração depois de uma denúncia e não volta ao feed.</p>}
        {produto && !produto.removido && (
          <div className="linha">
            <button type="button" className="botao claro pequeno" onClick={() => acao(() => lojista.ativo(produto.id, !produto.ativo))}>
              {produto.ativo ? 'Pausar (acabou o estoque)' : 'Voltar a mostrar'}
            </button>
            <button type="button" className="botao claro pequeno" onClick={() => {
              if (window.confirm('Apagar este produto?')) void acao(() => lojista.apagar(produto.id))
            }}>Apagar</button>
          </div>
        )}
      </form>
    </main>
  )
}
