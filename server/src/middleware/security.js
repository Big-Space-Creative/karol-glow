import { config } from '../config.js'
import { forbidden } from '../lib/errors.js'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

// Proteção contra CSRF para quem usa cookie de sessão:
//  1) o cookie é SameSite=Strict e HttpOnly (veja routes/auth.js);
//  2) toda requisição que altera dados precisa do cabeçalho X-Requested-With
//     (um formulário de outro site não consegue enviá-lo);
//  3) se o navegador enviou Origin, ela precisa ser uma das autorizadas.
export function csrfGuard(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next()

  if (req.get('x-requested-with') !== 'karol-glow') return next(forbidden('Cabeçalho de segurança ausente'))

  const origin = req.get('origin')
  if (origin && !config.corsOrigins.includes(origin)) return next(forbidden('Origem não autorizada'))

  next()
}

// Respostas da API nunca devem ser guardadas em cache de navegador/proxy
export function noStore(_req, res, next) {
  res.set('Cache-Control', 'no-store')
  next()
}
