import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKeySeguro, supabaseUrlSeguro } from "@/lib/config";

export const supabaseBrowser = createBrowserClient(supabaseUrlSeguro, supabaseAnonKeySeguro);
