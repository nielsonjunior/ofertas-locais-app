import type { EstadoDaLoja } from './tipos'

/**
 * O caminho de quem acabou de criar a loja. Loja vazia no feed não vende, e
 * o lojista novo não sabe o que fazer depois do cadastro: a lista diz.
 */

export const PRODUTOS_PARA_COMECAR = 3

export const NOME_DO_ESTADO: Record<EstadoDaLoja, string> = {
  pendente: 'Em análise',
  aprovada: 'No ar',
  recusada: 'Recusada',
  bloqueada: 'Bloqueada'
}

export interface Passo {
  id: 'postar' | 'aprovar' | 'compartilhar'
  texto: string
  feito: boolean
  liberado: boolean
}

export function primeirosPassos(produtos: number, estado: EstadoDaLoja): Passo[] {
  const postados = Math.min(produtos, PRODUTOS_PARA_COMECAR)
  return [
    { id: 'postar', texto: `Poste ${PRODUTOS_PARA_COMECAR} produtos (${postados} de ${PRODUTOS_PARA_COMECAR})`, feito: produtos >= PRODUTOS_PARA_COMECAR, liberado: true },
    { id: 'aprovar', texto: estado === 'aprovada' ? 'Loja aprovada' : 'Aguarde a aprovação da loja', feito: estado === 'aprovada', liberado: true },
    // Só faz sentido mandar o link quando a loja aparece para quem abrir.
    { id: 'compartilhar', texto: 'Mande o link da loja para seus clientes', feito: false, liberado: estado === 'aprovada' }
  ]
}
