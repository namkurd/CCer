export function slugify(s: string, max = 60) {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, max).replace(/-$/, "");
}
export const withSuffix = (s: string) => `${s}-${Math.random().toString(36).slice(2, 6)}`;
