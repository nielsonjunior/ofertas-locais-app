import { stdin, stdout } from 'node:process'
import { createInterface } from 'node:readline/promises'
import { embaralhar } from '../api/_senha'

/**
 * Gera o valor de EQUIPE_INICIAL ("usuario:sal:hash") para colar na Vercel.
 * A senha não sai daqui: só o hash dela.
 *
 *   npm run criar-equipe
 */
const pergunta = createInterface({ input: stdin, output: stdout })
const usuario = (await pergunta.question('usuário: ')).trim().toLowerCase()
const senha = await pergunta.question('senha (mínimo 10 caracteres): ')
pergunta.close()
if (!/^[a-z0-9._-]{2,60}$/.test(usuario)) throw new Error('usuário só com letras, números, ponto, traço')
if (senha.length < 10) throw new Error('senha curta demais')
console.log(`\nEQUIPE_INICIAL=${usuario}:${await embaralhar(senha)}`)
