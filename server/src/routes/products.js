import { Router } from 'express'
import { z } from 'zod'
import { query, tx } from '../db.js'
import { notFound } from '../lib/errors.js'
import { requireAdmin } from '../middleware/auth.js'

// ---------------------------------------------------------------------------
// Rotas de produtos.
//   Públicas  (router `publicRouter`, montado em /api/products)
//   Admin     (router `adminRouter`,  montado em /api/admin/products)
// Este arquivo é a REFERÊNCIA de padrão para as demais rotas: validação com zod,
// SQL parametrizado, transações em `tx`, respostas em camelCase.
// ---------------------------------------------------------------------------

export const publicRouter = Router()
export const adminRouter = Router()
adminRouter.use(requireAdmin)

// --- Seleção base + conversão linha -> objeto da API ------------------------

const BASE_SELECT = `
  SELECT p.id, p.sku, p.name, p.description, p.usage_instructions, p.ingredients, p.price, p.promo_price, p.stock, p.volume, p.tag,
         p.is_active, p.is_featured, p.is_best_seller, p.created_at, p.updated_at,
         p.category_id, c.name AS category, p.brand_id, b.name AS brand,
         COALESCE((SELECT array_agg(st.name ORDER BY st.position)
                     FROM product_skin_types pst JOIN skin_types st ON st.id = pst.skin_type_id
                    WHERE pst.product_id = p.id), '{}') AS skin_types,
         COALESCE((SELECT array_agg(pi.url ORDER BY pi.position)
                     FROM product_images pi WHERE pi.product_id = p.id), '{}') AS images,
         EXISTS (SELECT 1 FROM product_variations pv WHERE pv.product_id = p.id) AS has_variations
    FROM products p
    JOIN categories c ON c.id = p.category_id
    LEFT JOIN brands b ON b.id = p.brand_id`

const toProduct = (r) => ({
  id: r.id,
  sku: r.sku,
  name: r.name,
  description: r.description,
  usage: r.usage_instructions,
  ingredients: r.ingredients,
  categoryId: r.category_id,
  category: r.category,
  brandId: r.brand_id,
  brand: r.brand,
  price: r.price,
  promoPrice: r.promo_price,
  stock: r.stock,
  volume: r.volume,
  tag: r.tag,
  active: r.is_active,
  featured: r.is_featured,
  bestSeller: r.is_best_seller,
  skinTypes: r.skin_types,
  images: r.images,
  image: r.images[0] ?? '',
  hasVariations: r.has_variations,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

async function loadVariations(productId, client = { query }) {
  const { rows } = await client.query(
    `SELECT v.id, v.variation_type_id, vt.name AS type, v.label, v.sku, v.price, v.stock
       FROM product_variations v JOIN variation_types vt ON vt.id = v.variation_type_id
      WHERE v.product_id = $1 ORDER BY v.id`,
    [productId],
  )
  return rows.map((v) => ({ id: v.id, typeId: v.variation_type_id, type: v.type, label: v.label, sku: v.sku, price: v.price, stock: v.stock }))
}

async function findProduct(id, { onlyActive = false, client = { query } } = {}) {
  const { rows } = await client.query(`${BASE_SELECT} WHERE p.id = $1 ${onlyActive ? 'AND p.is_active' : ''}`, [id])
  if (!rows[0]) throw notFound('Produto não encontrado')
  return { ...toProduct(rows[0]), variations: await loadVariations(id, client) }
}

// --- Listagem com filtros ----------------------------------------------------

const csv = z.string().transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean))
const bool = z.enum(['true', 'false', '1', '0']).transform((v) => v === 'true' || v === '1')

const listSchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(60).optional(),
  brand: csv.optional(), // nomes separados por vírgula
  skin: csv.optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: bool.optional(),
  onSale: bool.optional(),
  featured: bool.optional(),
  bestSeller: bool.optional(),
  sort: z.enum(['best', 'low', 'high', 'recent', 'name', 'stock']).default('best'),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(12),
})

const SORTS = {
  best: 'p.is_best_seller DESC, p.id DESC',
  low: 'p.price ASC, p.id DESC',
  high: 'p.price DESC, p.id DESC',
  recent: 'p.id DESC',
  name: 'lower(p.name) ASC',
  stock: 'p.stock ASC, p.id DESC',
}

// Monta o WHERE com parâmetros ($n). `adminMode` inclui produtos inativos e busca por SKU.
function buildWhere(f, { adminMode = false, status } = {}) {
  const where = []
  const params = []
  const add = (sql, value) => {
    params.push(value)
    where.push(sql.replace('?', `$${params.length}`))
  }

  if (!adminMode) where.push('p.is_active')
  if (adminMode && status === 'active') where.push('p.is_active')
  if (adminMode && status === 'inactive') where.push('NOT p.is_active')
  if (f.q) {
    params.push(`%${f.q.replace(/[%_\\]/g, '\\$&')}%`)
    const i = params.length
    where.push(adminMode ? `(p.name ILIKE $${i} OR p.sku ILIKE $${i})` : `p.name ILIKE $${i}`)
  }
  if (f.category) add('c.name = ?', f.category)
  if (f.brand?.length) add('b.name = ANY(?)', f.brand)
  if (f.skin?.length) {
    add(`EXISTS (SELECT 1 FROM product_skin_types pst JOIN skin_types st ON st.id = pst.skin_type_id
                  WHERE pst.product_id = p.id AND st.name = ANY(?))`, f.skin)
  }
  if (f.minPrice !== undefined) add('p.price >= ?', f.minPrice)
  if (f.maxPrice !== undefined) add('p.price <= ?', f.maxPrice)
  if (f.inStock) where.push('p.stock > 0')
  if (f.onSale) where.push('p.promo_price IS NOT NULL')
  if (f.featured) where.push('p.is_featured')
  if (f.bestSeller) where.push('p.is_best_seller')
  return { sql: where.length ? `WHERE ${where.join(' AND ')}` : '', params }
}

async function list(filters, opts) {
  const { sql, params } = buildWhere(filters, opts)
  const offset = (filters.page - 1) * filters.perPage
  const [{ rows }, { rows: count }] = await Promise.all([
    query(`${BASE_SELECT} ${sql} ORDER BY ${SORTS[filters.sort]} LIMIT ${filters.perPage} OFFSET ${offset}`, params),
    query(`SELECT count(*)::int AS total FROM products p JOIN categories c ON c.id = p.category_id
            LEFT JOIN brands b ON b.id = p.brand_id ${sql}`, params),
  ])
  return { items: rows.map(toProduct), total: count[0].total, page: filters.page, perPage: filters.perPage }
}

// --- Públicas ------------------------------------------------------------------

publicRouter.get('/', async (req, res) => {
  res.json(await list(listSchema.parse(req.query)))
})

publicRouter.get('/:id', async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id)
  res.json(await findProduct(id, { onlyActive: true }))
})

// --- Admin -----------------------------------------------------------------------

adminRouter.get('/', async (req, res) => {
  const filters = listSchema.extend({ status: z.enum(['active', 'inactive']).optional() }).parse(req.query)
  res.json(await list(filters, { adminMode: true, status: filters.status }))
})

adminRouter.get('/:id', async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id)
  res.json(await findProduct(id))
})

const money = z.number().min(0).max(9_999_999.99)
const variationSchema = z.object({
  typeId: z.number().int().positive(),
  label: z.string().trim().min(1).max(60),
  sku: z.string().trim().min(1).max(40).optional(),
  price: money,
  stock: z.number().int().min(0).max(1_000_000),
})

const productSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    description: z.string().trim().max(5000).default(''),
    usage: z.string().trim().max(2000).default(''),
    ingredients: z.string().trim().max(3000).default(''),
    categoryId: z.number().int().positive(),
    brandId: z.number().int().positive().nullable().default(null),
    price: money,
    promoPrice: money.nullable().default(null),
    stock: z.number().int().min(0).max(1_000_000).default(0),
    volume: z.string().trim().max(40).nullable().default(null),
    tag: z.string().trim().max(40).nullable().default(null),
    active: z.boolean().default(true),
    featured: z.boolean().default(false),
    bestSeller: z.boolean().default(false),
    skinTypeIds: z.array(z.number().int().positive()).max(20).default([]),
    images: z.array(z.string().trim().max(500)).max(10).default([]),
    variations: z.array(variationSchema).max(50).default([]),
  })
  .refine((p) => p.promoPrice === null || p.promoPrice < p.price, {
    path: ['promoPrice'],
    message: 'O preço promocional deve ser menor que o preço',
  })

// Imagens: só http(s) ou caminho do próprio site (nada de javascript:, data: etc.)
const safeImage = (u) => /^(https?:\/\/|\/)/i.test(u)

async function writeChildren(client, productId, sku, p) {
  if (p.images.some((u) => !safeImage(u))) {
    const e = new Error('imagem inválida')
    e.code = '22P02'
    throw e
  }
  await client.query('DELETE FROM product_skin_types WHERE product_id = $1', [productId])
  if (p.skinTypeIds.length) {
    await client.query(
      'INSERT INTO product_skin_types (product_id, skin_type_id) SELECT $1, unnest($2::int[])',
      [productId, p.skinTypeIds],
    )
  }
  await client.query('DELETE FROM product_images WHERE product_id = $1', [productId])
  for (const [i, url] of p.images.entries()) {
    await client.query('INSERT INTO product_images (product_id, url, position) VALUES ($1, $2, $3)', [productId, url, i])
  }
  await client.query('DELETE FROM product_variations WHERE product_id = $1', [productId])
  for (const [i, v] of p.variations.entries()) {
    await client.query(
      `INSERT INTO product_variations (product_id, variation_type_id, label, sku, price, stock)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [productId, v.typeId, v.label, v.sku ?? `${sku}-${i + 1}`, v.price, v.stock],
    )
  }
}

adminRouter.post('/', async (req, res) => {
  const p = productSchema.parse(req.body)
  const id = await tx(async (client) => {
    const { rows: seq } = await client.query("SELECT nextval(pg_get_serial_sequence('products', 'id')) AS id")
    const newId = Number(seq[0].id)
    const sku = `KG-${String(newId).padStart(4, '0')}`
    await client.query(
      `INSERT INTO products (id, sku, name, description, category_id, brand_id, price, promo_price, stock,
                             volume, tag, is_active, is_featured, is_best_seller, usage_instructions, ingredients)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [newId, sku, p.name, p.description, p.categoryId, p.brandId, p.price, p.promoPrice, p.stock, p.volume, p.tag, p.active, p.featured, p.bestSeller, p.usage, p.ingredients],
    )
    await writeChildren(client, newId, sku, p)
    return newId
  })
  res.status(201).json(await findProduct(id))
})

adminRouter.put('/:id', async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id)
  const p = productSchema.parse(req.body)
  await tx(async (client) => {
    const { rows } = await client.query(
      `UPDATE products SET name=$2, description=$3, category_id=$4, brand_id=$5, price=$6, promo_price=$7,
              stock=$8, volume=$9, tag=$10, is_active=$11, is_featured=$12, is_best_seller=$13,
              usage_instructions=$14, ingredients=$15
        WHERE id = $1 RETURNING sku`,
      [id, p.name, p.description, p.categoryId, p.brandId, p.price, p.promoPrice, p.stock, p.volume, p.tag, p.active, p.featured, p.bestSeller, p.usage, p.ingredients],
    )
    if (!rows[0]) throw notFound('Produto não encontrado')
    await writeChildren(client, id, rows[0].sku, p)
  })
  res.json(await findProduct(id))
})

// Alterações rápidas da lista (ativar/inativar, destaque)
adminRouter.patch('/:id', async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id)
  const body = z
    .object({ active: z.boolean(), featured: z.boolean(), bestSeller: z.boolean(), stock: z.number().int().min(0).max(1_000_000) })
    .partial()
    .refine((b) => Object.keys(b).length > 0, 'Informe ao menos um campo')
    .parse(req.body)
  const map = { active: 'is_active', featured: 'is_featured', bestSeller: 'is_best_seller', stock: 'stock' }
  const sets = Object.keys(body).map((k, i) => `${map[k]} = $${i + 2}`)
  const { rowCount } = await query(`UPDATE products SET ${sets.join(', ')} WHERE id = $1`, [id, ...Object.values(body)])
  if (!rowCount) throw notFound('Produto não encontrado')
  res.json(await findProduct(id))
})

adminRouter.delete('/:id', async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id)
  // vendas referenciam o produto (ON DELETE RESTRICT): quem já vendeu deve ser inativado, não apagado
  const { rowCount } = await query('DELETE FROM products WHERE id = $1', [id])
  if (!rowCount) throw notFound('Produto não encontrado')
  res.status(204).end()
})
