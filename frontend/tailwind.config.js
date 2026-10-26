/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        mint: {
          50: '#f2fcf6',
          100: '#e1f8eb',
          200: '#c5f2d9',
          300: '#9ae6bf',
          400: '#64d29f',
          500: '#3bb982',
          600: '#2a9667',
          700: '#237854',
          800: '#1e5f44',
          900: '#1b4f39',
        },
        charcoal: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5dae2',
          300: '#b0b9c9',
          400: '#8493ac',
          500: '#627391',
          600: '#4d5c77',
          700: '#3f4a61',
          800: '#363e52',
          900: '#1e2430',
          950: '#12161f',
        },
        cream: {
          50: '#fcfdfd',
          100: '#f8faf9',
          200: '#f1f5f3',
          300: '#e6ece9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
