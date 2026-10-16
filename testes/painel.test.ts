import { describe, expect, it } from 'vitest'
import { NOME_DO_ESTADO, PRODUTOS_PARA_COMECAR, primeirosPassos } from '../src/dominio/painel'

describe('primeirosPassos do lojista', () => {
  it('loja nova: nada feito, e diz quantos produtos faltam', () => {
    const passos = primeirosPassos(0, 'pendente')
    expect(passos.map((p) => p.feito)).toEqual([false, false, false])
    expect(passos[0]!.texto).toBe(`Poste ${PRODUTOS_PARA_COMECAR} produtos (0 de ${PRODUTOS_PARA_COMECAR})`)
  })

  it('compartilhar só fica liberado com a loja no ar', () => {
    expect(primeirosPassos(5, 'pendente').find((p) => p.id === 'compartilhar')!.liberado).toBe(false)
    expect(primeirosPassos(5, 'aprovada').find((p) => p.id === 'compartilhar')!.liberado).toBe(true)
  })

  it('com produtos e loja aprovada, os dois primeiros estão feitos', () => {
    expect(primeirosPassos(3, 'aprovada').slice(0, 2).every((p) => p.feito)).toBe(true)
  })

  it('cada estado tem um nome para a tela', () => {
    expect(NOME_DO_ESTADO).toEqual({ pendente: 'Em análise', aprovada: 'No ar', recusada: 'Recusada', bloqueada: 'Bloqueada' })
  })
})
