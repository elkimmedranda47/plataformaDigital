export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigurado = Boolean(supabaseUrl && supabaseAnonKey);

export const mensajeSinSupabase =
  "Supabase no está configurado. Copia .env.example a .env.local y completa las variables.";

export const supabaseUrlSeguro = supabaseUrl || "https://placeholder.supabase.co";
export const supabaseAnonKeySeguro = supabaseAnonKey || "placeholder-anon-key";
