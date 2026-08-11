import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0A0907",
        surface: "#11100D",
        elevated: "#181611",
        panel: "#15120E",
        line: "#2A2418",
        accent: "#D6B36A",
        success: "#5EC99A",
        danger: "#E47777",
        warning: "#E7B85F"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.035) inset, 0 14px 38px rgba(0,0,0,0.28)",
        elevated: "0 1px 0 rgba(255,255,255,0.05) inset, 0 24px 70px rgba(0,0,0,0.48)",
        glass: "0 18px 56px rgba(0,0,0,.38)"
      }
    }
  },
  plugins: []
};

export default config;
