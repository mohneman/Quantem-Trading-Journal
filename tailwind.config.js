/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#00D1C1",
          50: "#ECFDF9",
          100: "#D5F8F2",
          200: "#A9F0E5",
          500: "#00D1C1",
          600: "#00B8AA",
          700: "#0D9488",
        },
        ink: {
          DEFAULT: "#1E293B",
          muted: "#64748B",
          faint: "#94A3B8",
        },
        canvas: "#F5F7FB",
        line: "#E2E8F0",
        loss: {
          DEFAULT: "#EF4444",
          soft: "#FEF2F2",
        },
        purple: {
          brand: "#7C6CF0",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 10px 28px rgba(15, 23, 42, 0.06)",
        modal: "0 24px 64px rgba(15, 23, 42, 0.22)",
        soft: "0 1px 3px rgba(15, 23, 42, 0.06)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(90deg, #00D1C1 0%, #7C6CF0 100%)",
        mesh: "radial-gradient(900px 420px at 0% 0%, rgba(124,108,240,0.10), transparent 55%), radial-gradient(800px 380px at 100% 0%, rgba(20,201,179,0.12), transparent 50%), radial-gradient(700px 400px at 80% 100%, rgba(147,197,253,0.12), transparent 50%)",
      },
    },
  },
  plugins: [],
};
