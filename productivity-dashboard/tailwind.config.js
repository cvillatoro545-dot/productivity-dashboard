/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        body:    ["var(--font-body)"],
        mono:    ["var(--font-mono)"],
      },
      colors: {
        ink:   { DEFAULT: "#1E1917", soft: "#2A211A", muted: "#744E3A" },
        cream: { DEFAULT: "#EDE4D8", soft: "#F5EFE6", muted: "#E0D5C5" },
        amber: { accent: "#D87C4F", warm: "#E8956A", deep: "#B8622E" },
        sienna: { DEFAULT: "#D87C4F", light: "#E8956A", dark: "#B8622E" },
        fawn:   { DEFAULT: "#744E3A", light: "#9A6E56", dark: "#4E3422" },
        sage:   { DEFAULT: "#7A9E7E", light: "#A3C4A8", dark: "#5A7A5E" },
        rust:   { DEFAULT: "#C4614A", light: "#D4836E", dark: "#A04030" },
        vanilla: { DEFAULT: "#D2BEA5", soft: "#EDE4D8", muted: "#BBA992" },
      },
    },
  },
  plugins: [],
};
