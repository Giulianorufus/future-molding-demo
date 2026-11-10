export type FillingTrialInput = {
  flowCm3s: number;
  consistencyPaSn: number;
  flowIndex: number;
  runnerLengthMm: number;
  runnerDiameterMm: number;
  gateLengthMm: number;
  gateDiameterMm: number;
  cavityLengthMm: number;
  cavityWidthMm: number;
  cavityThicknessMm: number;
};

const positive = (value: number) => Number.isFinite(value) && value > 0;

/**
 * Steady, isothermal power-law flow (wall stress = K · shear rate^n).
 * The modeled path is a round runner, a round gate and a wide parallel slit.
 */
export function estimateFillingTrial(
  input: FillingTrialInput,
  limits: { maxPressureBar?: number; maxFlowCm3s?: number | null },
  vpVolumeCm3: number | null,
) {
  const {
    flowCm3s, consistencyPaSn, flowIndex: n,
    runnerLengthMm, runnerDiameterMm, gateLengthMm, gateDiameterMm,
    cavityLengthMm, cavityWidthMm, cavityThicknessMm,
  } = input;
  if (![flowCm3s, consistencyPaSn, n, runnerLengthMm, runnerDiameterMm, gateLengthMm,
    gateDiameterMm, cavityLengthMm, cavityWidthMm, cavityThicknessMm].every(positive) ||
    n > 1 || cavityWidthMm < 10 * cavityThicknessMm) return null;

  const flowM3s = flowCm3s * 1e-6;
  const pipeDropBar = (lengthMm: number, diameterMm: number) => {
    const radiusM = diameterMm * 0.0005;
    const wallShearRate = (3 + 1 / n) * flowM3s / (Math.PI * radiusM ** 3);
    const wallStressPa = consistencyPaSn * wallShearRate ** n;
    return 2 * (lengthMm * 0.001) * wallStressPa / radiusM / 1e5;
  };

  const gapM = cavityThicknessMm * 0.001;
  const widthM = cavityWidthMm * 0.001;
  const wallShearRate = 2 * (2 + 1 / n) * flowM3s / (widthM * gapM ** 2);
  const wallStressPa = consistencyPaSn * wallShearRate ** n;
  const cavityBar = 2 * (cavityLengthMm * 0.001) * wallStressPa / gapM / 1e5;
  const runnerBar = pipeDropBar(runnerLengthMm, runnerDiameterMm);
  const gateBar = pipeDropBar(gateLengthMm, gateDiameterMm);
  const totalBar = runnerBar + gateBar + cavityBar;
  if (![runnerBar, gateBar, cavityBar, totalBar].every(positive)) return null;

  const pressureLimit = limits.maxPressureBar ?? 0;
  const flowLimit = limits.maxFlowCm3s ?? 0;
  return {
    runnerBar,
    gateBar,
    cavityBar,
    totalBar,
    vpTimeSec: vpVolumeCm3 !== null && positive(vpVolumeCm3) ? vpVolumeCm3 / flowCm3s : null,
    exceedsPressure: positive(pressureLimit) ? totalBar > pressureLimit : null,
    exceedsFlow: positive(flowLimit) ? flowCm3s > flowLimit : null,
  };
}
