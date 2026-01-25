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
  safelist: [
    'bg-red-500',
    'bg-red-600',
    'bg-blue-500',
    'bg-emerald-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-violet-600',
    'bg-amber-500',
    'bg-gray-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
    'bg-lime-500',
    'bg-rose-500',
    'bg-purple-500',
    'bg-yellow-500',
    'text-red-500',
    'text-red-600',
    'text-blue-500',
    'text-indigo-500',
    'text-violet-500',
    'text-violet-600',
    'text-amber-500',
    'text-gray-500',
    'text-pink-500',
    'text-teal-500',
    'text-orange-500',
    'text-cyan-500',
    'text-lime-500',
    'text-rose-500',
    'text-purple-500',
    'text-yellow-500',
  ],
};
