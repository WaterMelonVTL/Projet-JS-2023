/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./*.{html,js,jsx}",
    "./**/*.{html,js}"
  ],
  theme: {
    fontSize: {
      sm: '0.707rem',
      base: '1rem',
      xl: '1.414rem',
      '2xl': '1.999rem',
      '3xl': '2.827rem',
      '4xl': '3.997rem',
      '5xl': '5.652rem',
    },
    fontWeight: {
      low: '200',
      normal: '400',
      bold: '700',
      mid: '550'
    },
    extend: {
      fontFamily: {
        heading: 'Spline Sans',
        body: 'Spline Sans',
      },
      
    },
  },

  plugins: [],
}

