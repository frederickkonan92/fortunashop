import { test, expect } from '@playwright/test'

test.describe('Landing fortunashop', function() {
  test('affiche le hero et la section contact', async function({ page }) {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /boutique professionnelle/i })).toBeVisible()
    await expect(page.locator('#contact')).toBeVisible()
    await page.locator('#contact').scrollIntoViewIfNeeded()
    await expect(page.getByPlaceholder(/Aminata|Koné|nom/i).first()).toBeVisible()
  })
})
