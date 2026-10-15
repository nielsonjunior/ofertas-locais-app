import type { OfertaNaVitrine } from './tipos.js'
import { lerQuantidade, precoPorUnidade } from './unidade.js'

/**
 * A busca roda sobre as ofertas válidas de uma cidade — centenas, não milhões —
 * então cabe em memória, sem motor de busca. Todas as palavras precisam
 * aparecer; acento, maiúscula e plural simples não atrapalham.
 */

/** "Feijão  CARIOCA, Tipo-1" → "feijao carioca tipo 1"; "5kg" → "5 kg". */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/(\d)([a-z])/g, '$1 $2')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * A mesma raiz para singular e plural, aplicada dos dois lados: limão e
 * limões → limao; tomate e tomates → tomat; pão e pães → pao. Não é
 * gramática, é só o bastante para casar.
 */
function raiz(palavra: string): string {
  if (/^\d+$/.test(palavra) || palavra.length <= 3) return palavra
  let r = palavra.replace(/(oes|aes)$/, 'ao')
  if (r.length > 3) r = r.replace(/s$/, '')
  if (r.length > 3) r = r.replace(/e$/, '')
  return r
}

/** Palavras que não ajudam a achar: "óleo de soja" acha "Óleo Soja". */
const VAZIAS = new Set(['de', 'do', 'da', 'dos', 'das', 'com', 'e', 'para', 'em'])

function palavras(texto: string, tirarVazias = false): string[] {
  return normalizar(texto).split(' ').filter((p) => p && !(tirarVazias && VAZIAS.has(p))).map(raiz)
}

function casa(oferta: OfertaNaVitrine, termos: string[]): boolean {
  const texto = palavras(`${oferta.produto} ${oferta.marca} ${oferta.quantidade}`)
  return termos.every((termo) => texto.some((p) => p === termo || (termo.length >= 3 && p.startsWith(termo))))
}

function porUnidade(o: OfertaNaVitrine) {
  return precoPorUnidade(o.preco, lerQuantidade(o.quantidade))
}

/**
 * Se todas as ofertas achadas têm preço por kg (ou todas por L, ou todas por
 * unidade), devolve essa unidade; senão null. Só assim "mais barato" é verdade.
 */
export function comparacao(ofertas: OfertaNaVitrine[]): 'kg' | 'L' | 'un' | null {
  const unidades = new Set(ofertas.map((o) => porUnidade(o)?.por ?? null))
  const [unica] = [...unidades]
  return unidades.size === 1 && unica ? unica : null
}

/** As ofertas que casam, mais barata primeiro: por kg/L quando dá para comparar, senão pelo preço. */
export function buscar(ofertas: OfertaNaVitrine[], consulta: string): OfertaNaVitrine[] {
  const termos = palavras(consulta, true)
  if (termos.length === 0) return []
  const achadas = ofertas.filter((o) => casa(o, termos))
  const porKg = comparacao(achadas) !== null
  const valor = (o: OfertaNaVitrine) => (porKg ? porUnidade(o)!.centavos : o.preco)
  return achadas.sort((a, b) => valor(a) - valor(b) || a.preco - b.preco)
}
