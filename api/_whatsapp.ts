import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * WhatsApp Business Cloud API (oficial, da Meta). Roda só no servidor — o
 * nome começa com "_" para a Vercel não fazer disto um endereço.
 *
 * Só respondemos a quem escreveu (mensagem de serviço, dentro de 24 h, sem
 * custo). Mandar oferta sem a pessoa ter escrito é marketing, cobrado, e não
 * existe na fase 1.
 */

const VERSAO_DA_API = process.env.WHATSAPP_VERSAO_API ?? 'v23.0'

/**
 * A Meta assina o corpo com HMAC-SHA256 usando o segredo do app e manda em
 * X-Hub-Signature-256. Sem conferir, qualquer um que descubra o endereço
 * manda "mensagens" em nome de qualquer número.
 */
export function assinaturaValida(corpo: Buffer, cabecalho: string | undefined, segredo: string): boolean {
  if (!segredo || !cabecalho?.startsWith('sha256=')) return false
  const recebida = Buffer.from(cabecalho.slice('sha256='.length), 'hex')
  const esperada = createHmac('sha256', segredo).update(corpo).digest()
  // Tamanho diferente: timingSafeEqual lança erro; e já sabemos que não bate.
  if (recebida.length !== esperada.length) return false
  return timingSafeEqual(recebida, esperada)
}

export interface Recebida {
  de: string
  id: string
  /** Vazio quando a mensagem não é texto (foto, áudio, figurinha). */
  texto: string
}

function objeto(valor: unknown): Record<string, unknown> | null {
  return typeof valor === 'object' && valor !== null ? (valor as Record<string, unknown>) : null
}

function lista(valor: unknown): unknown[] {
  return Array.isArray(valor) ? valor : []
}

/** As mensagens de pessoas dentro do aviso da Meta. Avisos de entrega e leitura ficam de fora. */
export function mensagensRecebidas(aviso: unknown): Recebida[] {
  const saida: Recebida[] = []
  for (const entrada of lista(objeto(aviso)?.entry)) {
    for (const mudanca of lista(objeto(entrada)?.changes)) {
      for (const bruta of lista(objeto(objeto(mudanca)?.value)?.messages)) {
        const m = objeto(bruta)
        if (!m || typeof m.from !== 'string' || typeof m.id !== 'string') continue
        let texto = ''
        if (m.type === 'text') texto = String(objeto(m.text)?.body ?? '')
        else if (m.type === 'button') texto = String(objeto(m.button)?.text ?? '')
        else if (m.type === 'interactive') {
          const i = objeto(m.interactive)
          texto = String(objeto(i?.button_reply)?.title ?? objeto(i?.list_reply)?.title ?? '')
        }
        saida.push({ de: m.from, id: m.id, texto })
      }
    }
  }
  return saida
}

/** Envia uma resposta de texto. Lança erro se a Meta recusar, para aparecer no log. */
export async function enviarTexto(para: string, texto: string): Promise<void> {
  const token = process.env.WHATSAPP_TOKEN
  const numeroId = process.env.WHATSAPP_NUMERO_ID
  if (!token || !numeroId) throw new Error('WhatsApp não configurado (WHATSAPP_TOKEN, WHATSAPP_NUMERO_ID)')

  const resposta = await fetch(`https://graph.facebook.com/${VERSAO_DA_API}/${encodeURIComponent(numeroId)}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: para,
      type: 'text',
      text: { body: texto.slice(0, 4096), preview_url: true }
    })
  })
  if (!resposta.ok) {
    // Só o código do erro: o corpo da Meta pode trazer o número da pessoa.
    const corpo = await resposta.json().catch(() => ({})) as { error?: { code?: unknown } }
    throw new Error(`WhatsApp recusou o envio: ${resposta.status} código ${String(corpo.error?.code ?? '?')}`)
  }
}
