import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)

// scrypt (nativo do Node, sem dependências). Formato: scrypt$N$r$p$salt$hash (base64)
const N = 2 ** 14
const R = 8
const P = 1
const KEYLEN = 64

export const MIN_PASSWORD_LENGTH = 10

export async function hashPassword(password) {
  const salt = randomBytes(16)
  const key = await scryptAsync(password, salt, KEYLEN, { N, r: R, p: P })
  return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$')
}

export async function verifyPassword(password, stored) {
  const parts = String(stored).split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const [, n, r, p, salt, hash] = parts
  const expected = Buffer.from(hash, 'base64')
  const key = await scryptAsync(password, Buffer.from(salt, 'base64'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  })
  return key.length === expected.length && timingSafeEqual(key, expected)
}

// Hash descartável: verificar contra ele quando o e-mail não existe mantém o tempo de resposta igual
export const DUMMY_HASH = await hashPassword(randomBytes(16).toString('hex'))
