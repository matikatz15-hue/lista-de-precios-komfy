import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        azul: "#0047BB",
        naranja: "#FFA400",
        tiza: "#FAF0E6",
        komfy: {
          blue: "#0047BB",
          orange: "#FFA400",
          cream: "#FAF0E6",
          dark: "#1C1C1C",
        },
      },
    },
  },
  plugins: [],
};

export default config;
