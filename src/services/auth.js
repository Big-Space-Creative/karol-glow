// Serviço de autenticação do admin.
//
// ATENÇÃO: não existe backend neste projeto. Esta camada protege apenas a interface
// (rotas e telas); qualquer pessoa com acesso ao bundle consegue ler e-mail, salt e hash.
// Para proteção real, troque `verifyCredentials` por uma chamada à sua API (sessão em
// cookie HttpOnly + validação no servidor) mantendo o restante do fluxo.

const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase()
const ADMIN_SALT = import.meta.env.VITE_ADMIN_SALT || ''
const ADMIN_HASH = (import.meta.env.VITE_ADMIN_PASSWORD_HASH || '').toLowerCase()

export const SESSION_KEY = 'kg_admin_session'
export const ATTEMPTS_KEY = 'kg_admin_attempts'
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000 // duração máxima da sessão
export const IDLE_TTL_MS = 30 * 60 * 1000 // inatividade máxima
export const MAX_ATTEMPTS = 5
const BASE_LOCK_MS = 5 * 60 * 1000

export const isConfigured = Boolean(ADMIN_EMAIL && ADMIN_SALT && ADMIN_HASH)

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Comparação sem curto-circuito para não vazar o ponto da diferença
function safeEqual(a, b) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function verifyCredentials(email, password) {
  const started = Date.now()
  let ok = false
  if (isConfigured) {
    const hash = await sha256Hex(`${ADMIN_SALT}:${password}`)
    const emailOk = safeEqual(String(email).trim().toLowerCase(), ADMIN_EMAIL)
    const passOk = safeEqual(hash, ADMIN_HASH)
    ok = emailOk && passOk
  }
  // tempo mínimo fixo: respostas certas e erradas demoram o mesmo
  await sleep(Math.max(0, 700 - (Date.now() - started)))
  return ok ? { email: ADMIN_EMAIL } : null
}

export function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ---------- persistência (try/catch: storage pode estar bloqueado) ----------
function read(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignora */
  }
}
function remove(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignora */
  }
}

export const loadSession = () => read(SESSION_KEY)
export const saveSession = (s) => write(SESSION_KEY, s)
export const clearSession = () => remove(SESSION_KEY)

// ---------- bloqueio por tentativas ----------
export function getLockout() {
  const a = read(ATTEMPTS_KEY) || { count: 0, lockedUntil: 0, strikes: 0 }
  return { ...a, locked: a.lockedUntil > Date.now(), remainingMs: Math.max(0, a.lockedUntil - Date.now()) }
}

export function registerFailure() {
  const a = read(ATTEMPTS_KEY) || { count: 0, lockedUntil: 0, strikes: 0 }
  const count = a.count + 1
  if (count >= MAX_ATTEMPTS) {
    const strikes = (a.strikes || 0) + 1
    // 5 min, 10 min, 20 min... (máx. 1 h)
    const lockMs = Math.min(BASE_LOCK_MS * 2 ** (strikes - 1), 60 * 60 * 1000)
    write(ATTEMPTS_KEY, { count: 0, strikes, lockedUntil: Date.now() + lockMs })
  } else {
    write(ATTEMPTS_KEY, { ...a, count })
  }
  return getLockout()
}

export function resetFailures() {
  remove(ATTEMPTS_KEY)
}

// Só aceita caminhos internos do admin (evita open redirect)
export function safeRedirect(path) {
  if (typeof path !== 'string') return '/admin'
  if (!path.startsWith('/admin') || path.startsWith('//') || path.includes('://') || path.includes('\\')) return '/admin'
  return path
}
