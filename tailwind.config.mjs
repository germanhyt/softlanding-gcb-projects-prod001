/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          black:  '#0A0A0A',
          cream:  '#F5EDD8',
          gold:   '#C9A84C',
          'gold-dark': '#A8834A',
          green:  '#4A7A5A',
        },
        surface: {
          DEFAULT:  '#1C1C1C',
          elevated: '#242424',
          border:   'rgba(201,168,76,0.18)',
        },
      },
      fontFamily: {
        display: ['Work Sans', 'sans-serif'],
        body:    ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        gold:   '0 0 28px rgba(201,168,76,0.18)',
        card:   '0 4px 32px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
