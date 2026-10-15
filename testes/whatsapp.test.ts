import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { assinaturaValida, mensagensRecebidas } from '../api/_whatsapp'

const SEGREDO = 'segredo-do-app'

function assinar(corpo: string, segredo = SEGREDO): string {
  return 'sha256=' + createHmac('sha256', segredo).update(corpo).digest('hex')
}

describe('assinaturaValida', () => {
  const corpo = Buffer.from('{"object":"whatsapp_business_account"}')

  it('aceita o corpo assinado com o segredo do app', () => {
    expect(assinaturaValida(corpo, assinar(corpo.toString()), SEGREDO)).toBe(true)
  })

  it('recusa assinatura de outro segredo, corpo mexido ou cabeçalho ausente', () => {
    expect(assinaturaValida(corpo, assinar(corpo.toString(), 'outro'), SEGREDO)).toBe(false)
    expect(assinaturaValida(Buffer.from('{}'), assinar(corpo.toString()), SEGREDO)).toBe(false)
    expect(assinaturaValida(corpo, undefined, SEGREDO)).toBe(false)
    expect(assinaturaValida(corpo, 'sha256=curta', SEGREDO)).toBe(false)
  })

  it('sem segredo configurado, recusa tudo', () => {
    expect(assinaturaValida(corpo, assinar(corpo.toString(), ''), '')).toBe(false)
  })
})

describe('mensagensRecebidas', () => {
  it('tira número e texto do aviso da Meta', () => {
    const aviso = {
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          field: 'messages',
          value: {
            messages: [
              { from: '5565999990000', id: 'wamid.1', type: 'text', text: { body: 'arroz' } },
              { from: '5565988880000', id: 'wamid.2', type: 'image', image: { id: 'x' } }
            ]
          }
        }]
      }]
    }
    expect(mensagensRecebidas(aviso)).toEqual([
      { de: '5565999990000', id: 'wamid.1', texto: 'arroz' },
      { de: '5565988880000', id: 'wamid.2', texto: '' }
    ])
  })

  it('aviso de entrega (status) não é mensagem', () => {
    const aviso = { entry: [{ changes: [{ value: { statuses: [{ id: 'wamid.1', status: 'read' }] } }] }] }
    expect(mensagensRecebidas(aviso)).toEqual([])
  })

  it('lixo não quebra', () => {
    expect(mensagensRecebidas(null)).toEqual([])
    expect(mensagensRecebidas({ entry: 'x' })).toEqual([])
    expect(mensagensRecebidas({ entry: [{ changes: [{ value: { messages: [{ from: 123 }] } }] }] })).toEqual([])
  })

  it('usa o texto do botão quando a pessoa toca numa resposta pronta', () => {
    const aviso = { entry: [{ changes: [{ value: { messages: [
      { from: '5565', id: 'w', type: 'button', button: { text: 'PANFLETOS' } }
    ] } }] }] }
    expect(mensagensRecebidas(aviso)[0]?.texto).toBe('PANFLETOS')
  })
})
