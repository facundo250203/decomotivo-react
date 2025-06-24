/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#c70000',
        secondary: '#333333',
        accent: '#b30000',
        texto: '#1a1a1a',
        fondo: '#f5f5f5',
        blanco: '#ffffff',
        'gris-claro': '#e0e0e0',
        'gris-medio': '#757575'
      },
      fontFamily: {
        sans: ['Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
      boxShadow: {
        'custom': '0 4px 6px rgba(0, 0, 0, 0.15)',
        'custom-lg': '0 15px 25px rgba(0, 0, 0, 0.2)',
        'custom-xl': '0 8px 15px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
}