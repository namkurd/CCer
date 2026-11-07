/** Usage: pnpm seed:batch seeds/batch-01.csv   (CSV columns: figure,url,text[,published]) */
import fs from "node:fs";
import { parse } from "csv-parse/sync";

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Usage: pnpm seed:batch <file.csv>");
  const { enqueueSource } = await import("../lib/seeder/queue");
  const rows = parse(fs.readFileSync(file, "utf8"), { columns: true, skip_empty_lines: true, trim: true }) as {
    figure?: string; url?: string; text?: string; published?: string;
  }[];
  let total = 0;
  for (const [i, r] of rows.entries()) {
    try {
      const n = await enqueueSource({ figureName: r.figure, sourceUrl: r.url, sourceText: r.text, publishedAt: r.published });
      total += n;
      console.log(`[${i + 1}/${rows.length}] ${r.figure ?? r.url}: ${n} candidate(s)`);
    } catch (e) {
      console.error(`[${i + 1}/${rows.length}] ${r.figure ?? r.url}: FAILED - ${(e as Error).message}`);
    }
  }
  console.log(`Queued ${total} candidates. Review at /admin/seed`);
}
main();
