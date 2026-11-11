export function positiveProcessValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

export function readRecipeProcessValues(output: {
  holdingPressureBar?: unknown;
  holdingTimeSec?: unknown;
  coolingTimeSec?: unknown;
  times?: { coolingMs?: unknown };
  unified?: unknown;
}) {
  const unified = typeof output.unified === 'object' && output.unified !== null
    ? output.unified as Record<string, unknown>
    : undefined;
  const coolingMs = positiveProcessValue(output.times?.coolingMs);
  return {
    holdingPressureBar: positiveProcessValue(unified?.packPressione ?? output.holdingPressureBar),
    holdingTimeSec: positiveProcessValue(unified?.packTempo ?? output.holdingTimeSec),
    // Older Wizard results replaced unavailable cooling with 1 ms.
    coolingTimeSec: coolingMs !== null && coolingMs > 1
      ? coolingMs / 1000
      : positiveProcessValue(unified?.coolingTime ?? output.coolingTimeSec),
  };
}
