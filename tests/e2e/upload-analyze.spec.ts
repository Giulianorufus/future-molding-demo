import { test, expect, type Page } from '@playwright/test';
import path from 'path';

async function completeWizard(page: Page) {
  const stepPath = path.resolve(process.cwd(), 'public', 'sample-drawings', 'Frutto (1).stp');

  await page.goto('/#/wizard');

  const fileInput = page.locator('input[type="file"]');
  await expect(fileInput, 'Il Wizard deve esporre il campo per caricare il disegno').toHaveCount(1);
  await fileInput.setInputFiles(stepPath);

  await expect(page.getByText('4.326812032516769', { exact: true })).toBeVisible();
  await expect(page.getByText('7.040000152587891', { exact: true })).toBeVisible();
  await expect(page.getByText(/17\.600000381469727 x 40 x 27\.90000057220459 mm/)).toBeVisible();

  await page.getByRole('button', { name: 'Avanti', exact: true }).click();
  await page.getByRole('button', { name: '4', exact: true }).click();
  await page.getByRole('combobox').selectOption('cold');
  await page.getByRole('spinbutton', { name: 'Volume materozza/canali per stampata (cm³)' }).fill('2');
  await page.getByRole('spinbutton', { name: 'Area proiettata canali (cm²)' }).fill('1');
  await page.getByRole('button', { name: 'Avanti', exact: true }).click();

  const pressSelectors = page.getByRole('combobox');
  await pressSelectors.nth(0).selectOption({ label: 'ARBURG' });
  await pressSelectors.nth(1).selectOption({ label: 'Arburg 370 U' });
  await pressSelectors.nth(2).selectOption({ label: '22 mm' });
  await page.getByRole('button', { name: 'Avanti', exact: true }).click();

  await page.getByRole('button', { name: /PP \(Polipropilene\)/ }).click();
  await page.getByRole('button', { name: 'Avanti', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Parametri calcolati' })).toBeVisible();
  await expect(page.getByText('Volume dosaggio · dose totale')).toBeVisible();
  await expect(page.getByText('19,307248 cm³', { exact: true })).toBeVisible();
  await expect(page.getByText('18,874567 cm³ iniettati', { exact: true })).toBeVisible();
}

test('Wizard: STEP reale -> stampo, pressa, materiale -> parametri', async ({ page }) => {
  await completeWizard(page);
});

test.describe('Wizard su viewport iPhone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('la ricetta resta leggibile e i comandi sono raggiungibili', async ({ page }) => {
    await completeWizard(page);

    const recipe = page.getByRole('region', { name: 'Ricetta iniziale operatore' });
    const exportButton = recipe.getByRole('button', { name: 'Esporta ricetta' });
    await exportButton.scrollIntoViewIfNeeded();
    await expect(exportButton).toBeInViewport();
    await expect(recipe.getByRole('heading', { name: 'Configurazione stampo' })).toBeVisible();

    const workspace = page.getByRole('main');
    await expect.poll(() => workspace.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
  });
});
