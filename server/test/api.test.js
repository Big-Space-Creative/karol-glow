// Testes de integração da API contra um PostgreSQL REAL e DESCARTÁVEL.
// Use um banco de teste já migrado (npm run migrate) e aponte TEST_DATABASE_URL para ele.
// Os testes criam e apagam dados: NUNCA aponte para um banco de produção.
//   TEST_DATABASE_URL=postgres://... npm test
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { after, before, describe, it } from 'node:test'

const testUrl = process.env.TEST_DATABASE_URL
if (!testUrl) {
  console.log('TEST_DATABASE_URL não definida: testes de integração ignorados.')
  process.exit(0)
}
if (process.env.NODE_ENV === 'production') throw new Error('Recusando rodar testes com NODE_ENV=production')
process.env.DATABASE_URL = testUrl
process.env.LOGIN_MAX_FAILURES = '5'

const { createApp } = await import('../src/app.js')
const { pool, query } = await import('../src/db.js')
const { hashPassword } = await import('../src/lib/password.js')

const EMAIL = `teste-${randomBytes(4).toString('hex')}@example.com`
const PASSWORD = randomBytes(12).toString('base64url') // senha aleatória só deste teste
let server
let base
let cookie = ''

const H = { 'Content-Type': 'application/json', 'X-Requested-With': 'karol-glow' }
async function api(method, path, { body, auth = true, headers = {} } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { ...H, ...(auth && cookie ? { Cookie: cookie } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  return { status: res.status, headers: res.headers, json: text ? JSON.parse(text) : null }
}

before(async () => {
  await query('INSERT INTO admin_users (email, name, password_hash) VALUES ($1, $2, $3)', [EMAIL, 'Teste', await hashPassword(PASSWORD)])
  server = createApp().listen(0)
  await new Promise((r) => server.once('listening', r))
  base = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await query('DELETE FROM sales WHERE customer LIKE $1', ['teste-%'])
  await query("DELETE FROM products WHERE name LIKE 'Teste API%'")
  await query('DELETE FROM admin_users WHERE email = $1', [EMAIL])
  await query('DELETE FROM login_attempts WHERE email = $1', [EMAIL])
  await query("DELETE FROM categories WHERE name LIKE 'Teste API%'")
  await new Promise((r) => server.close(r))
  await pool.end()
})

describe('saúde e público', () => {
  it('GET /api/health', async () => {
    const r = await api('GET', '/api/health', { auth: false })
    assert.equal(r.status, 200)
    assert.equal(r.json.status, 'ok')
  })

  it('cabeçalhos de segurança e sem x-powered-by', async () => {
    const r = await api('GET', '/api/health', { auth: false })
    assert.equal(r.headers.get('x-powered-by'), null)
    assert.ok(r.headers.get('x-content-type-options'))
  })

  it('lista produtos ativos com paginação e filtros', async () => {
    const r = await api('GET', '/api/products?perPage=5&sort=low', { auth: false })
    assert.equal(r.status, 200)
    assert.ok(r.json.items.length <= 5)
    assert.ok(r.json.items.every((p) => p.active))
    const prices = r.json.items.map((p) => p.price)
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b))
    const f = await api('GET', '/api/products?category=Rosto', { auth: false })
    assert.ok(f.json.items.every((p) => p.category === 'Rosto'))
  })

  it('busca com caracteres especiais não quebra nem injeta SQL', async () => {
    const r = await api('GET', `/api/products?q=${encodeURIComponent("'; DROP TABLE products; --")}`, { auth: false })
    assert.equal(r.status, 200)
    assert.equal(r.json.total, 0)
    const ok = await api('GET', '/api/products?perPage=1', { auth: false })
    assert.equal(ok.status, 200)
  })

  it('valida parâmetros inválidos', async () => {
    assert.equal((await api('GET', '/api/products?perPage=9999', { auth: false })).status, 400)
    assert.equal((await api('GET', '/api/products/abc', { auth: false })).status, 400)
    assert.equal((await api('GET', '/api/products/99999999', { auth: false })).status, 404)
  })

  it('catálogo público', async () => {
    const r = await api('GET', '/api/catalog', { auth: false })
    assert.equal(r.status, 200)
    assert.ok(r.json.categories.length >= 5)
    assert.ok(Array.isArray(r.json.skinTypes))
  })
})

describe('proteção do admin', () => {
  it('rotas admin exigem login (401)', async () => {
    for (const [m, p] of [['GET', '/api/admin/products'], ['GET', '/api/admin/sales'], ['POST', '/api/admin/products'], ['GET', '/api/auth/me']]) {
      assert.equal((await api(m, p, { auth: false, body: m === 'POST' ? {} : undefined })).status, 401, `${m} ${p}`)
    }
  })

  it('CSRF: POST sem X-Requested-With é bloqueado (403)', async () => {
    const res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    })
    assert.equal(res.status, 403)
  })

  it('CSRF: Origin não autorizada é bloqueada (403)', async () => {
    const r = await api('POST', '/api/auth/login', { auth: false, body: { email: EMAIL, password: PASSWORD }, headers: { Origin: 'https://evil.example' } })
    assert.equal(r.status, 403)
  })

  it('login com senha errada: 401 genérico', async () => {
    const r = await api('POST', '/api/auth/login', { auth: false, body: { email: EMAIL, password: 'errada-123' } })
    assert.equal(r.status, 401)
    assert.equal(r.json.error, 'E-mail ou senha incorretos')
    const unknown = await api('POST', '/api/auth/login', { auth: false, body: { email: 'naoexiste@example.com', password: 'errada-123' } })
    assert.equal(unknown.json.error, r.json.error) // não revela se o e-mail existe
  })

  it('login válido define cookie HttpOnly + SameSite=Strict e não devolve o hash', async () => {
    const r = await api('POST', '/api/auth/login', { auth: false, body: { email: EMAIL, password: PASSWORD } })
    assert.equal(r.status, 200)
    assert.ok(!JSON.stringify(r.json).includes('hash'))
    const set = r.headers.get('set-cookie')
    assert.match(set, /kg_session=/)
    assert.match(set, /HttpOnly/i)
    assert.match(set, /SameSite=Strict/i)
    cookie = set.split(';')[0]
    const me = await api('GET', '/api/auth/me')
    assert.equal(me.status, 200)
    assert.equal(me.json.user.email, EMAIL)
  })

  it('o banco guarda só o hash do token da sessão', async () => {
    const token = cookie.split('=')[1]
    const { rows } = await query("SELECT token_hash FROM admin_sessions WHERE token_hash = $1 OR token_hash = encode(sha256($2::bytea), 'hex')", [token, token])
    assert.equal(rows.length, 1)
    assert.notEqual(rows[0].token_hash, token)
  })

  it('cookie forjado é recusado', async () => {
    const r = await api('GET', '/api/auth/me', { auth: false, headers: { Cookie: 'kg_session=token-falso' } })
    assert.equal(r.status, 401)
  })
})

describe('produtos (admin)', () => {
  let id
  let skuBase
  const payload = (over = {}) => ({
    name: 'Teste API Hidratante',
    description: 'Descrição de teste',
    categoryId: 1,
    brandId: 1,
    price: 100,
    promoPrice: 90,
    stock: 10,
    volume: '30 ml',
    tag: 'Novo',
    active: true,
    featured: true,
    bestSeller: false,
    skinTypeIds: [1],
    images: ['https://example.com/a.png'],
    variations: [{ typeId: 1, label: '50 ml', price: 150, stock: 5 }],
    ...over,
  })

  it('cria produto com SKU automático, tipos de pele, imagens e variações', async () => {
    const r = await api('POST', '/api/admin/products', { body: payload() })
    assert.equal(r.status, 201, JSON.stringify(r.json))
    id = r.json.id
    skuBase = r.json.sku
    assert.match(r.json.sku, /^KG-\d{4,}$/)
    assert.deepEqual(r.json.skinTypes.length, 1)
    assert.equal(r.json.images[0], 'https://example.com/a.png')
    assert.equal(r.json.variations[0].sku, `${skuBase}-1`)
  })

  it('rejeita dados inválidos (400)', async () => {
    const bad = [
      payload({ name: 'x' }),
      payload({ price: -1 }),
      payload({ promoPrice: 200 }),
      payload({ stock: 1.5 }),
      payload({ categoryId: 'a' }),
    ]
    for (const b of bad) assert.equal((await api('POST', '/api/admin/products', { body: b })).status, 400)
  })

  it('rejeita imagem com esquema perigoso', async () => {
    const r = await api('POST', '/api/admin/products', { body: payload({ name: 'Teste API X', images: ['javascript:alert(1)'] }) })
    assert.equal(r.status, 400)
  })

  it('categoria inexistente: 409 (violação de chave estrangeira)', async () => {
    const r = await api('POST', '/api/admin/products', { body: payload({ name: 'Teste API Y', categoryId: 999999 }) })
    assert.equal(r.status, 409)
  })

  it('edita produto, lista no admin (inclui inativos) e busca por SKU', async () => {
    const put = await api('PUT', `/api/admin/products/${id}`, { body: payload({ name: 'Teste API Hidratante 2', active: false, price: 120, promoPrice: null }) })
    assert.equal(put.status, 200)
    assert.equal(put.json.price, 120)
    const pub = await api('GET', `/api/products/${id}`, { auth: false })
    assert.equal(pub.status, 404) // inativo some do site
    const adm = await api('GET', `/api/admin/products?q=${skuBase}&status=inactive`)
    assert.ok(adm.json.items.some((p) => p.id === id))
  })

  it('PATCH rápido ativa de novo e ajusta estoque', async () => {
    const r = await api('PATCH', `/api/admin/products/${id}`, { body: { active: true, stock: 7 } })
    assert.equal(r.status, 200)
    assert.equal(r.json.stock, 7)
    assert.equal((await api('PATCH', `/api/admin/products/${id}`, { body: {} })).status, 400)
  })

  it('vendas: registra, baixa estoque, recusa excesso e desfaz devolvendo', async () => {
    const sale = await api('POST', '/api/admin/sales', { body: { productId: id, quantity: 3, customer: 'teste-cliente' } })
    assert.equal(sale.status, 201, JSON.stringify(sale.json))
    assert.equal(sale.json.quantity, 3)
    assert.equal(sale.json.total, sale.json.unitPrice * 3)
    assert.equal((await api('GET', `/api/admin/products/${id}`)).json.stock, 4)

    const over = await api('POST', '/api/admin/sales', { body: { productId: id, quantity: 99, customer: 'teste-cliente' } })
    assert.equal(over.status, 409)
    assert.equal((await api('GET', `/api/admin/products/${id}`)).json.stock, 4) // nada mudou

    const stats = await api('GET', '/api/admin/sales/stats')
    assert.equal(stats.status, 200)
    assert.ok(stats.json.itemsToday >= 3)

    const undo = await api('POST', `/api/admin/sales/${sale.json.id}/undo`)
    assert.equal(undo.status, 200)
    assert.equal((await api('GET', `/api/admin/products/${id}`)).json.stock, 7)
    assert.equal((await api('POST', `/api/admin/sales/${sale.json.id}/undo`)).status >= 400, true) // não desfaz duas vezes
  })

  it('produto com vendas não pode ser apagado (409); sem vendas, pode (204)', async () => {
    assert.equal((await api('DELETE', `/api/admin/products/${id}`)).status, 409)
    const tmp = await api('POST', '/api/admin/products', { body: payload({ name: 'Teste API Descartável' }) })
    assert.equal((await api('DELETE', `/api/admin/products/${tmp.json.id}`)).status, 204)
    assert.equal((await api('DELETE', `/api/admin/products/${tmp.json.id}`)).status, 404)
  })
})

describe('catálogo (admin)', () => {
  it('cria, renomeia, reordena e apaga categoria', async () => {
    const c = await api('POST', '/api/admin/catalog/categories', { body: { name: 'Teste API Cat' } })
    assert.equal(c.status, 201, JSON.stringify(c.json))
    const cid = c.json.id
    assert.equal((await api('POST', '/api/admin/catalog/categories', { body: { name: 'Teste API Cat' } })).status, 409)
    assert.equal((await api('PUT', `/api/admin/catalog/categories/${cid}`, { body: { name: 'Teste API Cat 2' } })).status, 200)
    assert.equal((await api('DELETE', `/api/admin/catalog/categories/${cid}`)).status, 204)
  })

  it('categoria em uso não pode ser apagada (409) e :kind inválido é recusado', async () => {
    assert.equal((await api('DELETE', '/api/admin/catalog/categories/1')).status, 409)
    assert.equal((await api('POST', '/api/admin/catalog/usuarios', { body: { name: 'x' } })).status, 400)
  })
})

describe('bloqueio e logout', () => {
  it('logout invalida a sessão', async () => {
    const out = await api('POST', '/api/auth/logout')
    assert.equal(out.status, 204)
    assert.equal((await api('GET', '/api/auth/me')).status, 401)
  })

  it('5 senhas erradas bloqueiam o e-mail (429) mesmo com a senha certa', async () => {
    await query('DELETE FROM login_attempts WHERE email = $1', [EMAIL])
    for (let i = 0; i < 5; i++) {
      assert.equal((await api('POST', '/api/auth/login', { auth: false, body: { email: EMAIL, password: `errada-${i}-xxxx` } })).status, 401)
    }
    const blocked = await api('POST', '/api/auth/login', { auth: false, body: { email: EMAIL, password: PASSWORD } })
    assert.equal(blocked.status, 429)
    assert.ok(Number(blocked.headers.get('retry-after')) > 0)
  })
})
