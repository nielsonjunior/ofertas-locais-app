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

/** Plural simples do português: bananas → banana, pães → pae, limões → limoe. Basta para casar. */
function raiz(palavra: string): string {
  if (/^\d+$/.test(palavra) || palavra.length <= 3) return palavra
  return palavra.replace(/(oes|aes|es|s)$/, '')
}

function palavras(texto: string): string[] {
  return normalizar(texto).split(' ').filter(Boolean).map(raiz)
}

function casa(oferta: OfertaNaVitrine, termos: string[]): boolean {
  const texto = palavras(`${oferta.produto} ${oferta.marca} ${oferta.quantidade}`)
  return termos.every((termo) => texto.some((p) => p === termo || (termo.length >= 3 && p.startsWith(termo))))
}

/** Chave de ordem: quem tem preço por unidade vem antes, e o mais barato primeiro. */
function chave(oferta: OfertaNaVitrine): [number, number] {
  const porUnidade = precoPorUnidade(oferta.preco, lerQuantidade(oferta.quantidade))
  return porUnidade ? [0, porUnidade.centavos] : [1, oferta.preco]
}

export function buscar(ofertas: OfertaNaVitrine[], consulta: string): OfertaNaVitrine[] {
  const termos = palavras(consulta)
  if (termos.length === 0) return []
  return ofertas
    .filter((o) => casa(o, termos))
    .map((o) => ({ o, k: chave(o) }))
    .sort((a, b) => a.k[0] - b.k[0] || a.k[1] - b.k[1] || a.o.preco - b.o.preco)
    .map(({ o }) => o)
}
