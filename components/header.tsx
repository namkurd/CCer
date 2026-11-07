import Link from "next/link";
import { supabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export async function Header() {
  let email: string | null = null;
  if (supabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    email = data.user?.email ?? null;
  }
  return (
    <header className="border-b border-ink/10 bg-white/60">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-heading text-xl font-extrabold text-purple">
          🐛→🦋 Criticaller
        </Link>
        <nav className="flex items-center gap-4 text-sm font-semibold">
          <Link href="/about" className="hover:text-purple">About</Link>
          {email ? (
            <form action={signOut}>
              <button className="text-ink/70 hover:text-purple" title={email}>Sign out</button>
            </form>
          ) : (
            <Link href="/login" className="btn-primary !py-1.5 text-sm">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
