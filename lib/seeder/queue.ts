import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractCandidates, fetchSourceText, type ExtractInput } from "./extract";

/** Extract from a source and write candidates into the review queue. Returns count queued. */
export async function enqueueSource(input: Omit<ExtractInput, "sourceText"> & { sourceText?: string | null }) {
  const sourceText = input.sourceText?.trim() || (input.sourceUrl ? await fetchSourceText(input.sourceUrl) : "");
  if (!sourceText) throw new Error("Provide a URL or source text");
  const candidates = await extractCandidates({ ...input, sourceText });
  if (candidates.length === 0) return 0;
  const db = createAdminClient();
  const { error } = await db.from("seed_candidates").insert(
    candidates.map((c) => ({
      source_url: input.sourceUrl ?? null,
      source_text: sourceText.slice(0, 20_000),
      figure_name: c.figure_name || input.figureName || null,
      extracted: { ...c, source_published_at: input.publishedAt ?? null },
      qualifies: c.qualifies,
      disqualify_reason: c.disqualify_reason,
    })),
  );
  if (error) throw new Error(error.message);
  return candidates.length;
}
