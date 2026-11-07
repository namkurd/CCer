import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireModerator() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return notFound();
  const { data: p } = await supabase.from("profiles").select("is_moderator").eq("id", data.user.id).single();
  if (!p?.is_moderator) return notFound();
  return data.user;
}
