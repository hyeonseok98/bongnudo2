import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";

export function getLiveDatabaseClient() {
  return getSupabaseAdminClient();
}
