import { Router } from 'express'
import { z } from 'zod'
import { query, tx } from '../db.js'
import { badRequest, conflict, notFound } from '../lib/errors.js'

export const publicRouter = Router()
export const adminRouter = Router()

// Mapeamento estático e seguro dos tipos de catálogo para tabelas e checagens
const CATALOG_CONFIG = {
  categories: {
    table: 'categories',
    hasPosition: true,
    checkUsageQuery: 'SELECT 1 FROM products WHERE category_id = $1 LIMIT 1',
  },
  brands: {
    table: 'brands',
    hasPosition: false,
    checkUsageQuery: 'SELECT 1 FROM products WHERE brand_id = $1 LIMIT 1',
  },
  'skin-types': {
    table: 'skin_types',
    hasPosition: true,
    checkUsageQuery: 'SELECT 1 FROM product_skin_types WHERE skin_type_id = $1 LIMIT 1',
  },
  'variation-types': {
    table: 'variation_types',
    hasPosition: false,
    checkUsageQuery: 'SELECT 1 FROM product_variations WHERE variation_type_id = $1 LIMIT 1',
  },
}

const kindSchema = z.enum(['categories', 'brands', 'skin-types', 'variation-types'])

const nameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(60, 'Nome deve ter no máximo 60 caracteres'),
})

const orderBodySchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1, 'A lista de IDs não pode ser vazia').max(500),
})

// ---------------------------------------------------------------------------
// Rotas Públicas (/api/catalog)
// ---------------------------------------------------------------------------

publicRouter.get('/', async (_req, res) => {
  const [categoriesRes, brandsRes, skinTypesRes, variationTypesRes] = await Promise.all([
    query(
      `SELECT c.id, c.name, c.position,
              (SELECT count(*)::int FROM products p WHERE p.category_id = c.id AND p.is_active) AS product_count
         FROM categories c
        ORDER BY c.position ASC, c.id ASC`,
    ),
    query(
      `SELECT b.id, b.name,
              (SELECT count(*)::int FROM products p WHERE p.brand_id = b.id AND p.is_active) AS product_count
         FROM brands b
        ORDER BY lower(b.name) ASC, b.id ASC`,
    ),
    query(
      `SELECT st.id, st.name, st.position,
              (SELECT count(DISTINCT p.id)::int
                 FROM product_skin_types pst
                 JOIN products p ON p.id = pst.product_id
                WHERE pst.skin_type_id = st.id AND p.is_active) AS product_count
         FROM skin_types st
        ORDER BY st.position ASC, st.id ASC`,
    ),
    query(
      `SELECT vt.id, vt.name
         FROM variation_types vt
        ORDER BY vt.id ASC`,
    ),
  ])

  res.json({
    categories: categoriesRes.rows.map((r) => ({
      id: r.id,
      name: r.name,
      position: r.position,
      productCount: r.product_count,
    })),
    brands: brandsRes.rows.map((r) => ({
      id: r.id,
      name: r.name,
      productCount: r.product_count,
    })),
    skinTypes: skinTypesRes.rows.map((r) => ({
      id: r.id,
      name: r.name,
      position: r.position,
      productCount: r.product_count,
    })),
    variationTypes: variationTypesRes.rows.map((r) => ({
      id: r.id,
      name: r.name,
    })),
  })
})

// ---------------------------------------------------------------------------
// Rotas Admin (/api/admin/catalog)
// ---------------------------------------------------------------------------

// Reordenação de categorias e tipos de pele
adminRouter.put('/:kind/order', async (req, res) => {
  const kind = kindSchema.parse(req.params.kind)
  if (kind !== 'categories' && kind !== 'skin-types') {
    throw badRequest('Reordenação permitida apenas para categorias e tipos de pele')
  }

  const { ids } = orderBodySchema.parse(req.body)
  const config = CATALOG_CONFIG[kind]

  await tx(async (client) => {
    for (const [position, id] of ids.entries()) {
      await client.query(`UPDATE ${config.table} SET position = $1 WHERE id = $2`, [position, id])
    }
  })

  res.json({ status: 'ok' })
})

// Cadastro de novo item no catálogo
adminRouter.post('/:kind', async (req, res) => {
  const kind = kindSchema.parse(req.params.kind)
  const { name } = nameSchema.parse(req.body)
  const config = CATALOG_CONFIG[kind]

  let result
  if (config.hasPosition) {
    result = await query(
      `INSERT INTO ${config.table} (name, position)
       VALUES ($1, COALESCE((SELECT max(position) + 1 FROM ${config.table}), 0))
       RETURNING id, name, position`,
      [name],
    )
  } else {
    result = await query(
      `INSERT INTO ${config.table} (name)
       VALUES ($1)
       RETURNING id, name`,
      [name],
    )
  }

  res.status(201).json(result.rows[0])
})

// Atualização de nome de um item
adminRouter.put('/:kind/:id', async (req, res) => {
  const kind = kindSchema.parse(req.params.kind)
  const id = z.coerce.number().int().positive().parse(req.params.id)
  const { name } = nameSchema.parse(req.body)
  const config = CATALOG_CONFIG[kind]

  const returningCols = config.hasPosition ? 'id, name, position' : 'id, name'
  const { rows } = await query(
    `UPDATE ${config.table} SET name = $2 WHERE id = $1 RETURNING ${returningCols}`,
    [id, name],
  )

  if (!rows[0]) throw notFound('Item do catálogo não encontrado')

  res.json(rows[0])
})

// Exclusão de um item
adminRouter.delete('/:kind/:id', async (req, res) => {
  const kind = kindSchema.parse(req.params.kind)
  const id = z.coerce.number().int().positive().parse(req.params.id)
  const config = CATALOG_CONFIG[kind]

  // Verifica se existem produtos vinculados antes de excluir
  const { rows: inUse } = await query(config.checkUsageQuery, [id])
  if (inUse.length > 0) {
    throw conflict(
      'Não é possível excluir este item pois existem produtos vinculados a ele. Mova os produtos para outro item antes de excluir.',
    )
  }

  const { rowCount } = await query(`DELETE FROM ${config.table} WHERE id = $1`, [id])
  if (!rowCount) throw notFound('Item do catálogo não encontrado')

  res.status(204).end()
})
