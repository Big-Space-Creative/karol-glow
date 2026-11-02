// Cria (ou atualiza a senha de) um usuário administrador.
// A senha é pedida no terminal, sem aparecer na tela, e nunca é impressa nem gravada em arquivo.
// Uso: npm run admin:create -- voce@exemplo.com "Nome do usuário"
import { createInterface } from 'node:readline'
import { Writable } from 'node:stream'
import pg from 'pg'
import { MIN_PASSWORD_LENGTH, hashPassword } from '../src/lib/password.js'

const [email, name = 'Administrador'] = process.argv.slice(2)
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error('Uso: npm run admin:create -- voce@exemplo.com "Nome do usuário"')
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error('Defina DATABASE_URL (veja server/.env.example).')
  process.exit(1)
}

// Lê uma linha sem ecoar os caracteres digitados
function askHidden(prompt) {
  return new Promise((resolve) => {
    let muted = false
    const out = new Writable({
      write(chunk, _enc, cb) {
        if (!muted) process.stdout.write(chunk)
        cb()
      },
    })
    const rl = createInterface({ input: process.stdin, output: out, terminal: true })
    process.stdout.write(prompt)
    muted = true
    rl.question('', (answer) => {
      muted = false
      rl.close()
      process.stdout.write('\n')
      resolve(answer)
    })
  })
}

const password = await askHidden(`Senha (mínimo ${MIN_PASSWORD_LENGTH} caracteres): `)
const confirm = await askHidden('Repita a senha: ')
if (password !== confirm) {
  console.error('As senhas não conferem.')
  process.exit(1)
}
if (password.length < MIN_PASSWORD_LENGTH) {
  console.error(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
  process.exit(1)
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.DB_SSL === 'true' })
await client.connect()
try {
  const hash = await hashPassword(password)
  await client.query(
    `INSERT INTO admin_users (email, name, password_hash) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name, is_active = true`,
    [email.toLowerCase(), name, hash],
  )
  // encerra sessões antigas desse usuário (útil quando a senha foi trocada)
  await client.query(
    `UPDATE admin_sessions SET revoked_at = now()
      WHERE revoked_at IS NULL AND user_id = (SELECT id FROM admin_users WHERE email = $1)`,
    [email.toLowerCase()],
  )
  console.log(`Administrador ${email} salvo.`)
} finally {
  await client.end()
}
