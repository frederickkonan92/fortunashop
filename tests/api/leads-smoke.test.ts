import { describe, it, expect } from 'vitest'

describe('POST /api/leads (smoke validation)', function() {
  it('400 si nom ou WhatsApp manquant — sans appeler Supabase', async function() {
    var { POST } = await import('@/app/api/leads/route')
    var res = await POST(
      new Request('http://localhost/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: '', whatsapp: '' }),
      })
    )
    expect(res.status).toBe(400)
    var json = await res.json()
    expect(json.error).toBeTruthy()
  })
})
