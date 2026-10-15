/**
 * Validade do panfleto pelo calendário de Cuiabá. O servidor da Vercel roda
 * em UTC: sem isto, das 20h à meia-noite o panfleto de hoje já sairia do ar.
 */

export const FUSO = 'America/Cuiaba'

/** Data AAAA-MM-DD de agora em Cuiabá. */
export function hojeEmCuiaba(agora: Date = new Date()): string {
  // en-CA formata como AAAA-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(agora)
}

/** Vale do primeiro ao último dia, os dois inclusive. Datas AAAA-MM-DD comparam como texto. */
export function estaValido(panfleto: { validoDe: string; validoAte: string }, hoje: string): boolean {
  return panfleto.validoDe <= hoje && hoje <= panfleto.validoAte
}

/** AAAA-MM-DD que existe no calendário (30 de fevereiro não passa). */
export function dataValida(texto: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false
  const data = new Date(`${texto}T00:00:00Z`)
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === texto
}
