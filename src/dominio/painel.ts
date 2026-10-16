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

// Recusada não está na fila: esperar não adianta, o lojista precisa corrigir.
const TEXTO_DA_APROVACAO: Record<EstadoDaLoja, string> = {
  pendente: 'Aguarde a aprovação da loja',
  aprovada: 'Loja aprovada',
  recusada: 'Corrija os dados da loja e grave de novo',
  bloqueada: 'Loja bloqueada'
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
    { id: 'aprovar', texto: TEXTO_DA_APROVACAO[estado], feito: estado === 'aprovada', liberado: true },
    // Só faz sentido mandar o link quando a loja aparece para quem abrir.
    { id: 'compartilhar', texto: 'Mande o link da loja para seus clientes', feito: false, liberado: estado === 'aprovada' }
  ]
}
