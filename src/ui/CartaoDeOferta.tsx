import { emReais } from '../dominio/dinheiro'
import type { OfertaNaVitrine } from '../dominio/tipos'
import { lerQuantidade, precoPorUnidade } from '../dominio/unidade'

export function CartaoDeOferta({ oferta, mostrarMercado = true, selo = '' }: {
  oferta: OfertaNaVitrine
  mostrarMercado?: boolean
  /** "mais barato por kg" na primeira da busca; vazio nas outras. */
  selo?: string
}) {
  const porUnidade = precoPorUnidade(oferta.preco, lerQuantidade(oferta.quantidade))
  const desconto = oferta.precoDe ? Math.round((1 - oferta.preco / oferta.precoDe) * 100) : 0

  return (
    <div className="cartao oferta">
      {selo && <span className="selo melhor">{selo}</span>}
      {!selo && desconto >= 10 && <span className="selo">-{desconto}%</span>}
      <span className="nome">{[oferta.produto, oferta.marca].filter(Boolean).join(' ')}</span>
      {oferta.quantidade && <span className="suave pequeno">{oferta.quantidade}</span>}
      {oferta.precoDe && <span className="preco-de">{emReais(oferta.precoDe)}</span>}
      <span className="preco">{emReais(oferta.preco)}</span>
      {porUnidade && porUnidade.por !== 'un' && porUnidade.centavos !== oferta.preco && (
        <span className="por-unidade">{emReais(porUnidade.centavos)} por {porUnidade.por}</span>
      )}
      {oferta.condicao && <span className="condicao">{oferta.condicao}</span>}
      {mostrarMercado && <span className="mercado pequeno">{oferta.mercadoNome}</span>}
    </div>
  )
}
