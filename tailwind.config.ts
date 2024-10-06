import { addDynamicIconSelectors } from "@iconify/tailwind";
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",

        primary: {
          100: "#f8eddb",
          200: "#f6e9d2",
          300: "#f4e5c9",
          400: "#f2e1c0",
          500: "#f0dcb7",
          600: "#eed8ae",
        },
        surface: {
          100: "#8d8c8c",
          200: "#737171",
          300: "#5a5858",
          400: "#423f3f",
          500: "#2b2828",
          600: "#161313",
        },
        mixed: {
          100: "#989593",
          200: "#807c7a",
          300: "#686462",
          400: "#524d4b",
          500: "#3c3835",
          600: "#282320",
        },
      },
    },
  },
  plugins: [
    require("tailwind-scrollbar"),
    addDynamicIconSelectors(),
    require("tailwindcss-animate"),
  ],
};
export default config;

