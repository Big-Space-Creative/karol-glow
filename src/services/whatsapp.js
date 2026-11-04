// Mensagem e link do WhatsApp (wa.me) para a sacola e para os contatos do rodapé.

export const DEFAULT_MESSAGE = 'Olá vim pelo seu site! Poderia me mostrar alguns produtos'

const brl = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/ /g, ' ')

// Itens da sacola em texto. `items`: [{ name, price, qty }]
export function buildOrderMessage(items) {
  if (!items.length) return DEFAULT_MESSAGE
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const lines = items.map((i) => `• ${i.qty}x ${i.name} — ${brl(i.price * i.qty)}`)
  return [
    'Olá! Vim pelo site da Karol Glow e gostaria de comprar:',
    '',
    ...lines,
    '',
    `Total: ${brl(total)}`,
    '',
    'Pode me ajudar a finalizar o pedido?',
  ].join('\n')
}

export function whatsappUrl(phone, text) {
  const digits = String(phone || '').replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

// 558894045293 -> +55 88 9404-5293 (aceita 8 ou 9 dígitos depois do DDD)
export function formatPhone(phone) {
  const d = String(phone || '').replace(/\D/g, '')
  const m = d.match(/^55(\d{2})(\d{4,5})(\d{4})$/)
  return m ? `+55 ${m[1]} ${m[2]}-${m[3]}` : phone || ''
}
