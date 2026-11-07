import "server-only";
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { confidenceMapText } from "./config";
import { extractionSchema, type Candidate } from "./schema";

export const EXTRACT_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";

export type ExtractInput = {
  sourceText: string;
  sourceUrl?: string | null;
  figureName?: string | null;
  publishedAt?: string | null;
};

function systemPrompt() {
  const file = path.join(process.cwd(), "lib/prompts/extract-calls.md");
  return fs.readFileSync(file, "utf8").replace("{{CONFIDENCE_MAP}}", confidenceMapText());
}

/** Fetch a URL and reduce it to readable text. */
export async function fetchSourceText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "user-agent": "CriticallerSeeder/0.1" } });
  if (!res.ok) throw new Error(`Fetch failed (${res.status}) for ${url}`);
  const html = await res.text();
  return html
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60_000);
}

/** Verbatim-quote guard: a candidate whose quote isn't in the source can't qualify. */
function normalize(s: string) {
  return s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim().toLowerCase();
}

export async function extractCandidates(input: ExtractInput): Promise<Candidate[]> {
  const client = new Anthropic();
  const user = [
    `Figure: ${input.figureName || "(unknown; identify from the text)"}`,
    `Source URL: ${input.sourceUrl || "(none)"}`,
    `Source published: ${input.publishedAt || "(unknown)"}`,
    "",
    "SOURCE TEXT:",
    input.sourceText,
  ].join("\n");

  const msg = await client.messages.create({
    model: EXTRACT_MODEL,
    max_tokens: 8000,
    system: systemPrompt(),
    messages: [{ role: "user", content: user }],
  });
  const text = msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  const parsed = extractionSchema.parse(JSON.parse(json));

  const haystack = normalize(input.sourceText);
  return parsed.candidates.map((c) => {
    if (c.qualifies && !haystack.includes(normalize(c.source_quote))) {
      return { ...c, qualifies: false, disqualify_reason: "Quote not found verbatim in source" };
    }
    return c;
  });
}
