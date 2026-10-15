import { createHmac } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { conexaoLocal, URL_DE_TESTE } from '../servidor/pgLocal'
import { chamar } from './apoio/http'

/**
 * O caminho inteiro contra um Postgres de verdade: a equipe entra, cadastra o
 * mercado, envia a página, confere, publica; o site mostra; o WhatsApp
 * responde. A IA, o armazém de arquivos e o envio do WhatsApp são de mentira.
 *
 * Roda com DATABASE_URL_TESTE (ver CLAUDE.md); sem ela, é pulado.
 */

const arquivos = new Map<string, Buffer>()
vi.mock('@vercel/blob', () => ({
  put: vi.fn(async (caminho: string, bytes: Buffer) => { arquivos.set(caminho, bytes); return { pathname: caminho } }),
  get: vi.fn(async (caminho: string) => {
    const bytes = arquivos.get(caminho)
    return bytes ? { statusCode: 200, stream: (async function* () { yield bytes })() } : null
  }),
  del: vi.fn(async () => {})
}))

const leituraDaIa = vi.fn()
vi.mock('../api/_ia', async (original) => ({
  ...(await original<typeof import('../api/_ia')>()),
  lerPagina: (...args: unknown[]) => leituraDaIa(...args)
}))

const enviadas: { para: string; texto: string }[] = []
vi.mock('../api/_whatsapp', async (original) => ({
  ...(await original<typeof import('../api/_whatsapp')>()),
  enviarTexto: vi.fn(async (para: string, texto: string) => { enviadas.push({ para, texto }) })
}))

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)])
const SEGREDO = 'segredo-do-app'
const MARCA = { 'X-Requested-With': 'ofertas' }

describe.skipIf(!URL_DE_TESTE)('de ponta a ponta', () => {
  const banco = URL_DE_TESTE ? conexaoLocal(URL_DE_TESTE) : null
  let equipe: typeof import('../api/equipe').default
  let publico: typeof import('../api/publico').default
  let arquivo: typeof import('../api/arquivo').default
  let whatsapp: typeof import('../api/whatsapp').default
  let cookie = ''

  beforeAll(async () => {
    await banco!.limpar()
    const { usarConexao } = await import('../api/_banco')
    usarConexao(banco!.sql)
    const { embaralhar } = await import('../api/_senha')
    process.env.EQUIPE_INICIAL = `ana:${await embaralhar('senha-boa-123')}`
    process.env.WHATSAPP_SEGREDO_APP = SEGREDO
    process.env.WHATSAPP_VERIFICACAO = 'frase-da-meta'
    process.env.SITE_URL = 'https://ofertas.exemplo'
    equipe = (await import('../api/equipe')).default
    publico = (await import('../api/publico')).default
    arquivo = (await import('../api/arquivo')).default
    whatsapp = (await import('../api/whatsapp')).default
  })

  afterAll(async () => { await banco?.fechar() })
  beforeEach(() => { enviadas.length = 0 })

  function comoEquipe(metodo: string, url: string, corpo?: unknown) {
    return chamar(equipe, metodo, url, { corpo, cabecalhos: { cookie, ...MARCA } })
  }

  describe('login', () => {
    it('sem sessão, nada da equipe abre', async () => {
      expect((await chamar(equipe, 'GET', '/api/equipe?acao=panfletos')).status).toBe(401)
    })

    it('senha errada não entra', async () => {
      const r = await chamar(equipe, 'POST', '/api/equipe?acao=entrar', { corpo: { usuario: 'ana', senha: 'errada' } })
      expect(r.status).toBe(401)
    })

    it('a primeira pessoa entra com EQUIPE_INICIAL', async () => {
      const r = await chamar(equipe, 'POST', '/api/equipe?acao=entrar', { corpo: { usuario: 'Ana', senha: 'senha-boa-123' } })
      expect(r.status).toBe(200)
      expect(r.cabecalhos['set-cookie']).toContain('HttpOnly')
      cookie = r.cabecalhos['set-cookie']!.split(';')[0]!
      expect((await comoEquipe('GET', '/api/equipe?acao=eu')).json()).toEqual({ usuario: 'ana' })
    })

    it('pedido que muda algo sem a marca do site é recusado (CSRF)', async () => {
      const r = await chamar(equipe, 'POST', '/api/equipe?acao=cidade', { corpo: { nome: 'X', uf: 'MT' }, cabecalhos: { cookie } })
      expect(r.status).toBe(403)
    })
  })

  describe('do panfleto ao ar', () => {
    let mercadoId = ''
    let panfletoId = ''

    it('cadastra o mercado em Cáceres', async () => {
      const r = await comoEquipe('POST', '/api/equipe?acao=mercado', { cidadeId: 'caceres-mt', nome: 'Atacadão', endereco: 'Av. São Luiz' })
      expect(r.status).toBe(201)
      mercadoId = r.json().id
    })

    it('cria o panfleto e envia a página; a IA lê', async () => {
      panfletoId = (await comoEquipe('POST', '/api/equipe?acao=panfleto', { mercadoId })).json().id
      leituraDaIa.mockResolvedValueOnce({
        validoDe: '2026-01-01', validoAte: '2099-12-31',
        ofertas: [
          { produto: 'Arroz Tipo 1', marca: 'Tio João', quantidade: '5 kg', preco: '27,99', precoDe: '32,90', condicao: null, certeza: 'alta' },
          { produto: 'Feijão Carioca', marca: null, quantidade: '1 kg', preco: '7,99', precoDe: null, condicao: null, certeza: 'baixa' },
          { produto: 'Item sem preço', marca: null, quantidade: null, preco: 'consulte', precoDe: null, condicao: null, certeza: 'alta' }
        ]
      })
      const r = await chamar(equipe, 'POST', `/api/equipe?acao=pagina&panfleto=${panfletoId}`, {
        corpo: JPEG, cabecalhos: { cookie, ...MARCA, 'content-type': 'image/jpeg' }
      })
      expect(r.status).toBe(201)
      expect(r.json()).toMatchObject({ pagina: 1, lidas: 2, descartadas: 1 })
    })

    it('arquivo que não é imagem nem PDF é recusado', async () => {
      const r = await chamar(equipe, 'POST', `/api/equipe?acao=pagina&panfleto=${panfletoId}`, {
        corpo: Buffer.from('<html><script>alert(1)</script></html>'), cabecalhos: { cookie, ...MARCA }
      })
      expect(r.status).toBe(400)
    })

    it('a conferência mostra a validade lida e as ofertas em dúvida primeiro', async () => {
      const p = (await comoEquipe('GET', `/api/equipe?acao=panfleto&id=${panfletoId}`)).json()
      expect(p.estado).toBe('conferir')
      expect(p.validoAte).toBe('2099-12-31')
      expect(p.ofertas.map((o: any) => [o.produto, o.preco, o.confianca])).toEqual([
        ['Feijão Carioca', 799, 'baixa'],
        ['Arroz Tipo 1', 2799, 'alta']
      ])
    })

    it('ainda não publicado, o público não vê nem a página', async () => {
      expect((await chamar(publico, 'GET', `/api/publico?acao=panfleto&id=${panfletoId}`)).status).toBe(404)
      expect((await chamar(arquivo, 'GET', `/api/arquivo?panfleto=${panfletoId}&pagina=1`)).status).toBe(404)
    })

    it('não publica com oferta em dúvida', async () => {
      const r = await comoEquipe('POST', '/api/equipe?acao=publicar', { id: panfletoId })
      expect(r.status).toBe(400)
      expect(r.json().erro).toContain('amarelo')
    })

    it('conferir a oferta tira a dúvida, e aí publica', async () => {
      const p = (await comoEquipe('GET', `/api/equipe?acao=panfleto&id=${panfletoId}`)).json()
      const feijao = p.ofertas.find((o: any) => o.produto === 'Feijão Carioca')
      expect((await comoEquipe('PUT', '/api/equipe?acao=oferta', { ...feijao, preco: '7,49', precoDe: '' })).status).toBe(204)
      expect((await comoEquipe('POST', '/api/equipe?acao=publicar', { id: panfletoId })).status).toBe(204)
    })

    it('o site mostra a vitrine de Cáceres e o panfleto', async () => {
      const v = (await chamar(publico, 'GET', '/api/publico?acao=vitrine&cidade=caceres-mt')).json()
      expect(v.panfletos).toHaveLength(1)
      expect(v.panfletos[0]).toMatchObject({ mercadoNome: 'Atacadão', ofertas: 2, paginas: 1 })
      expect(v.ofertas.map((o: any) => [o.produto, o.preco])).toEqual([['Feijão Carioca', 749], ['Arroz Tipo 1', 2799]])

      const p = (await chamar(publico, 'GET', `/api/publico?acao=panfleto&id=${panfletoId}`)).json()
      expect(p).toMatchObject({ mercadoNome: 'Atacadão', vencido: false, paginas: 1 })

      const img = await chamar(arquivo, 'GET', `/api/arquivo?panfleto=${panfletoId}&pagina=1`)
      expect(img.status).toBe(200)
      expect(img.cabecalhos['content-type']).toBe('image/jpeg')
      expect(img.corpo.equals(JPEG)).toBe(true)
    })

    it('cidade que não existe dá 404', async () => {
      expect((await chamar(publico, 'GET', '/api/publico?acao=vitrine&cidade=xx')).status).toBe(404)
    })
  })

  describe('WhatsApp', () => {
    let seq = 0
    function aviso(de: string, texto: string, id = `wamid.${++seq}`) {
      return Buffer.from(JSON.stringify({
        object: 'whatsapp_business_account',
        entry: [{ changes: [{ field: 'messages', value: { messages: [{ from: de, id, type: 'text', text: { body: texto } }] } }] }]
      }))
    }
    function mandar(corpo: Buffer, segredo = SEGREDO) {
      const assinatura = 'sha256=' + createHmac('sha256', segredo).update(corpo).digest('hex')
      return chamar(whatsapp, 'POST', '/api/whatsapp', { corpo, cabecalhos: { 'x-hub-signature-256': assinatura } })
    }

    it('a Meta verifica o endereço com a frase combinada', async () => {
      const ok = await chamar(whatsapp, 'GET', '/api/whatsapp?hub.mode=subscribe&hub.verify_token=frase-da-meta&hub.challenge=123')
      expect(ok.status).toBe(200)
      expect(ok.corpo.toString()).toBe('123')
      const nao = await chamar(whatsapp, 'GET', '/api/whatsapp?hub.mode=subscribe&hub.verify_token=chute&hub.challenge=123')
      expect(nao.status).toBe(403)
    })

    it('aviso sem assinatura certa é recusado e ninguém recebe nada', async () => {
      expect((await mandar(aviso('5565999990000', 'oi'), 'outro')).status).toBe(401)
      expect(enviadas).toEqual([])
    })

    it('oi → cidade → busca, com o mais barato primeiro', async () => {
      await mandar(aviso('5565999990000', 'oi'))
      expect(enviadas.at(-1)?.texto).toContain('1. Cáceres - MT')

      await mandar(aviso('5565999990000', '1'))
      expect(enviadas.at(-1)?.texto).toContain('Cáceres')

      await mandar(aviso('5565999990000', 'arroz'))
      expect(enviadas.at(-1)?.texto).toContain('Arroz Tipo 1 Tio João 5 kg — *R$ 27,99*')
      expect(enviadas.at(-1)?.texto).toContain('Atacadão')

      await mandar(aviso('5565999990000', 'panfletos'))
      expect(enviadas.at(-1)?.texto).toContain('https://ofertas.exemplo/panfleto/')
    })

    it('a mesma mensagem reenviada pela Meta é respondida uma vez só', async () => {
      const corpo = aviso('5565999990000', 'feijao', 'wamid.repetida')
      await mandar(corpo)
      await mandar(corpo)
      expect(enviadas).toHaveLength(1)
    })

    it('SAIR apaga o número do banco', async () => {
      await mandar(aviso('5565999990000', 'sair'))
      const linhas = await banco!.sql`select * from contatos where wa_id = '5565999990000'`
      expect(linhas).toEqual([])
    })
  })

  // Por último: bloqueia a usuária.
  describe('freio de senha', () => {
    it('cinco senhas erradas seguidas travam o usuário, até com a senha certa', async () => {
      for (let i = 0; i < 5; i++) {
        await chamar(equipe, 'POST', '/api/equipe?acao=entrar', { corpo: { usuario: 'ana', senha: `chute-${i}` } })
      }
      const r = await chamar(equipe, 'POST', '/api/equipe?acao=entrar', { corpo: { usuario: 'ana', senha: 'senha-boa-123' } })
      expect(r.status).toBe(429)
    })

    it('sair apaga a sessão', async () => {
      expect((await comoEquipe('POST', '/api/equipe?acao=sair')).status).toBe(204)
      expect((await comoEquipe('GET', '/api/equipe?acao=panfletos')).status).toBe(401)
    })
  })
})
