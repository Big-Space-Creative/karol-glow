import { randomBytes } from 'node:crypto'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { config } from '../config.js'
import { query } from '../db.js'
import { HttpError, unauthorized } from '../lib/errors.js'
import { DUMMY_HASH, verifyPassword } from '../lib/password.js'
import { hashToken, requireAdmin, sessionCookieOptions } from '../middleware/auth.js'

const router = Router()

const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(200),
})

// Camada 1: limite por IP (barra robôs). Camada 2: bloqueio por e-mail no banco (abaixo).
const loginLimiter = rateLimit({
  windowMs: config.login.windowMs,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente mais tarde.' },
})

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = loginSchema.parse(req.body)
  const ip = req.ip

  // Bloqueio por e-mail: N falhas dentro da janela
  const { rows: fails } = await query(
    `SELECT count(*)::int AS n, max(created_at) AS last
       FROM login_attempts
      WHERE email = $1 AND succeeded = false
        AND created_at > now() - ($2 * interval '1 millisecond')`,
    [email, config.login.windowMs],
  )
  if (fails[0].n >= config.login.maxFailures) {
    const retryAfter = Math.max(1, Math.ceil((new Date(fails[0].last).getTime() + config.login.windowMs - Date.now()) / 1000))
    res.set('Retry-After', String(retryAfter))
    throw new HttpError(429, 'Muitas tentativas. Tente novamente mais tarde.')
  }

  const { rows } = await query(
    'SELECT id, email, name, password_hash FROM admin_users WHERE email = $1 AND is_active',
    [email],
  )
  const user = rows[0]
  // Sempre verifica um hash (o real ou um descartável): tempo igual para e-mail certo/errado
  const ok = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH)

  await query('INSERT INTO login_attempts (email, ip, succeeded) VALUES ($1, $2, $3)', [email, ip, Boolean(user && ok)])

  if (!user || !ok) throw unauthorized('E-mail ou senha incorretos') // mensagem genérica

  const token = randomBytes(32).toString('base64url')
  await query(
    `INSERT INTO admin_sessions (user_id, token_hash, ip, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, now() + ($5 * interval '1 millisecond'))`,
    [user.id, hashToken(token), ip, (req.get('user-agent') || '').slice(0, 300), config.session.ttlMs],
  )
  await query('UPDATE admin_users SET last_login_at = now() WHERE id = $1', [user.id])
  // limpeza oportunista de sessões vencidas e tentativas antigas
  await query("DELETE FROM admin_sessions WHERE expires_at < now() - interval '7 days'")
  await query("DELETE FROM login_attempts WHERE created_at < now() - interval '30 days'")

  res.cookie(config.session.cookieName, token, sessionCookieOptions())
  res.json({ user: { id: user.id, email: user.email, name: user.name } })
})

router.get('/me', requireAdmin, (req, res) => {
  res.json({ user: { id: req.admin.id, email: req.admin.email, name: req.admin.name } })
})

router.post('/logout', requireAdmin, async (req, res) => {
  await query('UPDATE admin_sessions SET revoked_at = now() WHERE id = $1', [req.admin.sessionId])
  res.clearCookie(config.session.cookieName, { ...sessionCookieOptions(), maxAge: undefined })
  res.status(204).end()
})

export default router
