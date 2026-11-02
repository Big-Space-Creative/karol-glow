// Popula o catálogo com os produtos de exemplo da interface.
// Idempotente: rodar de novo não duplica produtos nem ligações.
// Uso: npm run seed   (rode depois de npm run migrate)
import pg from 'pg'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Defina DATABASE_URL (veja server/.env.example).')
  process.exit(1)
}

const description =
  'Fórmula leve, de rápida absorção, pensada para a rotina real e para realçar o seu brilho natural.'

const items = [
  ['Sérum Iluminador', 'Rosto', 129.9, 'Novo'],
  ['Hidratante Facial', 'Rosto', 89.9, 'Mais vendido'],
  ['Gel de Limpeza', 'Rosto', 59.9, ''],
  ['Protetor Solar FPS 50', 'Rosto', 79.9, 'Mais vendido'],
  ['Óleo Corporal', 'Corpo', 74.9, ''],
  ['Esfoliante Corporal', 'Corpo', 64.9, 'Novo'],
  ['Loção Hidratante', 'Corpo', 54.9, ''],
  ['Máscara Capilar', 'Cabelo', 89.9, 'Mais vendido'],
  ['Shampoo Nutritivo', 'Cabelo', 49.9, ''],
  ['Máscara de Cílios', 'Maquiagem', 59.9, ''],
  ['Batom Cremoso', 'Maquiagem', 44.9, 'Novo'],
  ['Kit Cuidado Diário', 'Kits', 199.9, 'Mais vendido'],
]

const client = new pg.Client({ connectionString: url, ssl: process.env.DB_SSL === 'true' })
await client.connect()

try {
  await client.query('BEGIN')

  const skinType = await client.query('SELECT id FROM skin_types WHERE name = $1', ['Todos os tipos'])
  if (skinType.rowCount === 0) {
    throw new Error("Tipo de pele 'Todos os tipos' não encontrado. Rode npm run migrate antes do seed.")
  }
  const skinTypeId = skinType.rows[0].id

  for (let i = 0; i < items.length; i++) {
    const [name, category, price, tag] = items[i]
    const sku = `KG-${String(i + 1).padStart(4, '0')}`
    const brandName = `Marca 0${(i % 5) + 1}`

    const categoryRow = await client.query('SELECT id FROM categories WHERE name = $1', [category])
    if (categoryRow.rowCount === 0) {
      throw new Error(`Categoria '${category}' não encontrada. Rode npm run migrate antes do seed.`)
    }

    const brandRow = await client.query('SELECT id FROM brands WHERE name = $1', [brandName])
    if (brandRow.rowCount === 0) {
      throw new Error(`Marca '${brandName}' não encontrada. Rode npm run migrate antes do seed.`)
    }

    const promoPrice = i % 4 === 1 ? Math.round(price * 0.9 * 10) / 10 : null
    const stock = 10 + i * 3
    const isActive = i !== 8
    const isFeatured = i % 3 === 0
    const isBestSeller = tag === 'Mais vendido'

    const inserted = await client.query(
      `INSERT INTO products
         (sku, name, description, category_id, brand_id, price, promo_price, stock, volume, tag,
          is_active, is_featured, is_best_seller)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (sku) DO NOTHING
       RETURNING id`,
      [
        sku,
        name,
        description,
        categoryRow.rows[0].id,
        brandRow.rows[0].id,
        price,
        promoPrice,
        stock,
        '30 ml',
        tag === '' ? null : tag,
        isActive,
        isFeatured,
        isBestSeller,
      ]
    )

    let productId = inserted.rows[0]?.id
    if (!productId) {
      const existing = await client.query('SELECT id FROM products WHERE sku = $1', [sku])
      productId = existing.rows[0].id
    }

    await client.query(
      `INSERT INTO product_skin_types (product_id, skin_type_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [productId, skinTypeId]
    )
  }

  await client.query('COMMIT')
  console.log(`Seed concluído: ${items.length} produtos verificados.`)
} catch (err) {
  await client.query('ROLLBACK').catch(() => {})
  console.error('Falha ao popular o banco:', err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
