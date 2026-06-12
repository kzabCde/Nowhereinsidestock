import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#07090F",
        surface: "#0D1117",
        elevated: "#131C2A",
        panel: "#0B1320",
        line: "#1C2536",
        accent: "#47A8FF",
        success: "#43E67B",
        danger: "#F87171",
        warning: "#FBBF24"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 24px rgba(0,0,0,0.32)",
        elevated: "0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 40px rgba(0,0,0,0.45)",
        glass: "0 12px 40px rgba(11,19,32,.4)"
      }
    }
  },
  plugins: []
};

export default config;
