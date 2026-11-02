// Uso: node scripts/hash-password.mjs "sua-senha"
// Gera VITE_ADMIN_SALT e VITE_ADMIN_PASSWORD_HASH (SHA-256 de "salt:senha") para o .env.local
import { createHash, randomBytes } from 'node:crypto'

const password = process.argv[2]
if (!password || password.length < 10) {
  console.error('Informe uma senha com pelo menos 10 caracteres: node scripts/hash-password.mjs "sua-senha"')
  process.exit(1)
}
const salt = randomBytes(16).toString('hex')
const hash = createHash('sha256').update(`${salt}:${password}`).digest('hex')
console.log(`VITE_ADMIN_SALT=${salt}\nVITE_ADMIN_PASSWORD_HASH=${hash}`)
