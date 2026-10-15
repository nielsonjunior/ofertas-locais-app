import { describe, expect, it } from 'vitest'
import { LeituraRecusada, lerPagina } from '../api/_ia'
import type { ClienteDaIa } from '../api/_ia'

function clienteFalso(resposta: Record<string, unknown>, guardar?: (p: unknown) => void): ClienteDaIa {
  return {
    beta: {
      messages: {
        parse: (async (params: unknown) => {
          guardar?.(params)
          return { model: 'claude-opus-5-5', usage: {}, ...resposta }
        }) as unknown as ClienteDaIa['beta']['messages']['parse']
      }
    }
  }
}

const leitura = { validoDe: null, validoAte: null, ofertas: [] }

describe('lerPagina', () => {
  it('manda imagem como imagem e PDF como documento', async () => {
    let pedido: any
    await lerPagina(Buffer.from('x'), 'image/png', '2026-10-15',
      clienteFalso({ stop_reason: 'end_turn', parsed_output: leitura }, (p) => { pedido = p }))
    expect(pedido.messages[0].content[0]).toMatchObject({ type: 'image', source: { media_type: 'image/png' } })
    expect(pedido.model).toBe('claude-opus-5-5')
    expect(pedido.fallbacks).toBe('default')

    await lerPagina(Buffer.from('x'), 'application/pdf', '2026-10-15',
      clienteFalso({ stop_reason: 'end_turn', parsed_output: leitura }, (p) => { pedido = p }))
    expect(pedido.messages[0].content[0]).toMatchObject({ type: 'document' })
  })

  it('devolve a leitura', async () => {
    const r = await lerPagina(Buffer.from('x'), 'image/jpeg', '2026-10-15',
      clienteFalso({ stop_reason: 'end_turn', parsed_output: leitura }))
    expect(r).toEqual(leitura)
  })

  it('recusa, corte e formato errado viram LeituraRecusada', async () => {
    for (const resposta of [
      { stop_reason: 'refusal', parsed_output: null },
      { stop_reason: 'max_tokens', parsed_output: null },
      { stop_reason: 'end_turn', parsed_output: null }
    ]) {
      await expect(lerPagina(Buffer.from('x'), 'image/jpeg', '2026-10-15', clienteFalso(resposta)))
        .rejects.toBeInstanceOf(LeituraRecusada)
    }
  })
})
