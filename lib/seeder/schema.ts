import { z } from "zod";
import { TOPICS } from "./config";

export const candidateSchema = z.object({
  qualifies: z.boolean(),
  disqualify_reason: z.string().nullable().default(null),
  figure_name: z.string().min(1),
  title: z.string().default(""),
  subject: z.string().default(""),
  predicate: z.string().default(""),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  reasoning: z.string().nullable().default(null),
  success_if: z.string().default(""),
  failure_if: z.string().default(""),
  confidence: z.number().int().min(1).max(99).nullable().default(null),
  confidence_source: z.enum(["stated", "inferred", "none"]).default("none"),
  confidence_quote: z.string().nullable().default(null),
  topic: z.enum(TOPICS).default("politics"),
  source_quote: z.string().default(""),
});
export type Candidate = z.infer<typeof candidateSchema>;

export const extractionSchema = z.object({ candidates: z.array(candidateSchema) });

/** Fields a moderator may edit before approving. */
export const approveSchema = candidateSchema.extend({
  title: z.string().min(3),
  subject: z.string().min(1),
  predicate: z.string().min(1),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  success_if: z.string().min(3),
  failure_if: z.string().min(3),
  source_quote: z.string().min(3),
});
