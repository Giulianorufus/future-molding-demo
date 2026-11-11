// src/engine/recipeExport/exportRecipeJson.ts
import { readRecipeProcessValues } from "../recipeProcessValues";
import type { RecipeSnapshot } from "./recipeTypes";

export function exportRecipeJson(snapshot: RecipeSnapshot): string {
  if (!snapshot.output) return JSON.stringify(snapshot, null, 2);

  const output = { ...snapshot.output };
  const process = readRecipeProcessValues(output);
  if (output.times) {
    output.times = { ...output.times, coolingMs: process.coolingTimeSec === null ? null : Math.round(process.coolingTimeSec * 1000) };
  }
  if (output.unified && typeof output.unified === "object") {
    output.unified = {
      ...output.unified,
      packPressione: process.holdingPressureBar,
      packTempo: process.holdingTimeSec,
      coolingTime: process.coolingTimeSec,
    };
    if (process.holdingPressureBar === null || process.holdingTimeSec === null) delete output.unified.profiloPack;
  }
  return JSON.stringify({ ...snapshot, output: { ...output, ...process } }, null, 2);
}
