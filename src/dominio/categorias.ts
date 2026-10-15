/** As categorias do feed. O id vai no banco; trocar o nome não mexe em nada. */
export const CATEGORIAS = [
  { id: 'mercado', nome: 'Mercado', icone: '🛒' },
  { id: 'lanches', nome: 'Padaria e lanches', icone: '🥐' },
  { id: 'roupas', nome: 'Roupas e calçados', icone: '👟' },
  { id: 'eletronicos', nome: 'Celulares e eletrônicos', icone: '📱' },
  { id: 'casa', nome: 'Casa e construção', icone: '🏠' },
  { id: 'beleza', nome: 'Beleza', icone: '💄' },
  { id: 'pet', nome: 'Pet', icone: '🐶' },
  { id: 'farmacia', nome: 'Farmácia', icone: '💊' },
  { id: 'esporte', nome: 'Esporte', icone: '⚽' },
  { id: 'outros', nome: 'Outros', icone: '🛍️' }
] as const

export type IdDaCategoria = (typeof CATEGORIAS)[number]['id']

export function categoriaValida(id: unknown): id is IdDaCategoria {
  return CATEGORIAS.some((c) => c.id === id)
}

export function nomeDaCategoria(id: string): string {
  return CATEGORIAS.find((c) => c.id === id)?.nome ?? 'Outros'
}
