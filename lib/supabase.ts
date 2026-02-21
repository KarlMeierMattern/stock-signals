import { createClient } from "@supabase/supabase-js";
import { getEnv } from "./env";

export function getSupabase() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getEnv();
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}
