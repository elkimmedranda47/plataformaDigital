import type { Metadata } from "next";
import { Cinzel, Inter, Playfair_Display } from "next/font/google";
import Header from "@/components/Header";
import { MagazineProvider } from "@/context/MagazineContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["300", "400", "500", "600", "700"] });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", weight: ["600", "800"], style: ["normal", "italic"] });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", weight: ["500", "700", "900"] });

export const metadata: Metadata = {
  title: "Plataforma de Diagnóstico & Revista Digital de Talentos Tech | Valle del Cauca",
  description: "Diagnóstico junior de GitHub y revista digital de talentos tech del Valle del Cauca.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`h-full ${inter.variable} ${playfair.variable} ${cinzel.variable}`}>
      <body className="bg-slate-950 text-slate-100 font-sans min-h-screen flex flex-col antialiased selection:bg-brand-gold selection:text-slate-950">
        <MagazineProvider>
          <Header />
          <main className="flex-1 flex flex-col relative">{children}</main>
        </MagazineProvider>
      </body>
    </html>
  );
}
