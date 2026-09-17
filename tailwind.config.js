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
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
