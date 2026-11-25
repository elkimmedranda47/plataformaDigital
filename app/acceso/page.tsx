import AuthPanel from "@/components/auth/AuthPanel";

export default function AccesoPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  const destino = searchParams.redirect?.startsWith("/") && !searchParams.redirect.startsWith("//")
    ? searchParams.redirect
    : "/top10";

  return (
    <section className="max-w-6xl w-full mx-auto px-4 py-10 md:py-16">
      <div className="text-center mb-8">
        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-400 mb-2">Acceso de estudiantes</p>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100 font-display">Tu cuenta de Talento Tech Valle</h1>
        <p className="text-xs text-slate-400 mt-2">Publica tu primer proyecto y participa en el Top 10 semanal.</p>
      </div>
      <AuthPanel redirect={destino} />
    </section>
  );
}
