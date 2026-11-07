"use client";

import { useActionState } from "react";
import { extractAction } from "./actions";

export function ExtractForm() {
  const [state, action, pending] = useActionState(extractAction, {} as { ok?: string; error?: string });
  return (
    <form action={action} className="space-y-2 rounded-xl bg-white p-4 ring-1 ring-ink/10">
      <textarea name="input" required rows={3} placeholder="Paste a URL, or paste text / transcript…"
        className="w-full rounded-lg border border-ink/20 px-3 py-2" />
      <div className="flex flex-wrap gap-2">
        <input name="figure" placeholder="Figure (optional)" className="rounded-lg border border-ink/20 px-3 py-2" />
        <input name="published" type="date" title="Source publish date" className="rounded-lg border border-ink/20 px-3 py-2" />
        <button disabled={pending} className="btn-primary disabled:opacity-60">{pending ? "Extracting…" : "Extract"}</button>
      </div>
      {state.ok && <p className="text-sm text-green">{state.ok}</p>}
      {state.error && <p className="text-sm text-false">{state.error}</p>}
      <p className="text-xs text-ink/50">Batch: <code>pnpm seed:batch seeds/batch-01.csv</code></p>
    </form>
  );
}
