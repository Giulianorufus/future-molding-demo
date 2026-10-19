import { test, expect } from '@playwright/test'
import { DEFECT_GUIDES } from '../../src/engine/knowledge/guidedDiagnosis'
import { serveFixture, exposeStores, injectStores, waitForParametriResult } from './helpers/fixtureHelper'

test('catalogo: ricerca per sinonimi, filtri e azioni specifiche', async ({ page }, testInfo) => {
  await page.goto('/#/difetti')
  const search = page.getByRole('searchbox', { name: 'Cerca difetto' })
  await search.fill('glass fibre')
  await page.getByRole('button', { name: 'Fibre affioranti / striature da rinforzo', exact: true }).click()
  const panel = page.getByRole('region', { name: 'Diagnosi guidata' })
  await panel.getByRole('combobox', { name: 'Le fibre sono più visibili presso fori o linee di giunzione?' }).selectOption('yes')
  await expect(panel.getByRole('heading', { name: '1. Orientamento dei rinforzi' })).toBeVisible()
  await panel.evaluate(element => element.scrollIntoView({ block: 'start' }))
  await page.screenshot({ path: testInfo.outputPath('catalog-fibers.png') })
  await page.getByRole('combobox', { name: 'Categoria difetto' }).selectOption('Estrazione')
  await expect(page.getByText('Nessun difetto trovato. Prova un sinonimo o cambia categoria.')).toBeVisible()
  await page.getByRole('button', { name: 'Azzera filtri' }).click()
  await search.fill('umidità')
  await page.getByRole('button', { name: 'Striature da umidità', exact: true }).click()
  await expect(panel.getByRole('heading', { name: 'Diagnosi guidata · Striature da umidità' })).toBeVisible()
  await expect(panel.getByText('0 di 3 risposte · 0 osservazioni verificate')).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await search.fill('cold_slug')
  await page.getByRole('button', { name: 'Goccia fredda / cold slug', exact: true }).click()
  await panel.evaluate(element => element.scrollIntoView({ block: 'start' }))
  await page.screenshot({ path: testInfo.outputPath('catalog-mobile.png') })
  expect((await panel.boundingBox())!.width).toBeGreaterThan(300)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('tutte le schede espongono domande e azioni nel browser', async ({ page }) => {
  test.setTimeout(90000)
  await page.goto('/#/difetti')
  for (const guide of DEFECT_GUIDES) {
    await page.getByRole('searchbox', { name: 'Cerca difetto' }).fill(guide.id)
    await page.getByRole('button', { name: guide.label, exact: true }).click()
    const panel = page.getByRole('region', { name: 'Diagnosi guidata' })
    await expect(panel.getByRole('heading', { name: `Diagnosi guidata · ${guide.label}`, exact: true })).toBeVisible()
    await expect(panel.getByRole('combobox')).toHaveCount(3)
    await expect(panel.getByRole('list', { name: 'Cause possibili', exact: true }).locator(':scope > li')).toHaveCount(guide.causes.length)
  }
})

test('una guida qualitativa non conserva la correzione del difetto precedente', async ({ page }) => {
  await serveFixture(page, 'tests/fixtures/Frutto (1).glb')
  await page.goto('/#/wizard')
  await exposeStores(page)
  await injectStores(page, { pressId: 'arburg-370-u', materialId: 'PP-HOMO' })
  await waitForParametriResult(page)
  await page.goto('/#/difetti')
  await page.getByRole('button', { name: 'Bava / sormonto', exact: true }).click()
  await page.waitForFunction(() => (window as any).__FM_STORES__.parametri.getState().lastDefectFix?.defectId === 'flash')
  await page.getByRole('searchbox', { name: 'Cerca difetto' }).fill('umidita')
  await page.getByRole('button', { name: 'Striature da umidità', exact: true }).click()
  await page.waitForFunction(() => (window as any).__FM_STORES__.parametri.getState().lastDefectFix === null)
  expect(await page.evaluate(() => localStorage.getItem('fm:lastDefectFix'))).toBeNull()
  await expect(page.getByText('Ultimo ricalcolo per difetto')).toHaveCount(0)
  await expect(page.getByRole('combobox', { name: 'Severità correzione' })).toHaveCount(0)
})
