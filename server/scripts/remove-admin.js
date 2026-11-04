// Remove um usuário administrador e encerra as sessões dele.
// Uso: node scripts/remove-admin.js voce@exemplo.com      (npm run admin:remove -- voce@exemplo.com)
import pg from 'pg'

const [email] = process.argv.slice(2)
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error('Uso: npm run admin:remove -- voce@exemplo.com')
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error('Defina DATABASE_URL (veja server/.env.example).')
  process.exit(1)
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.DB_SSL === 'true' })
await client.connect()
try {
  await client.query('BEGIN')
  const { rows } = await client.query('SELECT id, email FROM admin_users WHERE email = $1 FOR UPDATE', [email.toLowerCase()])
  if (rows.length === 0) {
    console.error(`Nenhum administrador com o e-mail ${email}.`)
    process.exitCode = 1
  } else {
    const { rows: count } = await client.query('SELECT count(*)::int AS n FROM admin_users WHERE is_active')
    if (count[0].n <= 1) {
      console.error('Este é o único administrador; crie outro antes de removê-lo.')
      process.exitCode = 1
    } else {
      // as sessões saem junto (ON DELETE CASCADE); vendas antigas ficam, só perdem o vínculo com o usuário
      await client.query('DELETE FROM admin_users WHERE id = $1', [rows[0].id])
      console.log(`Administrador ${rows[0].email} removido.`)
    }
  }
  await client.query('COMMIT')
} catch (err) {
  await client.query('ROLLBACK').catch(() => {})
  console.error('Falha ao remover:', err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
