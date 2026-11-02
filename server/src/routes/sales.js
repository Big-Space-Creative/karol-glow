import { Router } from 'express'
import { z } from 'zod'
import { query, tx } from '../db.js'
import { conflict, notFound } from '../lib/errors.js'

export const adminRouter = Router()

// Helper de formatação de linha para objeto JSON camelCase
const toSale = (r) => ({
  id: r.id,
  productId: r.product_id,
  productName: r.product_name,
  sku: r.sku,
  variation: r.variation ?? null,
  quantity: r.quantity,
  unitPrice: r.unit_price,
  total: r.total,
  customer: r.customer,
  createdAt: r.created_at,
  undoneAt: r.undone_at,
})

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

const listSalesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  date: z
    .string()
    .trim()
    .refine((d) => d === 'today' || dateRegex.test(d), 'Data deve ser "today" ou no formato YYYY-MM-DD')
    .optional(),
  includeUndone: z
    .enum(['true', 'false', '1', '0'])
    .transform((v) => v === 'true' || v === '1')
    .default('false'),
})

const createSaleSchema = z.object({
  productId: z.coerce.number().int().positive('ID do produto inválido'),
  variationId: z.coerce.number().int().positive('ID da variação inválido').nullable().optional(),
  quantity: z
    .number()
    .int()
    .min(1, 'Quantidade mínima é 1')
    .max(1000, 'Quantidade máxima é 1000')
    .default(1),
  customer: z
    .string()
    .trim()
    .max(80, 'Nome do cliente deve ter no máximo 80 caracteres')
    .optional()
    .transform((v) => (v && v.length > 0 ? v : 'Balcão')),
})

// ---------------------------------------------------------------------------
// Rotas Admin de Vendas (/api/admin/sales)
// ---------------------------------------------------------------------------

// Listagem de vendas com filtros e paginação
adminRouter.get('/', async (req, res) => {
  const { page, perPage, date, includeUndone } = listSalesSchema.parse(req.query)

  const where = []
  const params = []

  if (!includeUndone) {
    where.push('s.undone_at IS NULL')
  }

  if (date === 'today') {
    where.push(
      "(s.created_at AT TIME ZONE 'America/Sao_Paulo')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date",
    )
  } else if (date) {
    params.push(date)
    where.push(`(s.created_at AT TIME ZONE 'America/Sao_Paulo')::date = $${params.length}::date`)
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const offset = (page - 1) * perPage

  const [itemsRes, countRes] = await Promise.all([
    query(
      `SELECT s.id, s.product_id, s.variation_id, s.quantity, s.unit_price, s.total,
              s.customer, s.created_at, s.undone_at,
              p.name AS product_name,
              COALESCE(pv.sku, p.sku) AS sku,
              pv.label AS variation
         FROM sales s
         JOIN products p ON p.id = s.product_id
         LEFT JOIN product_variations pv ON pv.id = s.variation_id
         ${whereClause}
        ORDER BY s.created_at DESC
        LIMIT ${perPage} OFFSET ${offset}`,
      params,
    ),
    query(
      `SELECT count(*)::int AS total
         FROM sales s
         ${whereClause}`,
      params,
    ),
  ])

  res.json({
    items: itemsRes.rows.map(toSale),
    total: countRes.rows[0]?.total ?? 0,
    page,
    perPage,
  })
})

// Indicadores e estatísticas do dia e mês
adminRouter.get('/stats', async (_req, res) => {
  const [statsRes, bestSellerRes] = await Promise.all([
    query(
      `SELECT COALESCE(sum(s.quantity), 0)::int AS items_today,
              COALESCE(sum(s.total), 0) AS revenue_today,
              count(*)::int AS sales_today
         FROM sales s
        WHERE s.undone_at IS NULL
          AND (s.created_at AT TIME ZONE 'America/Sao_Paulo')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date`,
    ),
    query(
      `SELECT s.product_id,
              p.name,
              sum(s.quantity)::int AS quantity
         FROM sales s
         JOIN products p ON p.id = s.product_id
        WHERE s.undone_at IS NULL
          AND date_trunc('month', s.created_at AT TIME ZONE 'America/Sao_Paulo') = date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')
        GROUP BY s.product_id, p.name
        ORDER BY quantity DESC, s.product_id ASC
        LIMIT 1`,
    ),
  ])

  const statsRow = statsRes.rows[0]
  const bestSellerRow = bestSellerRes.rows[0]

  res.json({
    itemsToday: Number(statsRow?.items_today ?? 0),
    revenueToday: Number(statsRow?.revenue_today ?? 0),
    salesToday: Number(statsRow?.sales_today ?? 0),
    bestSellerMonth: bestSellerRow
      ? {
          productId: bestSellerRow.product_id,
          name: bestSellerRow.name,
          quantity: bestSellerRow.quantity,
        }
      : null,
  })
})

// Registrar nova venda
adminRouter.post('/', async (req, res) => {
  const body = createSaleSchema.parse(req.body)
  const adminId = req.admin?.id ?? null

  const sale = await tx(async (client) => {
    // 1. Trava e valida o produto
    const { rows: pRows } = await client.query(
      `SELECT id, name, sku, price, promo_price, stock, is_active
         FROM products
        WHERE id = $1
          FOR UPDATE`,
      [body.productId],
    )

    const product = pRows[0]
    if (!product) throw notFound('Produto não encontrado')
    if (!product.is_active) throw conflict('Produto inativo não pode ser vendido')
    if (product.stock < body.quantity) throw conflict('Estoque insuficiente')

    let unitPrice = product.promo_price ?? product.price
    let finalSku = product.sku
    let variationLabel = null

    // 2. Se houver variação, trava e valida a variação vinculada ao produto
    if (body.variationId) {
      const { rows: vRows } = await client.query(
        `SELECT id, product_id, sku, label, price, stock
           FROM product_variations
          WHERE id = $1 AND product_id = $2
            FOR UPDATE`,
        [body.variationId, body.productId],
      )

      const variation = vRows[0]
      if (!variation) throw conflict('Variação não encontrada para este produto')
      if (variation.stock < body.quantity) throw conflict('Estoque insuficiente')

      // Baixa o estoque da variação (o estoque geral do produto é baixado automaticamente pelo gatilho do banco)
      const { rowCount } = await client.query(
        `UPDATE product_variations
            SET stock = stock - $2
          WHERE id = $1 AND stock >= $2`,
        [body.variationId, body.quantity],
      )

      if (!rowCount) throw conflict('Estoque insuficiente')

      unitPrice = variation.price
      finalSku = variation.sku
      variationLabel = variation.label
    }

    // 3. Insere a venda (o gatilho apply_sale_stock baixa o estoque do produto)
    const { rows: saleRows } = await client.query(
      `INSERT INTO sales (product_id, variation_id, quantity, unit_price, customer, sold_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, product_id, variation_id, quantity, unit_price, total, customer, created_at, undone_at`,
      [body.productId, body.variationId ?? null, body.quantity, unitPrice, body.customer, adminId],
    )

    const newSale = saleRows[0]

    return {
      id: newSale.id,
      productId: newSale.product_id,
      productName: product.name,
      sku: finalSku,
      variation: variationLabel,
      quantity: newSale.quantity,
      unitPrice: newSale.unit_price,
      total: newSale.total,
      customer: newSale.customer,
      createdAt: newSale.created_at,
      undoneAt: newSale.undone_at,
    }
  })

  res.status(201).json(sale)
})

// Desfazer venda (devolve o estoque)
adminRouter.post('/:id/undo', async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id)

  const updatedSale = await tx(async (client) => {
    // 1. Busca e trava a venda
    const { rows: sRows } = await client.query(
      `SELECT s.id, s.product_id, s.variation_id, s.quantity, s.unit_price, s.total,
              s.customer, s.created_at, s.undone_at,
              p.name AS product_name,
              COALESCE(pv.sku, p.sku) AS sku,
              pv.label AS variation
         FROM sales s
         JOIN products p ON p.id = s.product_id
         LEFT JOIN product_variations pv ON pv.id = s.variation_id
        WHERE s.id = $1
          FOR UPDATE OF s`,
      [id],
    )

    const sale = sRows[0]
    if (!sale) throw notFound('Venda não encontrada')
    if (sale.undone_at !== null) throw conflict('Esta venda já foi desfeita')

    // 2. Marca a venda como desfeita (o gatilho apply_sale_stock devolve o estoque do produto)
    const { rows: updatedRows } = await client.query(
      `UPDATE sales
          SET undone_at = now()
        WHERE id = $1 AND undone_at IS NULL
        RETURNING undone_at`,
      [id],
    )

    // 3. Devolve o estoque da variação se houver
    if (sale.variation_id) {
      await client.query(
        `UPDATE product_variations
            SET stock = stock + $2
          WHERE id = $1`,
        [sale.variation_id, sale.quantity],
      )
    }

    return {
      id: sale.id,
      productId: sale.product_id,
      productName: sale.product_name,
      sku: sale.sku,
      variation: sale.variation ?? null,
      quantity: sale.quantity,
      unitPrice: sale.unit_price,
      total: sale.total,
      customer: sale.customer,
      createdAt: sale.created_at,
      undoneAt: updatedRows[0].undone_at,
    }
  })

  res.json(updatedSale)
})
