const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        text: {
          primary: {
            light: colors.black,
            dark: colors.white,
          },
          secondary: {
            light: colors.gray[700],
            dark: colors.gray[400],
          },
        },
        accent: {
          DEFAULT: colors.emerald[400],
          light: colors.emerald[400],
          dark: colors.emerald[400],
        },
        background: {
          primary: {
            light: colors.white,
            dark: colors.black,
          },
          secondary: {
            light: colors.slate[100],
            dark: colors.slate[800],
          },
        },
      },
    },
  },
  plugins: [],
};
