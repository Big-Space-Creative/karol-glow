import { z } from 'zod'

// Todas as configurações vêm de variáveis de ambiente (veja server/.env.example).
// A API não sobe se algo obrigatório estiver faltando ou inválido.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  // Origens do site autorizadas a chamar a API (separadas por vírgula)
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  // Quantos proxies confiáveis existem na frente da API (0 = nenhum)
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  SESSION_TTL_HOURS: z.coerce.number().positive().default(8),
  SESSION_IDLE_MINUTES: z.coerce.number().positive().default(30),
  // Tentativas de login falhas antes do bloqueio e janela de contagem
  LOGIN_MAX_FAILURES: z.coerce.number().int().positive().default(5),
  LOGIN_WINDOW_MINUTES: z.coerce.number().positive().default(15),
  DB_SSL: z.enum(['true', 'false']).default('false'),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`)
  console.error(`Configuração inválida:\n${lines.join('\n')}`)
  process.exit(1)
}

const env = parsed.data

export const config = {
  env: env.NODE_ENV,
  isProd: env.NODE_ENV === 'production',
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  dbSsl: env.DB_SSL === 'true',
  dbPoolMax: env.DB_POOL_MAX,
  corsOrigins: env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
  trustProxy: env.TRUST_PROXY,
  session: {
    cookieName: 'kg_session',
    ttlMs: env.SESSION_TTL_HOURS * 60 * 60 * 1000,
    idleMs: env.SESSION_IDLE_MINUTES * 60 * 1000,
  },
  login: {
    maxFailures: env.LOGIN_MAX_FAILURES,
    windowMs: env.LOGIN_WINDOW_MINUTES * 60 * 1000,
  },
}
