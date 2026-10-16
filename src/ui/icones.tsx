/**
 * Ícones desenhados aqui, todos no mesmo traço. Símbolo de texto (♥ ➦ ⚑)
 * vira emoji colorido em alguns celulares e cada aparelho desenha de um jeito.
 */

type Props = { tamanho?: number; cheio?: boolean }

function Svg({ tamanho = 24, children, cheio = false }: Props & { children: React.ReactNode }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" aria-hidden="true" fill={cheio ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
  )
}

export const IconeCoracao = (p: Props) => <Svg {...p}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></Svg>
export const IconeEnviar = (p: Props) => <Svg {...p}><path d="M14 5l7 7-7 7M21 12H10a7 7 0 0 0-7 7" /></Svg>
export const IconeBandeira = (p: Props) => <Svg {...p}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></Svg>
export const IconeMais = (p: Props) => <Svg {...p}><path d="M12 6v12M6 12h12" /></Svg>
export const IconeCerto = (p: Props) => <Svg {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>
export const IconeFechar = (p: Props) => <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>
export const IconeRelogio = (p: Props) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Svg>

/** A sacolinha da logo, com o deslocamento vermelho e amarelo do ícone do app. */
export function Sacola({ tamanho = 22 }: { tamanho?: number }) {
  const d = 'M6 8h12l-1 12H7zM9 8V7a3 3 0 0 1 6 0v1'
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" aria-hidden="true" fill="none" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
      <path d={d} stroke="#fe2c55" transform="translate(-1 0)" />
      <path d={d} stroke="#ffd400" transform="translate(1 0)" />
      <path d={d} stroke="#fff" />
    </svg>
  )
}
