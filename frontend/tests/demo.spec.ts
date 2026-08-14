import { expect, test } from '@playwright/test'

test('loads the research shell without downloading the model', async ({ page }) => {
  const modelRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/models/')) modelRequests.push(request.url())
  })
  await page.goto('./')
  await expect(page).toHaveTitle(/Além das Palavras/)
  await expect(page.getByRole('heading', { name: /Veja a persuasão/ })).toBeVisible()
  await expect(page.getByText('Não baixado', { exact: true })).toBeVisible()
  await page.waitForTimeout(500)
  expect(modelRequests).toHaveLength(0)
})

test('supports examples, adaptive themes and keyboard tour controls', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: /Contraste em duas sentenças/ }).click()
  await expect(page.locator('#analysis-text')).toHaveValue(/bandido é lixo/)
  await page.getByRole('button', { name: /Tema:/ }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.getByRole('button', { name: 'Guia interativo' }).click()
  await expect(page.getByRole('dialog', { name: /O que este detector faz/ })).toBeVisible()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('dialog', { name: /Comece pelo texto/ })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('segments realistic Portuguese prose before inference', async ({ page }) => {
  await page.goto('./')
  await page.locator('#analysis-text').fill('O relatório saiu hoje. Isto é um absurdo! E agora?')
  await expect(page.getByText('3 sentenças')).toBeVisible()
})

test('runs the real model and reuses it offline', async ({ page, context }) => {
  test.setTimeout(300_000)
  test.skip(!process.env.RUN_MODEL_E2E, 'Set RUN_MODEL_E2E=1 for the full 42 MB browser-runtime test.')
  await page.goto('./')
  await page.evaluate(async () => Promise.all((await caches.keys()).map((name) => caches.delete(name))))
  await page.reload()
  await page.getByRole('button', { name: /Contraste em duas sentenças/ }).click()
  await page.getByRole('button', { name: /Baixar modelo e analisar/ }).click()
  await expect(page.getByRole('heading', { name: 'O que o modelo encontrou' })).toBeVisible({ timeout: 180_000 })
  await page.getByRole('tab', { name: 'Sentenças' }).click()
  await expect(page.locator('.sentence-card')).toHaveCount(2)
  const modelCaches = await page.evaluate(async () => {
    const names = (await caches.keys()).filter((name) => name.startsWith('alem-das-palavras:model:'))
    return Promise.all(names.map(async (name) => ({ name, entries: (await (await caches.open(name)).keys()).length })))
  })
  expect(modelCaches).toHaveLength(1)
  expect(modelCaches[0]?.entries).toBe(4)

  await page.reload()
  await expect(page.getByText('O modelo já está armazenado. Nenhum novo download completo é necessário.')).toBeVisible({ timeout: 30_000 })
  await context.setOffline(true)
  await page.reload()
  await page.getByRole('button', { name: /Contraste em duas sentenças/ }).click()
  await page.getByRole('button', { name: /Analisar texto/ }).click()
  await expect(page.getByRole('heading', { name: 'O que o modelo encontrou' })).toBeVisible({ timeout: 120_000 })
})
