import { readFileSync } from 'node:fs'
import { config } from './config.js'
import { query } from './db.js'

const SITE_NAME = 'Karol Glow'
const DEFAULT_TITLE = 'Karol Glow | Cosméticos e beleza'
const DEFAULT_DESC =
  'Karol Glow: cosméticos e produtos de beleza selecionados para cuidar da pele e realçar o seu brilho. Conheça a linha e peça já.'

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const clip = (s, n) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim()
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t
}

// Origem pública do site: usa o Host da requisição só se for um domínio autorizado
// (CORS_ORIGINS); senão cai no primeiro autorizado. Evita injeção por cabeçalho Host.
export function siteUrl(req) {
  const origin = `${req.protocol}://${req.get('host')}`
  const allowed = config.corsOrigins.filter((o) => o.startsWith('https://') || o.startsWith('http://'))
  if (allowed.includes(origin)) return origin
  // atrás do proxy o protocolo já vem correto (trust proxy); tolera http/https do mesmo host
  const host = req.get('host')
  const sameHost = allowed.find((o) => o.replace(/^https?:\/\//, '') === host)
  return sameHost || allowed[0] || origin
}

export function loadTemplate(publicDir) {
  return readFileSync(`${publicDir}/index.html`, 'utf8')
}

function metaBlock({ url, title, description, image, type = 'website' }) {
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="pt_BR" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
  ].join('\n    ')
}

// Dados do produto para a pré-visualização do link (null se não existir/estiver inativo)
async function productPreview(id) {
  if (!/^\d{1,12}$/.test(id)) return null
  const { rows } = await query(
    `SELECT p.name, p.description, p.price, p.promo_price,
            (SELECT url FROM product_images i WHERE i.product_id = p.id ORDER BY position LIMIT 1) AS image
       FROM products p WHERE p.id = $1 AND p.is_active`,
    [id],
  )
  return rows[0] || null
}

const brl = (n) => Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Troca o bloco de metadados do index.html (entre os marcadores) por tags da página pedida
export async function renderIndex(template, req) {
  const base = siteUrl(req)
  const path = req.path.replace(/\/+$/, '') || '/'
  let meta = {
    url: `${base}${path === '/' ? '/' : path}`,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
    image: `${base}/og-card.jpg`,
  }

  if (path === '/produtos') {
    meta = { ...meta, title: `Produtos | ${SITE_NAME}`, description: 'Veja todos os produtos da Karol Glow: skincare, maquiagem e cuidados para o seu dia a dia.' }
  } else if (/^\/produtos\/[^/]+$/.test(path)) {
    try {
      const p = await productPreview(path.split('/')[2])
      if (p) {
        const price = p.promo_price ?? p.price
        meta = {
          ...meta,
          type: 'product',
          title: `${p.name} | ${SITE_NAME}`,
          description: clip(`${brl(price)}. ${p.description || DEFAULT_DESC}`, 200),
          image: p.image && /^https:\/\//.test(p.image) ? p.image : meta.image,
        }
      }
    } catch (err) {
      console.error('seo: falha ao ler produto:', err.message) // cai nas tags padrão
    }
  } else if (path === '/login' || path.startsWith('/admin')) {
    meta = { ...meta, title: `Painel | ${SITE_NAME}`, description: DEFAULT_DESC }
  }

  return template.replace(/<!--seo-->[\s\S]*?<!--\/seo-->/, `${metaBlock(meta)}`)
}

export function robotsTxt(req) {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /login',
    'Disallow: /api/',
    '',
    `Sitemap: ${siteUrl(req)}/sitemap.xml`,
    '',
  ].join('\n')
}

export async function sitemapXml(req) {
  const base = siteUrl(req)
  const urls = [{ loc: `${base}/` }, { loc: `${base}/produtos` }]
  const { rows } = await query('SELECT id, updated_at FROM products WHERE is_active ORDER BY id LIMIT 5000')
  for (const r of rows) urls.push({ loc: `${base}/produtos/${r.id}`, lastmod: new Date(r.updated_at).toISOString() })
  const body = urls
    .map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}
