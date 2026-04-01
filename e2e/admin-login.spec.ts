import { test, expect } from '@playwright/test'

test.describe('Admin login', function() {
  test('formulaire email / mot de passe visible', async function({ page }) {
    await page.goto('/admin/login')
    await expect(page.getByRole('heading', { name: /Mon espace/i })).toBeVisible()
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible()
  })

  test('connexion E2E si E2E_ADMIN_EMAIL et E2E_ADMIN_PASSWORD', async function({ page }) {
    var email = process.env.E2E_ADMIN_EMAIL
    var password = process.env.E2E_ADMIN_PASSWORD
    if (!email || !password) {
      test.skip()
      return
    }
    await page.goto('/admin/login')
    await page.getByRole('textbox', { name: /email/i }).fill(email)
    await page.locator('input[type="password"]').fill(password)
    await page.getByRole('button', { name: /Se connecter/i }).click()
    await expect(page).toHaveURL(/\/admin\/?$/, { timeout: 20000 })
  })
})
