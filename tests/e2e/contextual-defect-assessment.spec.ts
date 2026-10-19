import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

async function seedDemoDrawings(page: Page) {
  const fixture = await readFile(path.resolve(process.cwd(), 'tests/fixtures/Frutto (1).glb'))
  await page.route('**/__playwright_mesh_fixture__', (route) => route.fulfill({
    status: 200,
    body: fixture,
    headers: { 'content-type': 'model/gltf-binary' },
  }))
  await page.addInitScript(() => {
    localStorage.setItem('fm-drawing-library', JSON.stringify({
      state: {
        drawings: [
          { id: 'demo-cad-a', fileName: 'demo-a.glb', glbUrl: '/__playwright_mesh_fixture__', volumeCm3: 12.5, boundingBox: { x: 20, y: 30, z: 10 }, conversionStatus: 'ready', createdAt: 1 },
          { id: 'demo-cad-b', fileName: 'demo-b.glb', glbUrl: '/__playwright_mesh_fixture__', volumeCm3: 8, boundingBox: { x: 12, y: 14, z: 8 }, conversionStatus: 'ready', createdAt: 2 },
        ],
      },
      version: 0,
    }))
  })
}

for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test(`pin raycast, gesti e diagnosi restano corretti su ${viewport.name}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: viewport.name === 'mobile',
      hasTouch: viewport.name === 'mobile',
    })
    const page = await context.newPage()
    try {
    await seedDemoDrawings(page)
    await page.goto('/#/disegni')
    await page.getByTestId('drawing-item-demo-cad-a').getByRole('button', { name: 'Seleziona' }).click()
    await page.goto('/#/difetti')
    await page.getByText('Burn Mark', { exact: true }).click()

    await expect(page.getByLabel('Contesto diagnostico')).toContainText('demo-cad-a')
    await expect(page.getByText(/Posizione: il pin viene creato solo toccando\/cliccando una mesh/)).toBeVisible()
    await page.getByRole('button', { name: 'Segna difetto' }).click()
    const canvas = page.locator('canvas').last()
    await expect(page.getByText(/Tocca la superficie del pezzo/)).toBeVisible()
    await expect(page.getByText('Ready')).toBeVisible({ timeout: 15000 })

    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()
    const tap = async (x: number, y: number) => {
      if (viewport.name === 'mobile') await page.touchscreen.tap(x, y)
      else await page.mouse.click(x, y)
    }
    if (viewport.name === 'mobile') {
      await canvas.dispatchEvent('pointerdown', { pointerId: 11, pointerType: 'touch', isPrimary: true, clientX: box!.x + box!.width / 2, clientY: box!.y + box!.height / 2, button: 0, buttons: 1 })
      await canvas.dispatchEvent('pointerdown', { pointerId: 12, pointerType: 'touch', isPrimary: false, clientX: box!.x + box!.width / 2 + 8, clientY: box!.y + box!.height / 2, button: 0, buttons: 1 })
      await canvas.dispatchEvent('pointerup', { pointerId: 11, pointerType: 'touch', isPrimary: true, clientX: box!.x + box!.width / 2, clientY: box!.y + box!.height / 2, button: 0, buttons: 0 })
      await canvas.dispatchEvent('pointerup', { pointerId: 12, pointerType: 'touch', isPrimary: false, clientX: box!.x + box!.width / 2 + 8, clientY: box!.y + box!.height / 2, button: 0, buttons: 0 })
      await expect(page.getByRole('button', { name: /Pin \d+ · gravità \d · mesh/ })).toHaveCount(0)
    }
    await tap(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await expect(page.getByRole('button', { name: /Pin 1 · gravità 2 · mesh/ })).toBeVisible()
    await expect(page.getByText(/ipotesi stimata/i).first()).toBeVisible()

    const pinCount = page.getByRole('button', { name: /Pin \d+ · gravità \d · mesh/ })
    await expect(pinCount).toHaveCount(1)
    const positionBeforeRotate = await pinCount.innerText()
    if (viewport.name === 'mobile') {
      await canvas.dispatchEvent('pointerdown', { pointerId: 21, pointerType: 'touch', isPrimary: true, clientX: box!.x + box!.width / 2, clientY: box!.y + box!.height / 2, button: 0, buttons: 1 })
      await canvas.dispatchEvent('pointermove', { pointerId: 21, pointerType: 'touch', isPrimary: true, clientX: box!.x + box!.width / 2 + 45, clientY: box!.y + box!.height / 2 + 18, button: 0, buttons: 1 })
      await canvas.dispatchEvent('pointerup', { pointerId: 21, pointerType: 'touch', isPrimary: true, clientX: box!.x + box!.width / 2 + 45, clientY: box!.y + box!.height / 2 + 18, button: 0, buttons: 0 })
    } else {
      await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
      await page.mouse.down()
      await page.mouse.move(box!.x + box!.width / 2 + 45, box!.y + box!.height / 2 + 18, { steps: 5 })
      await page.mouse.up()
    }
    await expect(pinCount).toHaveCount(1)
    await expect(pinCount).toHaveText(positionBeforeRotate)

    await page.getByRole('button', { name: 'Segna difetto' }).click()
    await tap(box!.x + 2, box!.y + 2)
    await expect(pinCount).toHaveCount(1)
    await page.getByRole('button', { name: 'Annulla posizionamento' }).click()

    const endFillQuestion = page.getByLabel('La macchia nera è localizzata a fine riempimento, nervature o fronti confluenti?')
    await endFillQuestion.selectOption('yes')
    await expect(page.getByText(/Riscontro dichiarato dall’operatore/)).toBeVisible()

    await page.goto('/#/disegni')
    await page.getByTestId('drawing-item-demo-cad-b').getByRole('button', { name: 'Seleziona' }).click()
    await page.goto('/#/difetti')
    await page.getByText('Burn Mark', { exact: true }).click()
    await expect(page.getByLabel('Contesto diagnostico')).toContainText('demo-cad-b')
    await page.getByRole('button', { name: 'Segna difetto' }).click()
    const nextCanvas = page.locator('canvas').last()
    await expect(page.getByText('Ready')).toBeVisible({ timeout: 15000 })
    const nextBox = await nextCanvas.boundingBox()
    expect(nextBox).not.toBeNull()
    await tap(nextBox!.x + nextBox!.width / 2, nextBox!.y + nextBox!.height / 2)
    await expect(page.getByRole('button', { name: /Pin 1 · gravità 2 · mesh/ })).toBeVisible()
    await expect(page.getByLabel('La macchia nera è localizzata a fine riempimento, nervature o fronti confluenti?')).toHaveValue('unknown')

    await page.getByLabel('Gravità dopo l’intervento').selectOption('0')
    await page.getByLabel('Intervento effettivamente provato').fill('Verificato il pezzo: difetto assente dopo la prova.')
    await page.getByRole('button', { name: 'Registra valutazione' }).click()
    await expect(page.getByText(/Gravità 2 → 0: Verificato il pezzo/)).toBeVisible()
    await expect(page.getByText(/non è apprendimento automatico/)).toBeVisible()
    } finally {
      await context.close()
    }
  })
}
