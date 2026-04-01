import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'

describe('POST /api/recommendations (smoke validation)', function() {
  it('400 si shop_id manquant — sans initialiser Supabase / Anthropic', async function() {
    var { POST } = await import('@/app/api/recommendations/route')
    var req = new NextRequest('http://localhost/api/recommendations', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    var res = await POST(req)
    expect(res.status).toBe(400)
    var json = await res.json()
    expect(json.error).toMatch(/shop_id/)
  })
})
