import { calcolaParametri } from "../core/calcEngine";
import {
  applyDefectSelection,
  getAutomaticDefectCorrection,
  mapLegacyDefectId,
  resolveDefectIntegration,
} from "./defectAdapter";

const baseInput = {
  volumeCm3: 12,
  projectedAreaCm2: 30,
  press: {
    id: "integration-test-press",
    tonnellaggio: 200,
    screwDiameters: [25],
    screwDiameterMm: 25,
    maxPressureBar: 1000,
    maxSpeedMmPerS: 200,
    maxShotVolumeCm3: 1000,
  },
  material: { id: "ABS", densityGPerCm3: 1.04, recommendedTemperatureC: 240 },
};

describe("active defects page integration", () => {
  it.each(['short_shot', 'burn_mark', 'flash', 'sink'])("maps active defect id %s to a calculation integration", (id) => {
    expect(mapLegacyDefectId(id)).not.toBeNull();
    expect(resolveDefectIntegration(id)).not.toBeNull();
  });

  it("preserves legacy aliases while mapping sink-mark to sink", () => {
    expect(mapLegacyDefectId("sink-mark")).toBe("sink");
    expect(mapLegacyDefectId("SINK_MARKS")).toBe("sink");
    expect(mapLegacyDefectId("SHORT_SHOT")).toBe("short_shot");
    expect(mapLegacyDefectId("BAVE")).toBe("flash");
    expect(mapLegacyDefectId("RITIRO")).toBe("sink");
    expect(mapLegacyDefectId("DEFORMAZIONE")).toBe("warpage");
  });

  it("keeps sink-mark manual and provides actionable checks", () => {
    expect(getAutomaticDefectCorrection("sink-mark", "medium")).toBeNull();
    expect(resolveDefectIntegration("sink-mark")).toMatchObject({ automatic: false });
    expect(resolveDefectIntegration("sink-mark")?.manualChecks.length).toBeGreaterThan(0);
  });

  it.each([
    ["short-shot", "+10%", "increase"],
    ["burn-mark", "-10%", "decrease"],
    ["flash", "-10%", "decrease"],
  ] as const)("applies only the supported speed correction for %s", (id, expectedOverride, direction) => {
    const correction = getAutomaticDefectCorrection(id, "medium");
    expect(correction?.injectionSpeedOverride).toBe(expectedOverride);
    expect(correction).not.toHaveProperty("meltTempOverride");

    const baseline = calcolaParametri(baseInput);
    const corrected = calcolaParametri({ ...baseInput, injectionSpeedOverride: correction!.injectionSpeedOverride });

    if (direction === "increase") {
      expect(corrected.injectionFlowCm3s).toBeGreaterThan(baseline.injectionFlowCm3s);
    } else {
      expect(corrected.injectionFlowCm3s).toBeLessThan(baseline.injectionFlowCm3s);
    }
  });

  it("keeps a speed-increasing defect correction within the configured press flow limit", () => {
    const correction = getAutomaticDefectCorrection("short-shot", "high");
    const limitedInput = {
      ...baseInput,
      press: { ...baseInput.press, maxSpeedMmPerS: 30 },
      injectionSpeedOverride: correction!.injectionSpeedOverride,
    };

    const corrected = calcolaParametri(limitedInput);

    expect(corrected.screwVelocityMmPerS).toBeLessThanOrEqual(30);
    expect(corrected.injectionFlowCm3s).toBeCloseTo(30 * Math.PI * 25 ** 2 / 4 / 1000, 1);
    expect(corrected.velocityMmPerS).toBe(corrected.screwVelocityMmPerS);
  });

  it("does not accumulate when repeating a defect recalculation", () => {
    const once = applyDefectSelection(baseInput, "burn-mark", "medium");
    const repeated = applyDefectSelection(baseInput, "burn-mark", "medium");

    expect(repeated.input).toEqual(once.input);
    expect(repeated.lastDefectFix).toEqual(once.lastDefectFix);
    expect(repeated.input.injectionSpeedOverride).toBe("-10%");
  });

  it("replaces the previous correction when changing defect", () => {
    const burnMark = applyDefectSelection(baseInput, "burn-mark", "medium");
    const flash = applyDefectSelection(baseInput, "flash", "medium");

    expect(burnMark.input.injectionSpeedOverride).toBe("-10%");
    expect(flash.input.injectionSpeedOverride).toBe("-10%");
    expect(flash.lastDefectFix?.defectId).toBe("flash");
    expect(flash.lastDefectFix?.appliedCorrections).toHaveLength(1);
    expect(flash.lastDefectFix?.appliedCorrections[0].id).toBe("defect:flash:injectionSpeedOverride");
  });

  it("clears the prior correction and audit when removing a defect", () => {
    const burnMark = applyDefectSelection(baseInput, "burn-mark", "medium");
    const removed = applyDefectSelection(baseInput, null, "medium");

    expect(removed.input).toEqual(baseInput);
    expect(removed.input).not.toHaveProperty("injectionSpeedOverride");
    expect(removed.lastDefectFix).toBeNull();
  });

  it("keeps flow and screw-speed units physically consistent", () => {
    const result = calcolaParametri(baseInput);
    const areaMm2 = Math.PI * baseInput.press.screwDiameterMm ** 2 / 4;

    expect(result.screwVelocityMmPerS).toBeCloseTo(result.injectionFlowCm3s * 1000 / areaMm2, 2);
  });
});