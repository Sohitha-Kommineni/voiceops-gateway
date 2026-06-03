/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#F8FAFC",
        panel: "#0F131A",
        card: "#141922",
        line: "#232A36",
        ok: "#34D399",
        warn: "#F59E0B",
        bad: "#F87171",
        steel: "#94A3B8",
        cyan: "#22D3EE",
        teal: "#2DD4BF",
        blue: "#60A5FA",
        base: "#07090D"
      }
    }
  },
  plugins: []
};
