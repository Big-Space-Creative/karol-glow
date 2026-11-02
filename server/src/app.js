import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { config } from './config.js'
import { query } from './db.js'
import { errorHandler, notFoundHandler } from './lib/errors.js'
import { requireAdmin } from './middleware/auth.js'
import { csrfGuard, noStore } from './middleware/security.js'
import authRoutes from './routes/auth.js'
import { adminRouter as adminProducts, publicRouter as publicProducts } from './routes/products.js'
import { adminRouter as adminCatalog, publicRouter as publicCatalog } from './routes/catalog.js'
import { adminRouter as adminSales } from './routes/sales.js'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  if (config.trustProxy > 0) app.set('trust proxy', config.trustProxy) // IP real atrás de proxy/load balancer

  app.use(helmet())
  app.use(
    cors({
      origin(origin, cb) {
        // sem Origin = chamada do próprio servidor/ferramentas; com Origin só as autorizadas
        if (!origin || config.corsOrigins.includes(origin)) return cb(null, true)
        cb(null, false)
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'X-Requested-With'],
    }),
  )
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 600,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { error: 'Muitas requisições. Tente novamente em instantes.' },
    }),
  )
  app.use(express.json({ limit: '100kb' }))
  app.use(cookieParser())

  app.get('/api/health', async (_req, res) => {
    await query('SELECT 1')
    res.json({ status: 'ok' })
  })

  // Catálogo público (somente leitura, pode ser cacheado por pouco tempo)
  app.use('/api/products', publicProducts)
  app.use('/api/catalog', publicCatalog)

  // Tudo abaixo altera dados ou é privado: CSRF + sem cache
  app.use('/api/auth', noStore, csrfGuard, authRoutes)
  app.use('/api/admin', noStore, csrfGuard, requireAdmin)
  app.use('/api/admin/products', adminProducts)
  app.use('/api/admin/catalog', adminCatalog)
  app.use('/api/admin/sales', adminSales)

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
