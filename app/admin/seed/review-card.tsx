"use client";

import { useState, useTransition } from "react";
import { approveAction, rejectAction, saveEditAction } from "./actions";
import { TOPICS } from "@/lib/seeder/config";
import type { Candidate } from "@/lib/seeder/schema";

type Props = {
  id: string; sourceUrl: string | null; sourceText: string;
  qualifies: boolean; disqualifyReason: string | null;
  initial: Candidate & { source_published_at?: string | null };
};

export function ReviewCard({ id, sourceUrl, sourceText, qualifies, disqualifyReason, initial }: Props) {
  const [c, setC] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof Candidate>(k: K, v: Candidate[K]) => setC((p) => ({ ...p, [k]: v }));

  const idx = sourceText.toLowerCase().indexOf(c.source_quote.toLowerCase());
  const field = "w-full rounded-md border border-ink/20 bg-white px-2 py-1";

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label className="grid grid-cols-[88px_1fr] items-center gap-2 text-sm">
      <span className="font-semibold text-ink/60">{label}</span>{children}
    </label>
  );

  return (
    <div className="grid overflow-hidden rounded-xl bg-white ring-1 ring-ink/10 md:grid-cols-2">
      <div className="space-y-2 border-b border-ink/10 bg-cream/60 p-4 text-sm md:border-b-0 md:border-r">
        <div className="text-xs font-bold uppercase tracking-wide text-ink/50">Source</div>
        {sourceUrl && <a href={sourceUrl} className="break-all text-purple underline" target="_blank" rel="noreferrer">{sourceUrl}</a>}
        <p className="max-h-72 overflow-auto whitespace-pre-wrap leading-relaxed">
          {idx >= 0 ? (<>
            {sourceText.slice(Math.max(0, idx - 300), idx)}
            <mark className="rounded bg-contested/30 px-0.5">{sourceText.slice(idx, idx + c.source_quote.length)}</mark>
            {sourceText.slice(idx + c.source_quote.length, idx + c.source_quote.length + 300)}
          </>) : (c.source_quote || sourceText.slice(0, 600))}
        </p>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-ink/50">
          Extracted call
          {qualifies ? <span className="text-green">✅ qualifies</span> : <span className="text-false">⚠ {disqualifyReason ?? "does not qualify"}</span>}
        </div>
        <Row label="Caller"><input className={field} value={c.figure_name} onChange={(e) => set("figure_name", e.target.value)} /></Row>
        <Row label="Title"><input className={field} value={c.title} onChange={(e) => set("title", e.target.value)} /></Row>
        <Row label="Subject"><input className={field} value={c.subject} onChange={(e) => set("subject", e.target.value)} /></Row>
        <Row label="Predicate"><input className={field} value={c.predicate} onChange={(e) => set("predicate", e.target.value)} /></Row>
        <Row label="Deadline"><input type="date" className={field} value={c.deadline ?? ""} onChange={(e) => set("deadline", e.target.value || null)} /></Row>
        <Row label="Confidence">
          <span className="flex items-center gap-2">
            <input type="number" min={1} max={99} className={`${field} !w-20`} value={c.confidence ?? ""}
              onChange={(e) => set("confidence", e.target.value ? Number(e.target.value) : null)} />
            <select className={field} value={c.confidence_source} onChange={(e) => set("confidence_source", e.target.value as Candidate["confidence_source"])}>
              <option value="stated">stated</option><option value="inferred">inferred</option><option value="none">none</option>
            </select>
          </span>
        </Row>
        {c.confidence_quote && <p className="pl-[96px] text-xs italic text-ink/60">“{c.confidence_quote}”</p>}
        <Row label="Success if"><input className={field} value={c.success_if} onChange={(e) => set("success_if", e.target.value)} /></Row>
        <Row label="Failure if"><input className={field} value={c.failure_if} onChange={(e) => set("failure_if", e.target.value)} /></Row>
        <Row label="Topic">
          <select className={field} value={c.topic} onChange={(e) => set("topic", e.target.value as Candidate["topic"])}>
            {TOPICS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Row>
        {msg && <p className="text-sm text-false">{msg}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button disabled={pending} className="btn-secondary !py-1.5 !border-false !text-false hover:!bg-false hover:!text-white"
            onClick={() => start(() => rejectAction(id))}>Reject</button>
          <button disabled={pending} className="btn-secondary !py-1.5" onClick={() => start(async () => { await saveEditAction(id, c); setMsg(null); })}>Save edit</button>
          <button disabled={pending} className="btn-primary !py-1.5" onClick={() => start(async () => {
            const r = await approveAction(id, c); setMsg(r.error ?? null);
          })}>Approve ✓</button>
        </div>
      </div>
    </div>
  );
}
