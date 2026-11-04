// Aplica db/schema.sql no banco apontado por DATABASE_URL.
// Uso: npm run migrate   (seguro para rodar de novo: se o esquema já existe, não faz nada)
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Defina DATABASE_URL (veja server/.env.example).')
  process.exit(1)
}

const file = fileURLToPath(new URL('../../db/schema.sql', import.meta.url))
const sql = await readFile(file, 'utf8')

const client = new pg.Client({ connectionString: url, ssl: process.env.DB_SSL === 'true' })
await client.connect()
try {
  const { rows } = await client.query("SELECT to_regclass('public.products') AS t")
  if (rows[0].t) {
    console.log('Esquema já existe; nada a fazer.')
    process.exit(0)
  }
  await client.query(sql)
  console.log('Esquema aplicado com sucesso.')
} catch (err) {
  console.error('Falha ao aplicar o esquema:', err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
