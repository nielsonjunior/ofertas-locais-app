import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './estilo.css'
import { EscolherCidade, PaginaDaBusca, PaginaDaCidade, PaginaDoPanfleto } from './ui/Consumidor'
import { Equipe } from './ui/equipe/Equipe'
import { Link, cidadeLembrada, ir, useEndereco } from './ui/rota'

function App() {
  const url = useEndereco()
  const caminho = url.pathname
  const cidade = /^\/c\/([\w-]+)$/.exec(caminho)?.[1] ?? url.searchParams.get('cidade') ?? ''

  let pagina
  if (caminho === '/') {
    const lembrada = cidadeLembrada()
    if (lembrada && !url.searchParams.has('trocar')) {
      queueMicrotask(() => ir(`/c/${lembrada}`))
      pagina = null
    } else {
      pagina = <EscolherCidade />
    }
  } else if (caminho.startsWith('/c/')) pagina = <PaginaDaCidade cidadeId={cidade} />
  else if (caminho === '/busca') pagina = <PaginaDaBusca cidadeId={cidade} consulta={url.searchParams.get('q') ?? ''} />
  else if (caminho.startsWith('/panfleto/')) pagina = <PaginaDoPanfleto id={caminho.slice('/panfleto/'.length)} />
  else if (caminho.startsWith('/equipe')) pagina = <Equipe caminho={caminho} />
  else pagina = <main className="miolo"><h1>Página não encontrada</h1><Link para="/">Início</Link></main>

  return (
    <>
      <header className="topo">
        <Link para={cidade ? `/c/${cidade}` : '/'}>Ofertas Locais</Link>
        {!caminho.startsWith('/equipe') && <Link para="/?trocar" className="cidade">trocar cidade</Link>}
      </header>
      {pagina}
    </>
  )
}

createRoot(document.getElementById('raiz')!).render(<StrictMode><App /></StrictMode>)
