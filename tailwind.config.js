/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        wood: {
          light: '#8D6E63',
          base: '#5D4037',
          dark: '#3E2723',
          grain: '#4E342E',
        },
        chrome: {
          light: '#F5F5F5',
          base: '#BDBDBD',
          dark: '#616161',
        },
        paper: {
          light: '#FFF8E1',
          lines: '#90CAF9',
        },
        primary: "#38bdf8",
        secondary: "#facc15",
        "tv-dark": "#0a0a0a",
      },
      fontFamily: {
        display: ["'Lobster'", "cursive"],
        hand: ["'Caveat'", "cursive"],
        serif: ["'Playfair Display'", "serif"],
        ui: ["'Roboto Condensed'", "sans-serif"],
      },
      boxShadow: {
        '3d': '0 4px 0px 0px rgba(0,0,0,0.3)',
        'inner-screen': 'inset 0 0 40px 10px rgba(0,0,0,0.8)',
        'knob': '2px 2px 5px rgba(0,0,0,0.5), inset 1px 1px 2px rgba(255,255,255,0.3)',
        'polaroid': '3px 3px 10px rgba(0,0,0,0.3)',
      },
      backgroundImage: {
        'wood-pattern': "repeating-linear-gradient(45deg, #5D4037 0px, #5D4037 10px, #4E342E 10px, #4E342E 12px, #5D4037 12px, #5D4037 24px, #3E2723 24px, #3E2723 26px)",
        'chrome-gradient': "linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 50%, #616161 100%)",
        'brushed-metal': "repeating-linear-gradient(90deg, #ccc 0, #ccc 1px, #bbb 1px, #bbb 2px)",
        'wallpaper': "radial-gradient(#d7ccc8 15%, transparent 16%), radial-gradient(#d7ccc8 15%, transparent 16%)",
      }
    },
  },
  plugins: [],
}
