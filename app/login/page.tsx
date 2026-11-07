import { supabaseConfigured } from "@/lib/env";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · Criticaller" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-heading text-3xl font-extrabold text-purple">Sign in</h1>
      {supabaseConfigured ? (
        <LoginForm />
      ) : (
        <p className="mt-4 rounded-md bg-contested/15 p-3 text-sm">
          Supabase isn&apos;t configured. Copy <code>.env.example</code> to <code>.env.local</code> and fill it in.
        </p>
      )}
    </div>
  );
}
