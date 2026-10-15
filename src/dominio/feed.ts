/**
 * A ordem do feed: mais novos primeiro, mas sem dois seguidos da mesma loja
 * enquanto houver outra para intercalar. Sem isto, a loja que posta 30
 * produtos de uma vez toma a tela de todo mundo.
 */
export function ordenarFeed<T extends { lojaId: string; criadoEm: string }>(produtos: T[]): T[] {
  const restantes = [...produtos].sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : a.criadoEm > b.criadoEm ? -1 : 0))
  const saida: T[] = []
  let ultimaLoja = ''
  while (restantes.length > 0) {
    const i = restantes.findIndex((p) => p.lojaId !== ultimaLoja)
    const [escolhido] = restantes.splice(i === -1 ? 0 : i, 1)
    saida.push(escolhido!)
    ultimaLoja = escolhido!.lojaId
  }
  return saida
}
