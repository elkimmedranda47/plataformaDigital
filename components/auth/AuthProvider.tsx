"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseConfigurado } from "@/lib/config";
import { supabaseBrowser } from "@/lib/supabase/client";

type AuthContextValue = {
  user: User | null;
  cargando: boolean;
  configurado: boolean;
  entrar: (email: string, password: string) => Promise<void>;
  registrarse: (nombre: string, email: string, password: string) => Promise<string>;
  salir: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cargando, setCargando] = useState(supabaseConfigurado);

  useEffect(() => {
    if (!supabaseConfigurado) return;

    let activo = true;
    supabaseBrowser.auth.getSession().then(({ data }) => {
      if (!activo) return;
      setUser(data.session?.user ?? null);
      setCargando(false);
    });

    const { data } = supabaseBrowser.auth.onAuthStateChange((_evento, sesion) => {
      setUser(sesion?.user ?? null);
      setCargando(false);
    });

    return () => {
      activo = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const entrar = useCallback(async (email: string, password: string) => {
    const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const registrarse = useCallback(async (nombre: string, email: string, password: string) => {
    const { data, error } = await supabaseBrowser.auth.signUp({
      email,
      password,
      options: { data: { nombre } },
    });
    if (error) throw error;
    return data.session
      ? "Cuenta creada. Ya puedes publicar y comentar."
      : "Cuenta creada. Revisa tu correo para confirmarla antes de entrar.";
  }, []);

  const salir = useCallback(async () => {
    const { error } = await supabaseBrowser.auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo(
    () => ({ user, cargando, configurado: supabaseConfigurado, entrar, registrarse, salir }),
    [user, cargando, entrar, registrarse, salir],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
