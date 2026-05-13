import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#070A10",
        panel: "#0B1320",
        line: "#1F2A3D",
        accent: "#47A8FF",
        success: "#43E67B",
        danger: "#F87171"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glass: "0 12px 40px rgba(11,19,32,.4)"
      }
    }
  },
  plugins: []
};

export default config;
