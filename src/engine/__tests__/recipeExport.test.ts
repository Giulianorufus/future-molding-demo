import { buildRecipeSnapshot } from '../recipeExport/buildRecipeSnapshot';
import { exportRecipeJson } from '../recipeExport/exportRecipeJson';
import { exportRecipeCsv } from '../recipeExport/exportRecipeCsv';
import { exportRecipePdf } from '../recipeExport/exportRecipePdf';

describe('recipe export', () => {
  test('json snapshot contains versions and ISO timestamp', () => {
    const snap = buildRecipeSnapshot({ projectName: 'P', input: {}, output: {} });
    const json = exportRecipeJson(snap);
    const obj = JSON.parse(json);
    expect(obj.meta).toBeDefined();
    expect(obj.meta.materialsVersion).toBeDefined();
    expect(obj.meta.pressCatalogVersion).toBeDefined();
    expect(typeof obj.meta.timestampISO).toBe('string');
    expect(obj.meta.timestampISO).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  test('csv header order and separator', () => {
    const snap = buildRecipeSnapshot({ projectName: 'P', input: {}, output: { shotVolumeCm3: 19.307248 } });
    const csv = exportRecipeCsv(snap);
    const lines = csv.trim().split('\n');
    expect(lines[0].includes(';')).toBe(true);
    expect(lines[0].startsWith('projectName;')).toBe(true);
    const shotIndex = lines[0].split(';').indexOf('shotVolumeCm3');
    expect(lines[1].split(';')[shotIndex]).toBe('19.307248');
  });

  test('csv quotes separators, quotes and line breaks inside fields', () => {
    const snap = buildRecipeSnapshot({
      projectName: 'PC; "320 C"',
      input: {},
      output: {},
    });
    snap.warnings = ['Pressione; da verificare', 'Seconda riga\nDettaglio'];
    snap.assumptions = ['Quota\rda confermare'];

    const csv = exportRecipeCsv(snap);
    expect(csv.split('\n')[1].startsWith('"PC; ""320 C""";')).toBe(true);
    expect(csv.endsWith(';"Pressione; da verificare|Seconda riga\nDettaglio";"Quota\rda confermare"\n')).toBe(true);
  });

  test('pdf smoke: generates bytes starting with %PDF', async () => {
    const snap = buildRecipeSnapshot({ projectName: 'P', input: {}, output: {} });
    const bytes = await exportRecipePdf(snap);
    const prefix = String.fromCharCode(...bytes.slice(0,4));
    expect(prefix).toBe('%PDF');
  });
});
