/** Language -> inferred confidence map (spec 6.1). Editable. `null` = reject unless a % is given. */
export const CONFIDENCE_MAP: { phrases: string; confidence: number | null }[] = [
  { phrases: "guarantee / certain / no doubt / will definitely", confidence: 95 },
  { phrases: "will / is going to (flat assertion)", confidence: 85 },
  { phrases: "very likely / almost certainly", confidence: 85 },
  { phrases: "likely / probably / expect", confidence: 70 },
  { phrases: "could / might / possibly", confidence: null },
];

export function confidenceMapText() {
  return CONFIDENCE_MAP.map(
    (r) => `  "${r.phrases}" -> ${r.confidence ?? "reject (not a call) unless a % is given"}`,
  ).join("\n");
}

export const TOPICS = ["politics", "tech", "science", "economics", "sports", "entertainment"] as const;
