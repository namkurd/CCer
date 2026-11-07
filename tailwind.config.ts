import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        purple: { DEFAULT: "#5B3FA8", light: "#8E74D6" },
        green: { DEFAULT: "#3F8F45", light: "#8CC084" },
        cream: "#F4F0E6",
        ink: "#1F1B2E",
        true: "#3F8F45",
        false: "#C2413A",
        contested: "#D9A400",
        void: "#8A8A8A",
      },
      fontFamily: {
        heading: ["var(--font-nunito)", "ui-rounded", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
