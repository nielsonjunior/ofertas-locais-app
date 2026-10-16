/**
 * As variáveis que a Vercel põe no projeto. Ao conectar o banco ou o Blob,
 * o painel deixa escolher um prefixo, e aí DATABASE_URL vira, por exemplo,
 * STORAGE_DATABASE_URL. Em vez de exigir o nome exato, procuramos pelo fim
 * do nome e pelo formato do valor.
 */

type Ambiente = Record<string, string | undefined>

function primeiro(ambiente: Ambiente, terminacoes: string[], aceita: (v: string) => boolean): string {
  for (const fim of terminacoes) {
    if (aceita(ambiente[fim] ?? '')) return ambiente[fim]!
    for (const [nome, valor] of Object.entries(ambiente)) {
      if (nome.endsWith(`_${fim}`) && aceita(valor ?? '')) return valor!
    }
  }
  return ''
}

/** O endereço do Postgres. Prefere o do pooler (sem _UNPOOLED); vazio se não houver. */
export function urlDoBanco(ambiente: Ambiente = process.env): string {
  return primeiro(ambiente, ['DATABASE_URL', 'POSTGRES_URL'], (v) => /^postgres(ql)?:\/\//.test(v))
}

/**
 * O token de escrita do Vercel Blob; vazio se não houver. Prefere o que tem
 * o formato conhecido (vercel_blob_rw_…), mas aceita qualquer valor nesses
 * nomes: se a Vercel mudar o formato, o site não pode achar que não há Blob.
 */
export function tokenDoBlob(ambiente: Ambiente = process.env): string {
  const nomes = ['BLOB_READ_WRITE_TOKEN', 'READ_WRITE_TOKEN']
  return primeiro(ambiente, nomes, (v) => v.startsWith('vercel_blob_rw_')) || primeiro(ambiente, nomes, (v) => v.trim().length > 0)
}

/** Situação do ADMIN_INICIAL, sem nunca mostrar o valor. */
export function conferirAdmin(valor: string | undefined): string {
  const texto = (valor ?? '').trim()
  if (!texto) return 'faltando'
  const [usuario, sal, hash] = texto.split(':')
  if (!usuario || !/^[0-9a-f]{32}$/.test(sal ?? '') || !/^[0-9a-f]{128}$/.test(hash ?? '') || texto.split(':').length !== 3) {
    return 'formato errado: gere com npm run criar-admin'
  }
  return `ok (usuário ${usuario.toLowerCase()})`
}
