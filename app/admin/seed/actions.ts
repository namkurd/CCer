"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireModerator } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { enqueueSource } from "@/lib/seeder/queue";
import { approveSchema } from "@/lib/seeder/schema";
import { slugify, withSuffix } from "@/lib/seeder/slug";

type State = { ok?: string; error?: string };

export async function extractAction(_prev: State, form: FormData): Promise<State> {
  await requireModerator();
  const parsed = z
    .object({
      input: z.string().min(1),
      figure: z.string().optional(),
      published: z.string().optional(),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Paste a URL or some text." };
  const { input, figure, published } = parsed.data;
  const isUrl = /^https?:\/\/\S+$/.test(input.trim());
  try {
    const n = await enqueueSource({
      figureName: figure || null,
      publishedAt: published || null,
      ...(isUrl ? { sourceUrl: input.trim() } : { sourceText: input }),
    });
    revalidatePath("/admin/seed");
    return { ok: `${n} candidate(s) added to the queue.` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function rejectAction(id: string) {
  await requireModerator();
  await createAdminClient().from("seed_candidates").update({ status: "rejected" }).eq("id", id);
  revalidatePath("/admin/seed");
}

export async function saveEditAction(id: string, extracted: unknown) {
  await requireModerator();
  await createAdminClient().from("seed_candidates").update({ extracted }).eq("id", id);
  revalidatePath("/admin/seed");
}

export async function approveAction(id: string, extracted: unknown): Promise<State> {
  await requireModerator();
  const parsed = approveSchema.safeParse(extracted);
  if (!parsed.success) return { error: parsed.error.issues.map((i) => `${i.path}: ${i.message}`).join("; ") };
  const c = parsed.data;
  const db = createAdminClient();
  const { data: cand } = await db.from("seed_candidates").select("source_url, status").eq("id", id).single();
  if (!cand || cand.status !== "pending") return { error: "Candidate is no longer pending." };

  // Find or create the figure profile.
  const handle = slugify(c.figure_name, 30).replace(/-/g, "_");
  let { data: fig } = await db.from("profiles").select("id").eq("handle", handle).maybeSingle();
  if (!fig) {
    const ins = await db
      .from("profiles")
      .insert({ kind: "figure", handle, display_name: c.figure_name })
      .select("id")
      .single();
    if (ins.error) return { error: ins.error.message };
    fig = ins.data;
  }

  const passed = c.deadline < new Date().toISOString().slice(0, 10);
  const published = (extracted as { source_published_at?: string | null }).source_published_at ?? null;
  const call = await db.from("calls").insert({
    slug: withSuffix(slugify(c.title)),
    caller_id: fig.id,
    origin: "seeded",
    title: c.title,
    subject: c.subject,
    predicate: c.predicate,
    deadline: c.deadline,
    reasoning: c.reasoning,
    success_if: c.success_if,
    failure_if: c.failure_if,
    confidence: c.confidence,
    confidence_source: c.confidence === null ? "none" : c.confidence_source,
    confidence_quote: c.confidence_quote,
    topic: c.topic,
    source_url: cand.source_url,
    source_quote: c.source_quote,
    source_published_at: published ? new Date(published).toISOString() : null,
    verified: Boolean(cand.source_url && published),
    counts_toward_score: true,
    // Past-deadline calls go straight to the resolution queue (engine arrives in phase 1b).
    status: passed ? "pending" : "open",
  });
  if (call.error) return { error: call.error.message };
  await db.from("seed_candidates").update({ status: "approved" }).eq("id", id);
  revalidatePath("/admin/seed");
  return { ok: "Approved" };
}
