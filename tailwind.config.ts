import type { Config } from "tailwindcss";

const config: Config = {
  // "lib" se incluye porque las clases bgClass viven en lib/magazine-data.ts
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./context/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          gold: "#D4AF37",
          darkGold: "#AA820A",
          paper: "#FDFBF7",
          ink: "#121316",
          muted: "#6B7280",
          panel: "#1E2026",
          panelBorder: "#2E323D",
          accent: "#38bdf8",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        serif: ["var(--font-playfair)", "serif"],
        display: ["var(--font-cinzel)", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
