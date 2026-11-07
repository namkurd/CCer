import Link from "next/link";

export default function Home() {
  return (
    <section className="py-12 text-center">
      <h1 className="font-heading text-5xl font-extrabold text-purple">The front page of tomorrow.</h1>
      <p className="mx-auto mt-4 max-w-xl text-lg text-ink/80">
        Make a call. Show your reasoning. Put a number on it. Get your receipts.
      </p>
      <p className="mt-2 italic text-green">A caterpillar who calls that it will be a butterfly.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/login" className="btn-primary">Sign in</Link>
        <Link href="/about" className="btn-secondary">Learn more</Link>
      </div>
      <p className="mt-10 text-sm text-ink/50">Pundit receipts launching soon.</p>
    </section>
  );
}
