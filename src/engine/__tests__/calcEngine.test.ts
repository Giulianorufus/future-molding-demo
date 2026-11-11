import { buildRecipeSnapshot } from '../recipeExport/buildRecipeSnapshot';
import { exportRecipeJson } from '../recipeExport/exportRecipeJson';
import { calculateParameters } from '../calcEngine';
import { calcolaParametri as calculateWizard } from '../../core/calcEngine';
import { useDrawingStore } from '../../stores/drawingStore';
import type { MaterialInfo } from '../materialData';
import type { PressProfile } from '../pressProfiles';

describe('calculateParameters basic scenarios', () => {
  const dummyMaterial: MaterialInfo = {
    id: 'abs',
    name: 'ABS',
    meltMin: 200,
    meltMax: 250,
    crystalline: false,
    moldMin: 20,
    moldMax: 80,
    viscosity: 'medium',
    family: 'ABS'
  };

  const dummyPress: PressProfile = {
    id: 'sample-press',
    brand: 'arburg',
    label: 'Pressa di prova',
    screwDiameters: [22, 25],
    clampForceTon: 200,
    maxSpeedCm3s: 200,
    maxPressureBar: 1000,
    shotVolumeCm3: 1000,
  };

  test('produces coherent fields for typical inputs', () => {
    const out = calculateParameters({ material: dummyMaterial, press: dummyPress, screwDiameter: 25, projAreaCm2: 30, volumeCm3: 50 });
    expect(out).toHaveProperty('moldTemp');
    expect(out).toHaveProperty('injectionSpeedCm3s');
    expect(out.shotVolumeCm3).toBeGreaterThanOrEqual(1);
    expect(out.clampForceTon).toBeGreaterThan(0);
  });

  test('applies override percent to injection speed', () => {
    const out = calculateParameters({ material: dummyMaterial, press: dummyPress, screwDiameter: 25, injectionSpeedOverride: '+10%' });
    expect(typeof out.injectionSpeedCm3s).toBe('number');
  });

  test('marks the press inadequate when required clamp is below nominal but above 85%', () => {
    useDrawingStore.getState().reset();
    const out = calculateParameters({
      material: { ...dummyMaterial, family: 'PP' },
      press: { ...dummyPress, clampForceTon: 100 },
      screwDiameter: 22,
      projAreaCm2: 272.727,
      volumeCm3: 10,
    });
    expect(out.clampForceTon).toBe(90);
    expect(out.pressAdequate).toBe(false);
    expect(out.requiredTonnage_t).toBe(90);
    expect(out.warnings).toEqual(expect.arrayContaining([expect.stringMatching(/85% nominale/)]));
  });

  test('preserves exact PP shot for four cavities and cold runner on ARBURG 370 U / 22 mm', () => {
    useDrawingStore.setState({
      volumeCm3: 4.326812032516769,
      surfaceCm2: 7.04,
      cavityCount: 4,
      cavityCountConfirmed: true,
      feedSystem: 'cold',
      runnerVolumeCm3: 2,
      runnerProjectedAreaCm2: 1,
    });
    try {
      const out = calculateParameters({
        material: { ...dummyMaterial, family: 'PP', id: 'PP-HOMO', crystalline: true },
        press: { ...dummyPress, id: 'arburg-370-u', clampForceTon: 60 },
        screwDiameter: 22,
        projAreaCm2: 7.04,
        volumeCm3: 4.326812032516769,
      });
      expect(out.shotVolumeCm3).toBe(19.307248);
      expect(out.vpSwitchVolumeCm3).toBeGreaterThan(2);
      expect(out.vpSwitchVolumeCm3).toBeLessThan(19.307248);
      expect(out.vpTimeMs).toBeGreaterThan(0);
      expect(out.vp).toBe(out.vpSwitchVolumeCm3);
      expect(out.totalPartsVolumeCm3).toBeCloseTo(17.307248130067076, 12);
      const wizardOutput = calculateWizard({
        volumeCm3: 4.326812032516769,
        projectedAreaCm2: 7.04,
        press: {
          id: 'arburg-370-u', tonnellaggio: 600 / 9.80665,
          screwDiameters: [22], screwDiameterMm: 22,
          maxPressureBar: 2000, maxSpeedMmPerS: 250,
        },
        material: { id: 'PP-HOMO' },
      });
      expect(wizardOutput.shotVolumeCm3).toBe(19.307248);
      expect(wizardOutput.vpSwitchVolumeCm3).toBe(out.vpSwitchVolumeCm3);
      expect(wizardOutput.switchoverMs).toBeGreaterThan(0);
    } finally {
      useDrawingStore.getState().reset();
    }
  });

  test('exports PC 320 C cold shot, injected V/P and the filling pressure estimate', () => {
    const pieceVolume = 5.2 / 1.2;
    const runnerVolume = 2.8 / 1.2;
    useDrawingStore.setState({
      volumeCm3: pieceVolume,
      cavityCount: 1,
      cavityCountConfirmed: true,
      feedSystem: 'cold',
      runnerVolumeCm3: runnerVolume,
      runnerProjectedAreaCm2: null,
    });
    try {
      const output = calculateWizard({
        volumeCm3: pieceVolume,
        projectedAreaCm2: 10,
        press: {
          id: 'arburg-50t',
          tonnellaggio: 500 / 9.80665,
          screwDiameters: [30],
          screwDiameterMm: 30,
          maxPressureBar: 2000,
          maxSpeedMmPerS: 136,
          maxInjectionFlowCm3s: 96,
        },
        material: { id: 'PC', densityGPerCm3: 1.2 },
      });
      const snapshot = buildRecipeSnapshot({ projectName: 'PC 320 C', input: {}, output });
      const exported = JSON.parse(exportRecipeJson(snapshot)).output;

      expect(output.unified).toMatchObject({
        warnings: expect.arrayContaining([
          'Area proiettata dei canali freddi non disponibile: forza di chiusura provvisoria',
        ]),
      });
      // In this fixture, 10 cm² is a hypothetical area. The pressure estimate
      // comes from the filling model and must stay distinct from the 2000 bar limit.
      expect(output.times.coolingMs).toBeNull();
      expect(exported).toMatchObject({ holdingPressureBar: null, holdingTimeSec: null, coolingTimeSec: null });
      expect(exported.unified.warnings).toEqual(expect.arrayContaining([
        expect.stringContaining('Mantenimento da determinare'),
        expect.stringContaining('Raffreddamento da determinare'),
      ]));
      expect(exported.pressureBar).toBeGreaterThan(100);
      expect(exported.pressureBar).toBeLessThan(2000);
      expect(exported.unified.profiloPressione.step2).toBe(exported.pressureBar);
      expect(exported.shotVolumeCm3).toBe(6.666667);
      expect(exported.vpSwitchVolumeCm3).toBeGreaterThan(runnerVolume);
      expect(exported.vpSwitchVolumeCm3).toBeLessThan(exported.shotVolumeCm3);
    } finally {
      useDrawingStore.getState().reset();
    }
  });

  test('does not invent a V/P setpoint when mold configuration is incomplete', () => {
    useDrawingStore.getState().reset();
    const result = calculateParameters({
      material: { ...dummyMaterial, family: 'PP' },
      press: dummyPress,
      screwDiameter: 22,
      volumeCm3: 4.326812032516769,
    });
    expect(result.vpSwitchVolumeCm3).toBeNull();
    expect(result.vpTimeMs).toBeNull();
    expect(result.warnings).toEqual(expect.arrayContaining([expect.stringMatching(/Commutazione V\/P non disponibile/)]));

    const wizard = calculateWizard({ volumeCm3: 4.326812, material: { id: 'PP-HOMO' } });
    expect(wizard.unified).toMatchObject({
      warnings: expect.arrayContaining([
        expect.stringMatching(/Numero cavità non confermato/),
        expect.stringMatching(/Commutazione V\/P non disponibile/),
      ]),
    });
  });
});
