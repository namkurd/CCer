import { requireModerator } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ExtractForm } from "./extract-form";
import { ReviewCard } from "./review-card";
import type { Candidate } from "@/lib/seeder/schema";

export const metadata = { title: "Call Seeder · Criticaller" };
export const dynamic = "force-dynamic";

export default async function SeedPage() {
  await requireModerator();
  const supabase = await createClient();
  const count = async (status: string) =>
    (await supabase.from("seed_candidates").select("id", { count: "exact", head: true }).eq("status", status)).count ?? 0;
  const [pending, approved, rejected] = await Promise.all([count("pending"), count("approved"), count("rejected")]);
  const { data: queue } = await supabase
    .from("seed_candidates")
    .select("id, source_url, source_text, qualifies, disqualify_reason, extracted")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(25);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl font-extrabold text-purple">Call Seeder</h1>
      <ExtractForm />
      <p className="text-sm text-ink/70">
        Queue: <b>{pending}</b> pending · <b>{approved}</b> approved · <b>{rejected}</b> rejected
      </p>
      <div className="space-y-6">
        {(queue ?? []).map((q) => (
          <ReviewCard
            key={q.id}
            id={q.id}
            sourceUrl={q.source_url}
            sourceText={q.source_text ?? ""}
            qualifies={q.qualifies}
            disqualifyReason={q.disqualify_reason}
            initial={q.extracted as Candidate & { source_published_at?: string | null }}
          />
        ))}
        {pending === 0 && <p className="text-ink/60">Queue is empty. Paste a source above.</p>}
      </div>
    </div>
  );
}
