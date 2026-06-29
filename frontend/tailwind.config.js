/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",

  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      fontFamily: {
        tanta: ["TantaFont", "sans-serif"],
      },

      colors: {
        tanta: {
          bg: "#ECC9A9",
          dark: "#26172C",
          primary: "#D18B49",
          secondary: "#C97847",
          darkBg: "#26172C",
          darkAccent: "#56599A",
          darkText: "#F3EFDC",
        },
      },
    },
  },

  plugins: [],
};