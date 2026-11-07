"use client";

import { useActionState } from "react";
import { signInWithEmail, signInWithGoogle } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(signInWithEmail, {} as { message?: string; error?: string });
  return (
    <div className="mt-6 space-y-4">
      <form action={signInWithGoogle}>
        <button className="btn-secondary w-full">Continue with Google</button>
      </form>
      <div className="text-center text-xs text-ink/50">or</div>
      <form action={action} className="space-y-3">
        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-lg border border-ink/20 bg-white px-3 py-2"
        />
        <button disabled={pending} className="btn-primary w-full disabled:opacity-60">
          {pending ? "Sending…" : "Email me a magic link"}
        </button>
        {state.message && <p className="text-sm text-green">{state.message}</p>}
        {state.error && <p className="text-sm text-false">{state.error}</p>}
      </form>
    </div>
  );
}
