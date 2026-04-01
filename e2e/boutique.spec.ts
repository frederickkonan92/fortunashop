import { test, expect } from '@playwright/test'

// Slug démo documenté (CLAUDE.md) — selon les données Supabase, catalogue ou « introuvable »
test.describe('Boutique publique', function() {
  test('page boutique-test charge un état cohérent', async function({ page }) {
    await page.goto('/boutique/boutique-test')
    var body = page.locator('body')
    await expect(body).toBeVisible()
    var creations = page.getByText(/Nos créations/i)
    var missing = page.getByText(/introuvable|hors ligne/i)
    await expect(creations.or(missing).first()).toBeVisible({ timeout: 15000 })
  })
})
