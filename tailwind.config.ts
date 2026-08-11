import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#060914",
        surface: "#0B1020",
        elevated: "#10192B",
        panel: "#0C1424",
        line: "#24324B",
        accent: "#72A7FF",
        success: "#55D6A0",
        danger: "#FF7283",
        warning: "#F4C86A"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.055) inset, 0 18px 55px rgba(0,0,0,0.24)",
        elevated: "0 1px 0 rgba(255,255,255,0.07) inset, 0 24px 80px rgba(0,0,0,0.42)",
        glass: "0 20px 70px rgba(2,6,23,.38)",
        focus: "0 0 0 3px rgba(114,167,255,.16)"
      },
      borderRadius: {
        "3xl": "1.5rem"
      }
    }
  },
  plugins: []
};

export default config;
