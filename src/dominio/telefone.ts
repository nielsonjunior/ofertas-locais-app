import { emReais } from './dinheiro.js'

/**
 * O WhatsApp da loja: guardado só com dígitos e DDD (65999990000), porque é
 * assim que o wa.me espera, e mostrado com máscara para ler.
 */

/** "(65) 99999-0000", "+55 65 99999 0000" → "65999990000"; null se não for telefone brasileiro. */
export function normalizarWhatsapp(digitado: string): string | null {
  let digitos = String(digitado ?? '').replace(/\D/g, '')
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) digitos = digitos.slice(2)
  if (digitos.length !== 10 && digitos.length !== 11) return null
  // DDD vai de 11 a 99, sem zero.
  if (!/^[1-9][1-9]/.test(digitos)) return null
  // Celular com 9 dígitos começa com 9.
  if (digitos.length === 11 && digitos[2] !== '9') return null
  return digitos
}

/** "65999990000" → "(65) 99999-0000" */
export function mostrarTelefone(digitos: string): string {
  const ddd = digitos.slice(0, 2)
  const resto = digitos.slice(2)
  const corte = resto.length - 4
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`
}

/** O link que abre a conversa com a loja, com a mensagem pronta. */
export function linkDoWhatsapp(whatsapp: string, produto: { titulo: string; preco: number; url: string }): string {
  const mensagem = `Olá! Vi no Tik Shop: *${produto.titulo}* — ${emReais(produto.preco)}.\n${produto.url}\nAinda tem?`
  return `https://wa.me/55${whatsapp}?text=${encodeURIComponent(mensagem)}`
}
