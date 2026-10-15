/**
 * A busca roda sobre os produtos de uma cidade — centenas, não milhões —
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
 * limões → limao; tênis e camisetas perdem o "s". Não é gramática, é só o
 * bastante para casar.
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

function casaTodos(texto: string[], termos: string[]): boolean {
  return termos.every((termo) => texto.some((p) => p === termo || (termo.length >= 3 && p.startsWith(termo))))
}

interface Buscavel {
  titulo: string
  descricao: string
  lojaNome: string
}

/** Os que casam: primeiro os que casam só pelo título; depois pela descrição e pela loja. A ordem de chegada se mantém. */
export function buscar<T extends Buscavel>(produtos: T[], consulta: string): T[] {
  const termos = palavras(consulta, true)
  if (termos.length === 0) return []
  const peloTitulo: T[] = []
  const peloResto: T[] = []
  for (const p of produtos) {
    if (casaTodos(palavras(p.titulo), termos)) peloTitulo.push(p)
    else if (casaTodos(palavras(`${p.titulo} ${p.descricao} ${p.lojaNome}`), termos)) peloResto.push(p)
  }
  return [...peloTitulo, ...peloResto]
}
