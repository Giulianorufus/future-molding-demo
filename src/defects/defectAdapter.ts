import { applyDefectFix, type DefectId, type DefectSeverity } from "./defectRules";
import { normalizeCorrections } from "../lib/normalizeOutput";
import type { AppliedCorrection } from "../types/appliedCorrection";

export type LegacyDefectId = string | null | undefined;

type DefectIntegration = {
  id: DefectId;
  aliases: readonly string[];
  pinId: string | null;
  automaticAction: string | null;
  manualChecks: readonly string[];
};

const DEFECT_INTEGRATIONS: readonly DefectIntegration[] = [
  {
    id: "short_shot",
    aliases: ["short-shot", "short_shot", "short shot"],
    pinId: "short_shot",
    automaticAction: "Aumenta la velocità d'iniezione entro il limite della pressa; non forza pressione o temperature.",
    manualChecks: ["Verificare dose e volume di iniezione.", "Controllare gate, sfiati e possibili ostruzioni."],
  },
  {
    id: "burn_mark",
    aliases: ["burn-mark", "burn_mark", "burn mark", "burn marks", "bruciature"],
    pinId: "burn_marks",
    automaticAction: "Riduce la velocità d'iniezione; non modifica le temperature del materiale.",
    manualChecks: ["Controllare sfiati e aria intrappolata.", "Verificare permanenza nel cilindro e possibile degradazione o contaminazione del materiale."],
  },
  {
    id: "flash",
    aliases: ["flash", "bave", "bava", "bave / sormonto"],
    pinId: "flashes",
    automaticAction: "Riduce la velocità d'iniezione entro il limite della pressa.",
    manualChecks: ["Verificare forza di chiusura, parallelismo e linea di divisione dello stampo."],
  },
  {
    id: "sink",
    aliases: ["sink", "sink-mark", "sink_mark", "sink_marks", "sink marks", "ritiro", "affossamento"],
    pinId: "sink_marks",
    automaticAction: null,
    manualChecks: ["Verificare spessori locali e geometria del pezzo.", "Controllare dimensione/posizione del gate e bilanciamento del raffreddamento."],
  },
  {
    id: "warpage",
    aliases: ["warpage", "deformazione", "deformazioni", "deformation"],
    pinId: "warpage",
    automaticAction: null,
    manualChecks: ["Verificare bilanciamento dei canali, raffreddamento e orientamento delle fibre."],
  },
];

export const DEFECT_PAGE_CATALOG = [
  { id: "short-shot", label: "Short Shot", desc: "Riempimento incompleto del pezzo." },
  { id: "burn-mark", label: "Burn Mark", desc: "Bruciature dovute ad aria intrappolata." },
  { id: "flash", label: "Bava / Sormonto", desc: "Materiale in eccesso oltre lo split-line." },
  { id: "sink-mark", label: "Affossamento", desc: "Ritiro locale dovuto a spessore alto." },
] as const;

function normalizeDefectId(id: LegacyDefectId): string | null {
  if (!id) return null;
  return String(id).trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

export function resolveDefectIntegration(id: LegacyDefectId): (DefectIntegration & { automatic: boolean }) | null {
  const normalized = normalizeDefectId(id);
  if (!normalized) return null;

  const integration = DEFECT_INTEGRATIONS.find((entry) =>
    entry.aliases.some((alias) => normalizeDefectId(alias) === normalized || alias === normalized),
  );
  return integration ? { ...integration, automatic: integration.automaticAction !== null } : null;
}

export function mapLegacyDefectId(id: LegacyDefectId): DefectId | null {
  return resolveDefectIntegration(id)?.id ?? null;
}

export function getAutomaticDefectCorrection(id: LegacyDefectId, severity: DefectSeverity) {
  const integration = resolveDefectIntegration(id);
  if (!integration?.automatic) return null;

  const speedDeltaPct = applyDefectFix(integration.id, severity).delta?.injectionSpeed_pct;
  if (typeof speedDeltaPct !== "number" || speedDeltaPct === 0) return null;

  return {
    injectionSpeedOverride: `${speedDeltaPct > 0 ? "+" : ""}${speedDeltaPct}%`,
    speedDeltaPct,
    description: integration.automaticAction,
  };
}

export function applyDefectSelection<T extends Record<string, any>>(
  baseInput: T,
  id: LegacyDefectId,
  severity: DefectSeverity,
): {
  input: T & { injectionSpeedOverride?: string | number };
  integration: (DefectIntegration & { automatic: boolean }) | null;
  lastDefectFix: null | {
    defectId: string;
    severity: DefectSeverity;
    delta?: Record<string, number>;
    notes: string[];
    appliedCorrections: AppliedCorrection[];
  };
} {
  const integration = resolveDefectIntegration(id);
  if (!integration) return { input: baseInput, integration: null, lastDefectFix: null };

  const correction = getAutomaticDefectCorrection(integration.id, severity);
  const corrections = correction ? normalizeCorrections([{
    id: `defect:${integration.id}:injectionSpeedOverride`,
    type: "defect",
    target: "injectionSpeedOverride",
    action: correction.speedDeltaPct < 0 ? "decrease" : "increase",
    delta: correction.speedDeltaPct,
    unit: "%",
    reason: correction.description,
    source: "defectRules",
  }]) : [];

  return {
    input: correction
      ? { ...baseInput, injectionSpeedOverride: correction.injectionSpeedOverride }
      : baseInput,
    integration,
    lastDefectFix: {
      defectId: integration.id,
      severity,
      delta: correction ? { injectionSpeed_pct: correction.speedDeltaPct } : undefined,
      notes: correction ? [correction.description] : [...integration.manualChecks],
      appliedCorrections: corrections,
    },
  };
}

export function mapLegacySeverity(sev: any): DefectSeverity {
  const s = String(sev ?? "").toLowerCase();
  if (s === "low" || s === "medium" || s === "high") return s as DefectSeverity;
  return "medium";
}

export default {
  DEFECT_PAGE_CATALOG,
  applyDefectSelection,
  getAutomaticDefectCorrection,
  mapLegacyDefectId,
  mapLegacySeverity,
  resolveDefectIntegration,
};
