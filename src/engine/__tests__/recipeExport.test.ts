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
    expect(csv).toContain(';"Pressione; da verificare|Seconda riga\nDettaglio";"Quota\rda confermare";');
  });

  test('exports old Wizard placeholders as missing process settings', () => {
    const legacy = {
      times: { injectionMs: 137, coolingMs: 1 },
      unified: { packPressione: 0, packTempo: 0, coolingTime: 0, profiloPack: { step1: 0 } },
    };
    const snap = buildRecipeSnapshot({ output: legacy });
    const { output } = JSON.parse(exportRecipeJson(snap));

    expect(output).toMatchObject({
      holdingPressureBar: null, holdingTimeSec: null, coolingTimeSec: null,
      times: { injectionMs: 137, coolingMs: null },
      unified: { packPressione: null, packTempo: null, coolingTime: null },
    });
    expect(output.unified).not.toHaveProperty('profiloPack');
    expect(legacy.times.coolingMs).toBe(1);
    expect(exportRecipeCsv(snap)).toContain(';Da determinare;Da determinare;Da determinare\n');
  });

  test('exports known process settings in bar and seconds', () => {
    const snap = buildRecipeSnapshot({
      output: { times: { coolingMs: 12500 }, unified: { packPressione: 650, packTempo: 3.2 } },
    });
    expect(JSON.parse(exportRecipeJson(snap)).output).toMatchObject({
      holdingPressureBar: 650, holdingTimeSec: 3.2, coolingTimeSec: 12.5,
    });
    expect(exportRecipeCsv(snap)).toContain(';650;3.2;12.5\n');
  });

  test('pdf smoke: generates bytes starting with %PDF', async () => {
    const snap = buildRecipeSnapshot({ projectName: 'P', input: {}, output: {} });
    const bytes = await exportRecipePdf(snap);
    const prefix = String.fromCharCode(...bytes.slice(0,4));
    expect(prefix).toBe('%PDF');
  });
});
