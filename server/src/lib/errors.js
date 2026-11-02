import { ZodError } from 'zod'

// Erro "esperado" com status HTTP e mensagem segura para mostrar ao cliente
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

export const badRequest = (m = 'Requisição inválida', d) => new HttpError(400, m, d)
export const unauthorized = (m = 'Não autenticado') => new HttpError(401, m)
export const forbidden = (m = 'Acesso negado') => new HttpError(403, m)
export const notFound = (m = 'Não encontrado') => new HttpError(404, m)
export const conflict = (m = 'Conflito') => new HttpError(409, m)

export function notFoundHandler(_req, _res, next) {
  next(notFound('Rota não encontrada'))
}

// Último middleware: converte qualquer erro em JSON sem vazar detalhes internos
export function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, ...(err.details ? { details: err.details } : {}) })
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    })
  }
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido' })
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Corpo da requisição grande demais' })

  // Violações de regra do PostgreSQL
  if (err?.code === '23505') return res.status(409).json({ error: 'Já existe um registro com esse valor' })
  if (err?.code === '23001' || err?.code === '23503') return res.status(409).json({ error: 'Registro em uso ou referência inexistente' })
  if (err?.code === '23514') return res.status(409).json({ error: 'Valor não permitido (por exemplo, estoque insuficiente)' })
  if (err?.code === '22P02') return res.status(400).json({ error: 'Valor em formato inválido' })

  console.error(`[erro] ${req.method} ${req.originalUrl}:`, err)
  return res.status(500).json({ error: 'Erro interno do servidor' })
}
