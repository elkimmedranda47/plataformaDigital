import { FaBullseye, FaTriangleExclamation } from "react-icons/fa6";

const difficulties = [
  { title: "Diferenciación Clara:", text: "Diferenciarnos de LinkedIn o portales genéricos. Nuestro foco es exclusivo para el mercado junior de tecnología del Valle del Cauca, entregando plan de mejora e impacto local." },
  { title: "Alcance y Tiempo:", text: "Manejar un alcance doble con tiempo limitado acotando el prototipo hacia el diagnóstico y revista unificada." },
  { title: "Evaluación Realista:", text: "La hoja de vida no muestra GitHub, inglés ni pruebas técnicas; el diagnóstico los evalúa y presenta como camino de mejora." },
  { title: "Habeas Data (Ley 1581 de 2012):", text: "Proteger los datos personales solicitando autorización explícita para publicar proyectos en la revista digital." },
];

export default function Hito5Page() {
  return (
    <section className="p-4 md:p-8 max-w-5xl mx-auto w-full">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
        <h2 className="text-xl font-bold text-amber-400 mb-2 flex items-center gap-2">
          <FaBullseye /> Propósito e Idea Central del Proyecto
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          La plataforma contribuye de forma directa a la idea central de nuestro sueño:{" "}
          <strong>que nadie se entere tarde de lo que le faltaba</strong>. Su diagnóstico le indica al estudiante qué construir y qué
          fortalecer según lo que el mercado pide hoy, y su revista digital le da un lugar donde mostrar lo que ya hace, de modo que
          la experiencia y el portafolio se vayan armando desde la universidad y a la par de la industria y la inteligencia artificial.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-rose-400 mb-4 flex items-center gap-2">
          <FaTriangleExclamation /> ¿Qué dificultades debemos tener presentes?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          {difficulties.map((d) => (
            <div key={d.title} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <strong className="text-cyan-400 block mb-1">{d.title}</strong>
              {d.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
