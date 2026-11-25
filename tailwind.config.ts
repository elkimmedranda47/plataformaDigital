import type { Config } from "tailwindcss";

const slate = {
  50: "#fafafa",
  100: "#1a1a1a",
  200: "#1a1a1a",
  300: "#404040",
  400: "#757575",
  500: "#757575",
  600: "#5c5c5c",
  700: "#d6d6d6",
  800: "#e5e5e5",
  900: "#ffffff",
  950: "#ffffff",
};

const cyan = {
  50: "#eef7fb",
  100: "#d9eef7",
  200: "#b9dfef",
  300: "#057dbc",
  400: "#057dbc",
  500: "#057dbc",
  600: "#04699b",
  700: "#03557c",
  800: "#024260",
  900: "#012f45",
  950: "#001c2a",
};

const emerald = {
  50: "#f2f2f2",
  100: "#e5e5e5",
  200: "#d6d6d6",
  300: "#404040",
  400: "#1a1a1a",
  500: "#1a1a1a",
  600: "#000000",
  700: "#000000",
  800: "#000000",
  900: "#000000",
  950: "#000000",
};

const amber = {
  50: "#fbf6e8",
  100: "#f4e7c3",
  200: "#e8d08a",
  300: "#8a5a00",
  400: "#8a5a00",
  500: "#b8860b",
  600: "#8a5a00",
  700: "#6b4700",
  800: "#4d3400",
  900: "#332200",
  950: "#1f1500",
};

const rose = {
  50: "#fdf2f2",
  100: "#fde0e0",
  200: "#fbc6c6",
  300: "#b91c1c",
  400: "#b91c1c",
  500: "#b91c1c",
  600: "#991b1b",
  700: "#7f1d1d",
  800: "#671313",
  900: "#4c0f0f",
  950: "#2c0808",
};

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
        slate,
        cyan,
        emerald,
        amber,
        rose,
        red: rose,
        brand: {
          gold: "#057dbc",
          darkGold: "#04699b",
          paper: "#ffffff",
          ink: "#1a1a1a",
          muted: "#757575",
          panel: "#ffffff",
          panelBorder: "#e5e5e5",
          accent: "#057dbc",
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
