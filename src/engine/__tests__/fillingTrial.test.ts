import { estimateFillingTrial, type FillingTrialInput } from '../fillingTrial';

const input: FillingTrialInput = {
  flowCm3s: 30,
  consistencyPaSn: 100,
  flowIndex: 1,
  runnerLengthMm: 40,
  runnerDiameterMm: 6,
  gateLengthMm: 2,
  gateDiameterMm: 2,
  cavityLengthMm: 50,
  cavityWidthMm: 20,
  cavityThicknessMm: 2,
};

test('matches Newtonian pressure drops and uses injected volume for time', () => {
  const result = estimateFillingTrial(input, { maxPressureBar: 200, maxFlowCm3s: 29 }, 6);
  expect(result?.runnerBar).toBeCloseTo(37.7256, 3);
  expect(result?.gateBar).toBeCloseTo(152.7887, 3);
  expect(result?.cavityBar).toBeCloseTo(112.5);
  expect(result?.vpTimeSec).toBeCloseTo(0.2);
  expect(result?.exceedsPressure).toBe(true);
  expect(result?.exceedsFlow).toBe(true);
});

test('responds to a second flow rate with shear thinning at fixed temperature', () => {
  const base = estimateFillingTrial({ ...input, flowIndex: 0.5 }, {}, null);
  const faster = estimateFillingTrial({ ...input, flowIndex: 0.5, flowCm3s: 60 }, {}, null);
  expect(faster?.totalBar).toBeCloseTo((base?.totalBar ?? 0) * Math.sqrt(2));
  expect(faster?.vpTimeSec).toBeNull();
  expect(faster?.exceedsPressure).toBeNull();
});

test('requires usable grade data and a cavity compatible with the slit model', () => {
  expect(estimateFillingTrial({ ...input, consistencyPaSn: NaN }, {}, null)).toBeNull();
  expect(estimateFillingTrial({ ...input, flowIndex: 0 }, {}, null)).toBeNull();
  expect(estimateFillingTrial({ ...input, cavityWidthMm: 5 }, {}, null)).toBeNull();
});
