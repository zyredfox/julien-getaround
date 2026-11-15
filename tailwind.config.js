/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#071018",
          900: "#0f1c2e",
          800: "#1a2f4a",
          700: "#2a4466",
          500: "#5b7394",
          300: "#b7c7db",
          100: "#e4ebf4",
          50: "#f3f7fb",
        },
        accent: {
          DEFAULT: "#0f9f95",
          dark: "#0b7f78",
          soft: "#d7f6f2",
          bright: "#12c4b0",
        },
        signal: {
          DEFAULT: "#ff6b3d",
          soft: "#ffe4d9",
        },
        warn: "#c2410c",
      },
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        display: ['"Fraunces"', "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 10px 28px rgba(7, 16, 24, 0.08)",
        lift: "0 14px 36px rgba(7, 16, 24, 0.14)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "road-drift": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "120px 0" },
        },
        "pulse-dot": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.25)", opacity: "0.7" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.45s ease-out both",
        "road-drift": "road-drift 18s linear infinite",
        "pulse-dot": "pulse-dot 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
