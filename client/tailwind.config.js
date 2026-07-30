/** Brand palette — single source of truth (spec: two greens + white).
 *  Placeholder hexes; swap when the product owner confirms final values. */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#1B4332",
          DEFAULT: "#2D6A4F",
          light: "#74C69D",
          mist: "#EAF4EE",
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body: ["Montserrat", "sans-serif"],
      },
    },
  },
  plugins: [],
};
