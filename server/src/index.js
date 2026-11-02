import { createApp } from './app.js'
import { config } from './config.js'
import { pool } from './db.js'

const app = createApp()
const server = app.listen(config.port, () => {
  console.log(`API em http://localhost:${config.port} (${config.env})`)
})

// Encerramento limpo: para de aceitar conexões e fecha o pool do banco
async function shutdown(signal) {
  console.log(`${signal} recebido, encerrando...`)
  server.close(async () => {
    await pool.end().catch(() => {})
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
