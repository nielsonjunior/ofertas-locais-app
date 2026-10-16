import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './estilo.css'
import { Admin } from './ui/Admin'
import { Feed } from './ui/Feed'
import { EscolherCidade, PaginaDaBusca, PaginaDaLoja, PaginaDoProduto, PaginaDosSalvos } from './ui/Paginas'
import { Vender } from './ui/Vender'
import { Link, cidadeLembrada, ir, useEndereco } from './ui/rota'

/** Ícones de traço branco, como os da barra do TikTok. */
function Icone({ d }: { d: string }) {
  return (
    <svg className="icone" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
  )
}

function Barra({ caminho, cidade }: { caminho: string; cidade: string }) {
  const atual = (prefixo: string) => (caminho === prefixo || caminho.startsWith(`${prefixo}/`) ? 'page' : undefined)
  return (
    <nav className="barra" aria-label="Principal">
      <Link para={cidade ? `/c/${cidade}` : '/'} aria-current={caminho.startsWith('/c/') ? 'page' : undefined}><Icone d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />Início</Link>
      <Link para={`/busca${cidade ? `?cidade=${cidade}` : ''}`} aria-current={atual('/busca')}><Icone d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15zM16 16l5 5" />Buscar</Link>
      <Link para="/vender" aria-current={atual('/vender')}><span className="mais-vender" aria-hidden="true">+</span>Vender</Link>
      <Link para="/salvos" aria-current={atual('/salvos')}><Icone d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />Salvos</Link>
    </nav>
  )
}

function App() {
  const url = useEndereco()
  const caminho = url.pathname
  const parte = (prefixo: string) => (caminho.startsWith(prefixo) ? decodeURIComponent(caminho.slice(prefixo.length)) : '')
  const cidade = parte('/c/') || url.searchParams.get('cidade') || cidadeLembrada()

  // Com cidade lembrada, "/" vai direto ao feed. replace, não push: senão o
  // Voltar cai em "/" e é mandado de volta para o feed.
  const vaiParaOFeed = caminho === '/' && cidadeLembrada() && !url.searchParams.has('trocar')
  useEffect(() => { if (vaiParaOFeed) ir(`/c/${cidadeLembrada()}`, true) }, [vaiParaOFeed])

  let pagina
  if (caminho === '/') pagina = vaiParaOFeed ? null : <EscolherCidade />
  else if (caminho.startsWith('/c/')) pagina = <Feed key={cidade} cidadeId={cidade} />
  else if (caminho.startsWith('/p/')) pagina = <PaginaDoProduto key={caminho} id={parte('/p/')} />
  else if (caminho.startsWith('/loja/')) pagina = <PaginaDaLoja key={caminho} id={parte('/loja/')} />
  else if (caminho === '/busca') pagina = <PaginaDaBusca cidadeId={url.searchParams.get('cidade') ?? ''} consulta={url.searchParams.get('q') ?? ''} />
  else if (caminho === '/salvos') pagina = <PaginaDosSalvos />
  else if (caminho === '/vender') pagina = <Vender />
  else if (caminho === '/admin') pagina = <Admin />
  else pagina = <main className="miolo"><h1>Página não encontrada</h1><Link para="/">Início</Link></main>

  return (
    <>
      {pagina}
      <Barra caminho={caminho} cidade={cidade} />
    </>
  )
}

createRoot(document.getElementById('raiz')!).render(<StrictMode><App /></StrictMode>)
