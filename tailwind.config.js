/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0b1730',
          900: '#0f1f3d',
          800: '#16294f',
          700: '#203a68',
        },
        cream: {
          50: '#faf6ee',
          100: '#f3ecdc',
        },
        accent: {
          500: '#e8792c',
          600: '#d1651c',
          700: '#b0530f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
