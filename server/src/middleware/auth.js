import { createHash } from 'node:crypto'
import { config } from '../config.js'
import { query } from '../db.js'
import { unauthorized } from '../lib/errors.js'

// O cookie guarda o token; o banco guarda só o hash dele (vazamento do banco não dá sessão)
export const hashToken = (token) => createHash('sha256').update(token).digest('hex')

export function sessionCookieOptions() {
  return {
    httpOnly: true, // JavaScript da página não lê o cookie (protege contra XSS)
    secure: config.isProd, // só HTTPS em produção
    sameSite: 'strict',
    path: '/api',
    maxAge: config.session.ttlMs,
  }
}

// Exige sessão válida: não revogada, dentro do prazo, sem inatividade e usuário ativo
export async function requireAdmin(req, _res, next) {
  const token = req.cookies?.[config.session.cookieName]
  if (!token || typeof token !== 'string' || token.length > 200) return next(unauthorized())

  const { rows } = await query(
    `SELECT s.id AS session_id, s.last_seen_at, u.id, u.email, u.name
       FROM admin_sessions s
       JOIN admin_users u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > now()
        AND s.last_seen_at > now() - ($2 * interval '1 millisecond')
        AND u.is_active`,
    [hashToken(token), config.session.idleMs],
  )
  const row = rows[0]
  if (!row) return next(unauthorized('Sessão expirada'))

  // renova a marca de atividade (no máximo 1 gravação por minuto)
  if (Date.now() - new Date(row.last_seen_at).getTime() > 60_000) {
    await query('UPDATE admin_sessions SET last_seen_at = now() WHERE id = $1', [row.session_id])
  }

  req.admin = { id: row.id, email: row.email, name: row.name, sessionId: row.session_id }
  next()
}
