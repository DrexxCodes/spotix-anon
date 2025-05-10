import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class", "dark"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Main brand color
        primary: {
          DEFAULT: "#6b2fa5",
          50: "#f4eefa",
          100: "#e9def5",
          200: "#d3bcea",
          300: "#bd9ade",
          400: "#a779d3",
          500: "#9158c7",
          600: "#7b3cbc",
          700: "#6b2fa5", // Brand color
          800: "#5a2589",
          900: "#491c6e",
          950: "#2d1144",
        },
        // Anonymous theme colors
        anonymous: {
          dark: "#1a0b29",
          light: "#f0e8f7",
          accent: "#ff3d71",
          muted: "#9b8bb0",
        },
        // For light/dark mode
        background: {
          DEFAULT: "hsl(var(--background))",
          secondary: "hsl(var(--background-secondary))",
        },
        foreground: "hsl(var(--foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(-2px, -2px)" },
          "60%": { transform: "translate(2px, 2px)" },
          "80%": { transform: "translate(2px, -2px)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        encoding: {
          "0%": { transform: "translateY(0) scaleX(1)" },
          "50%": { transform: "translateY(-5px) scaleX(0.95)" },
          "100%": { transform: "translateY(0) scaleX(1)" },
        },
      },
      animation: {
        glitch: "glitch 0.3s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-in-out",
        "fade-out": "fade-out 0.3s ease-in-out",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
        encoding: "encoding 0.3s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
