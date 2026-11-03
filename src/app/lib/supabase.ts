import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as typedClient } from "@/integrations/supabase/client";

// The ported screens use hand-written row types, so expose an untyped client.
export const supabase = typedClient as unknown as SupabaseClient;

const TEN_YEARS_SEC = 60 * 60 * 24 * 365 * 10;

// Storage buckets are private; uploaded files get a long-lived signed link.
export async function signedUrl(bucket: string, path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, TEN_YEARS_SEC);
  if (error || !data) throw new Error("ファイルのURLを作成できませんでした");
  return data.signedUrl;
}
