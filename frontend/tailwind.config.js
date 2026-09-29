/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#152033",
        muted: "#64748b",
        line: "#d9e2ec",
        canvas: "#f5f7fb",
        brand: "#1667b7",
        teal: "#0f8c8c",
      },
      boxShadow: {
        soft: "0 12px 34px rgba(15, 23, 42, 0.07)",
      },
    },
  },
  plugins: [],
};
