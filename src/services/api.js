// Cliente HTTP da API. Mesmo domínio em produção; em desenvolvimento o Vite encaminha /api.
// A sessão vai em cookie HttpOnly (o JavaScript nunca vê o token); o header abaixo é a
// proteção contra CSRF exigida pelo servidor.

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

let onUnauthorized = null
// Quem cuida da sessão (store de auth) registra aqui o que fazer quando a API responde 401
export const setUnauthorizedHandler = (fn) => (onUnauthorized = fn)

export async function api(path, { method = 'GET', body, query, silent401 = false } = {}) {
  let url = `/api${path}`
  if (query) {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== '') qs.set(k, v)
    const s = qs.toString()
    if (s) url += `?${s}`
  }

  let res
  try {
    res = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: {
        'X-Requested-With': 'karol-glow',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Sem conexão com o servidor. Tente novamente.')
  }

  if (res.status === 204) return null
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    if (res.status === 401 && !silent401 && onUnauthorized) onUnauthorized()
    throw new ApiError(res.status, data?.error || 'Não foi possível concluir a operação.', data?.details)
  }
  return data
}

// Mensagem amigável a partir de qualquer erro (inclui o primeiro detalhe de validação)
export function errorMessage(err) {
  if (err instanceof ApiError) {
    const first = err.details?.[0]
    return first?.message ? `${err.message}: ${first.message}` : err.message
  }
  return 'Algo deu errado. Tente novamente.'
}
