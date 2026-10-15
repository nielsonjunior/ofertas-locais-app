import { createHmac } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { conexaoLocal, URL_DE_TESTE } from '../servidor/pgLocal'
import { chamar } from './apoio/http'

/**
 * O caminho inteiro contra um Postgres de verdade: o lojista se cadastra,
 * posta, o administrador aprova, o feed mostra, o consumidor chama no
 * WhatsApp e denuncia. O armazém de fotos e o envio do WhatsApp são de mentira.
 *
 * Roda com DATABASE_URL_TESTE (ver CLAUDE.md); sem ela, é pulado.
 */

vi.mock('@vercel/blob', () => ({
  put: vi.fn(async (caminho: string) => ({ url: `https://abc123.public.blob.vercel-storage.com/${caminho}` }))
}))

const enviadas: { para: string; texto: string }[] = []
vi.mock('../api/_whatsapp', async (original) => ({
  ...(await original<typeof import('../api/_whatsapp')>()),
  enviarTexto: vi.fn(async (para: string, texto: string) => { enviadas.push({ para, texto }) })
}))

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)])
const SEGREDO = 'segredo-do-app'
const MARCA = { 'X-Requested-With': 'ofertas' }
let ip = 0

describe.skipIf(!URL_DE_TESTE)('de ponta a ponta', () => {
  const banco = URL_DE_TESTE ? conexaoLocal(URL_DE_TESTE) : null
  let conta: typeof import('../api/conta').default
  let loja: typeof import('../api/loja').default
  let admin: typeof import('../api/admin').default
  let publico: typeof import('../api/publico').default
  let whatsapp: typeof import('../api/whatsapp').default
  const cookies: Record<string, string> = {}

  beforeAll(async () => {
    await banco!.limpar()
    const { usarConexao } = await import('../api/_banco')
    usarConexao(banco!.sql)
    const { embaralhar } = await import('../api/_senha')
    process.env.ADMIN_INICIAL = `chefe:${await embaralhar('senha-do-chefe-1')}`
    process.env.WHATSAPP_SEGREDO_APP = SEGREDO
    process.env.SITE_URL = 'https://ofertas.exemplo'
    conta = (await import('../api/conta')).default
    loja = (await import('../api/loja')).default
    admin = (await import('../api/admin')).default
    publico = (await import('../api/publico')).default
    whatsapp = (await import('../api/whatsapp')).default
  })

  afterAll(async () => { await banco?.fechar() })
  beforeEach(() => { enviadas.length = 0 })

  /** Cada pedido de um endereço diferente, para o freio por endereço não atrapalhar o teste. */
  function pedir(endereco: Parameters<typeof chamar>[0], metodo: string, url: string, quem?: string, corpo?: unknown, extra: Record<string, string> = {}) {
    return chamar(endereco, metodo, url, {
      corpo,
      cabecalhos: { ...MARCA, 'x-forwarded-for': `10.9.${Math.floor(++ip / 250)}.${ip % 250}`, ...(quem ? { cookie: cookies[quem]! } : {}), ...extra }
    })
  }

  function guardarCookie(quem: string, r: Awaited<ReturnType<typeof chamar>>) {
    cookies[quem] = r.cabecalhos['set-cookie']!.split(';')[0]!
  }

  const novaLoja = (usuario: string, nome: string, whatsappDaLoja = '(65) 99999-0000') => ({
    usuario, senha: 'senha-forte-123', cidadeId: 'caceres-mt', nome, categoria: 'roupas',
    whatsapp: whatsappDaLoja, endereco: 'Rua 1', descricao: '', aceite: true
  })

  async function postar(quem: string, titulo: string, preco = '99,90') {
    const foto = await pedir(loja, 'POST', '/api/loja?acao=foto', quem, JPEG)
    const r = await pedir(loja, 'POST', '/api/loja?acao=produto', quem, {
      titulo, descricao: '', categoria: 'roupas', preco, precoDe: '', fotos: [foto.json().url]
    })
    expect(r.status).toBe(201)
    return r.json().id as string
  }

  async function feed(categoria = '') {
    const r = await pedir(publico, 'GET', `/api/publico?acao=feed&cidade=caceres-mt${categoria ? `&categoria=${categoria}` : ''}`)
    return r.json().produtos as { id: string; titulo: string; lojaNome: string }[]
  }

  let tenisId = ''

  describe('cadastro do lojista', () => {
    it('cria a conta e a loja, já logado, com a loja pendente', async () => {
      const r = await pedir(conta, 'POST', '/api/conta?acao=cadastrar', undefined, novaLoja('casa.tenis', 'Casa do Tênis'))
      expect(r.status).toBe(201)
      expect(r.json().sessao).toMatchObject({ usuario: 'casa.tenis', papel: 'lojista' })
      guardarCookie('A', r)
      const minha = (await pedir(loja, 'GET', '/api/loja?acao=minha', 'A')).json()
      expect(minha.loja).toMatchObject({ nome: 'Casa do Tênis', whatsapp: '65999990000', estado: 'pendente' })
    })

    it('recusa usuário repetido, WhatsApp inválido, sem aceite e sem a marca do site', async () => {
      expect((await pedir(conta, 'POST', '/api/conta?acao=cadastrar', undefined, novaLoja('casa.tenis', 'Outra'))).json().erro).toContain('já existe')
      expect((await pedir(conta, 'POST', '/api/conta?acao=cadastrar', undefined, novaLoja('outra', 'Outra', '123'))).status).toBe(400)
      expect((await pedir(conta, 'POST', '/api/conta?acao=cadastrar', undefined, { ...novaLoja('outra', 'Outra'), aceite: false })).status).toBe(400)
      const semMarca = await chamar(conta, 'POST', '/api/conta?acao=cadastrar', { corpo: novaLoja('outra', 'Outra') })
      expect(semMarca.status).toBe(403)
    })

    it('posta com a loja pendente, mas nada aparece no feed', async () => {
      tenisId = await postar('A', 'Tênis Nike Revolution', '349,90')
      expect(await feed()).toEqual([])
      expect((await pedir(publico, 'GET', `/api/publico?acao=produto&id=${tenisId}`)).status).toBe(404)
    })

    it('foto que não é imagem e foto de fora não entram', async () => {
      expect((await pedir(loja, 'POST', '/api/loja?acao=foto', 'A', Buffer.from('<html><script>x</script></html>'))).status).toBe(400)
      const r = await pedir(loja, 'POST', '/api/loja?acao=produto', 'A', {
        titulo: 'X', categoria: 'roupas', preco: '1,00', fotos: ['https://golpe.exemplo/x.jpg']
      })
      expect(r.status).toBe(400)
    })
  })

  describe('administrador', () => {
    it('entra com ADMIN_INICIAL; lojista não entra no admin', async () => {
      const r = await pedir(conta, 'POST', '/api/conta?acao=entrar', undefined, { usuario: 'chefe', senha: 'senha-do-chefe-1' })
      expect(r.status).toBe(200)
      guardarCookie('chefe', r)
      expect((await pedir(admin, 'GET', '/api/admin?acao=lojas', 'A')).status).toBe(403)
      expect((await pedir(admin, 'GET', '/api/admin?acao=lojas')).status).toBe(401)
    })

    it('vê a loja pendente e aprova; o produto entra no feed', async () => {
      const lojas = (await pedir(admin, 'GET', '/api/admin?acao=lojas&estado=pendente', 'chefe')).json()
      expect(lojas).toHaveLength(1)
      expect(lojas[0]).toMatchObject({ nome: 'Casa do Tênis', usuario: 'casa.tenis', produtos: 1, cidade: 'Cáceres - MT' })
      expect((await pedir(admin, 'POST', '/api/admin?acao=estado-da-loja', 'chefe', { id: lojas[0].id, estado: 'aprovada' })).status).toBe(204)
      expect((await feed()).map((p) => p.titulo)).toEqual(['Tênis Nike Revolution'])
      const produto = (await pedir(publico, 'GET', `/api/publico?acao=produto&id=${tenisId}`)).json()
      expect(produto).toMatchObject({ titulo: 'Tênis Nike Revolution', preco: 34990, lojaWhatsapp: '65999990000', cidadeId: 'caceres-mt' })
    })
  })

  describe('feed e lojas', () => {
    it('intercala as lojas e filtra por categoria', async () => {
      const r = await pedir(conta, 'POST', '/api/conta?acao=cadastrar', undefined, novaLoja('moda.center', 'Moda Center', '65988887777'))
      guardarCookie('B', r)
      const lojaB = (await pedir(loja, 'GET', '/api/loja?acao=minha', 'B')).json().loja.id
      await pedir(admin, 'POST', '/api/admin?acao=estado-da-loja', 'chefe', { id: lojaB, estado: 'aprovada' })
      await postar('B', 'Camiseta Polo')
      await postar('B', 'Bermuda Jeans')
      await postar('A', 'Chinelo Havaianas')

      const lojas = (await feed()).map((p) => p.lojaNome)
      for (let i = 1; i < lojas.length; i++) {
        if (lojas[i] === lojas[i - 1]) expect(new Set(lojas.slice(i)).size).toBe(1)
      }
      expect(await feed('pet')).toEqual([])
      expect((await pedir(publico, 'GET', '/api/publico?acao=feed&cidade=caceres-mt&categoria=armas')).status).toBe(400)
    })

    it('a página da loja mostra os produtos dela', async () => {
      const lojaA = (await pedir(loja, 'GET', '/api/loja?acao=minha', 'A')).json().loja.id
      const r = (await pedir(publico, 'GET', `/api/publico?acao=loja&id=${lojaA}`)).json()
      expect(r.nome).toBe('Casa do Tênis')
      expect(r.produtos.map((p: { titulo: string }) => p.titulo).sort()).toEqual(['Chinelo Havaianas', 'Tênis Nike Revolution'])
    })

    it('uma loja não mexe no produto da outra', async () => {
      expect((await pedir(loja, 'DELETE', `/api/loja?acao=produto&id=${tenisId}`, 'B')).status).toBe(404)
      expect((await pedir(loja, 'POST', '/api/loja?acao=ativo', 'B', { id: tenisId, ativo: false })).status).toBe(404)
      expect((await pedir(publico, 'GET', `/api/publico?acao=produto&id=${tenisId}`)).status).toBe(200)
    })

    it('pausar tira do feed; reativar volta', async () => {
      await pedir(loja, 'POST', '/api/loja?acao=ativo', 'A', { id: tenisId, ativo: false })
      expect((await feed()).some((p) => p.id === tenisId)).toBe(false)
      await pedir(loja, 'POST', '/api/loja?acao=ativo', 'A', { id: tenisId, ativo: true })
      expect((await feed()).some((p) => p.id === tenisId)).toBe(true)
    })

    it('vistas e cliques chegam ao painel do lojista', async () => {
      await pedir(publico, 'POST', '/api/publico?acao=vistas', undefined, { ids: [tenisId, tenisId] })
      await pedir(publico, 'POST', '/api/publico?acao=clique', undefined, { id: tenisId })
      const p = (await pedir(loja, 'GET', '/api/loja?acao=minha', 'A')).json().produtos.find((x: { id: string }) => x.id === tenisId)
      expect(p).toMatchObject({ vistas: 1, cliques: 1 })
    })

    it('trocar o WhatsApp de loja aprovada volta para análise e sai do feed', async () => {
      const minha = (await pedir(loja, 'GET', '/api/loja?acao=minha', 'A')).json().loja
      await pedir(loja, 'PUT', '/api/loja?acao=loja', 'A', { ...minha, whatsapp: '65911112222' })
      expect((await pedir(loja, 'GET', '/api/loja?acao=minha', 'A')).json().loja.estado).toBe('pendente')
      expect((await feed()).some((p) => p.lojaNome === 'Casa do Tênis')).toBe(false)
      await pedir(admin, 'POST', '/api/admin?acao=estado-da-loja', 'chefe', { id: minha.id, estado: 'aprovada' })
      // Mudar só o endereço não tira do ar.
      await pedir(loja, 'PUT', '/api/loja?acao=loja', 'A', { ...minha, whatsapp: '65911112222', endereco: 'Rua 2' })
      expect((await pedir(loja, 'GET', '/api/loja?acao=minha', 'A')).json().loja.estado).toBe('aprovada')
    })
  })

  describe('denúncia', () => {
    it('chega ao admin, que tira o produto do ar', async () => {
      expect((await pedir(publico, 'POST', '/api/publico?acao=denuncia', undefined, { produtoId: tenisId, motivo: 'qualquer' })).status).toBe(400)
      expect((await pedir(publico, 'POST', '/api/publico?acao=denuncia', undefined, { produtoId: tenisId, motivo: 'golpe' })).status).toBe(201)
      const denuncias = (await pedir(admin, 'GET', '/api/admin?acao=denuncias', 'chefe')).json()
      expect(denuncias[0]).toMatchObject({ produtoId: tenisId, motivo: 'golpe', lojaNome: 'Casa do Tênis' })
      await pedir(admin, 'POST', '/api/admin?acao=tirar-do-ar', 'chefe', { produtoId: tenisId })
      expect((await feed()).some((p) => p.id === tenisId)).toBe(false)
      expect((await pedir(admin, 'GET', '/api/admin?acao=denuncias', 'chefe')).json()).toEqual([])
    })
  })

  describe('WhatsApp', () => {
    let seq = 0
    function mandar(de: string, texto: string) {
      const corpo = Buffer.from(JSON.stringify({
        entry: [{ changes: [{ value: { messages: [{ from: de, id: `wamid.${++seq}`, type: 'text', text: { body: texto } }] } }] }]
      }))
      const assinatura = 'sha256=' + createHmac('sha256', SEGREDO).update(corpo).digest('hex')
      return chamar(whatsapp, 'POST', '/api/whatsapp', { corpo, cabecalhos: { 'x-hub-signature-256': assinatura } })
    }

    it('oi → cidade → busca produto da cidade', async () => {
      await mandar('5565900000001', 'oi')
      expect(enviadas.at(-1)?.texto).toContain('1. Cáceres - MT')
      await mandar('5565900000001', '1')
      await mandar('5565900000001', 'camiseta')
      expect(enviadas.at(-1)?.texto).toContain('*Camiseta Polo* — R$ 99,90')
      expect(enviadas.at(-1)?.texto).toContain('Moda Center')
    })
  })

  describe('bloqueio', () => {
    it('loja bloqueada sai do feed e o lojista perde a sessão', async () => {
      const lojaB = (await pedir(loja, 'GET', '/api/loja?acao=minha', 'B')).json().loja.id
      await pedir(admin, 'POST', '/api/admin?acao=estado-da-loja', 'chefe', { id: lojaB, estado: 'bloqueada' })
      expect((await feed()).some((p) => p.lojaNome === 'Moda Center')).toBe(false)
      expect((await pedir(loja, 'GET', '/api/loja?acao=minha', 'B')).status).toBe(401)
    })

    it('sair apaga a sessão', async () => {
      expect((await pedir(conta, 'POST', '/api/conta?acao=sair', 'A')).status).toBe(204)
      expect((await pedir(loja, 'GET', '/api/loja?acao=minha', 'A')).status).toBe(401)
    })
  })
})
