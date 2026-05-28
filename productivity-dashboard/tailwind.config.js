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
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        ink: { DEFAULT: "#0D0D0D", soft: "#1A1A1A", muted: "#2A2A2A" },
        cream: { DEFAULT: "#F5F0E8", soft: "#FAF7F2", muted: "#EDE8DF" },
        amber: { accent: "#D4A853", warm: "#E8C47A", deep: "#B8872A" },
        sage: { DEFAULT: "#7A9E7E", light: "#A3C4A8", dark: "#5A7A5E" },
        rust: { DEFAULT: "#C4614A", light: "#D4836E", dark: "#A04030" },
      },
    },
  },
  plugins: [],
};
