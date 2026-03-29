import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d8e9ff",
          200: "#bad9ff",
          300: "#8fc1ff",
          400: "#5da0ff",
          500: "#347eff",
          600: "#225ee6",
          700: "#1d4dc0",
          800: "#1d429c",
          900: "#1d397d"
        }
      },
      boxShadow: {
        soft: "0 12px 40px rgba(15, 23, 42, 0.10)"
      }
    },
  },
  plugins: [],
};

export default config;
