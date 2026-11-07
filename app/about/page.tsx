export const metadata = { title: "About · Criticaller" };

export default function About() {
  return (
    <article className="space-y-4">
      <h1 className="font-heading text-4xl font-extrabold text-purple">About Criticaller</h1>
      <p>
        Criticaller is a free, non-gambling social site where people post <strong>Calls</strong>: falsifiable
        predictions with a deadline, reasoning, and a confidence percentage. Everyone gets a public track record,
        scored on hit rate and calibration.
      </p>
      <p>No money, no betting, no tokens. Just receipts.</p>
    </article>
  );
}
