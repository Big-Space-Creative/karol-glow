import { Router } from 'express'
import { z } from 'zod'
import { query, tx } from '../db.js'

export const publicRouter = Router()
export const adminRouter = Router()

// Telefone: guarda só dígitos com DDI (55). Aceita "(88) 99404-5293", "+55 88 9404-5293" etc.
const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ''))
  .transform((d) => (d.length === 10 || d.length === 11 ? `55${d}` : d))
  .refine((d) => /^55\d{10,11}$/.test(d), 'Telefone inválido. Use DDD + número, ex.: (88) 99404-5293.')

// Instagram: guarda só o usuário. Aceita "@usuario" ou o link do perfil.
const instagramSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/[/?#].*$/, ''))
  .refine((v) => /^[A-Za-z0-9._]{1,30}$/.test(v), 'Usuário do Instagram inválido.')

const settingsSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido.').max(120),
  phone: phoneSchema,
  instagram: instagramSchema,
  shipping: z.string().trim().max(1500).default(''),
})

async function readSettings(client = { query }) {
  const { rows } = await client.query("SELECT key, value FROM site_settings WHERE key IN ('email','phone','instagram','shipping')")
  const out = { email: '', phone: '', instagram: '', shipping: '' }
  for (const r of rows) out[r.key] = r.value
  return out
}

// Público: contato mostrado no rodapé e número do WhatsApp da sacola
publicRouter.get('/', async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=30')
  res.json(await readSettings())
})

adminRouter.get('/', async (_req, res) => {
  res.json(await readSettings())
})

adminRouter.put('/', async (req, res) => {
  const data = settingsSchema.parse(req.body)
  await tx(async (client) => {
    for (const [key, value] of Object.entries(data)) {
      await client.query(
        `INSERT INTO site_settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
        [key, value],
      )
    }
  })
  res.json(data)
})
