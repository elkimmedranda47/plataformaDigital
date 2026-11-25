import PublicationForm from "@/components/publication/PublicationForm";

function texto(valor: string | string[] | undefined): string {
  return Array.isArray(valor) ? valor[0] ?? "" : valor ?? "";
}

export default function PublicarPage({
  searchParams,
}: {
  searchParams: { titulo?: string | string[]; descripcion?: string | string[]; github?: string | string[]; stack?: string | string[]; score?: string | string[]; english?: string | string[] };
}) {
  const scoreTexto = texto(searchParams.score);
  const score = Number(scoreTexto);

  return (
    <section className="p-4 md:p-8 max-w-6xl mx-auto w-full">
      <PublicationForm
        titulo={texto(searchParams.titulo)}
        descripcion={texto(searchParams.descripcion)}
        github={texto(searchParams.github)}
        stack={texto(searchParams.stack)}
        score={Number.isFinite(score) ? score : 70}
        english={texto(searchParams.english) || "B1"}
      />
    </section>
  );
}
