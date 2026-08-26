/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sage: '#4D7C4D',
        leaf: '#6B9A67',
        sand: '#D7C2A3',
        cream: '#F8F6F1',
        forest: '#1D3B2A',
      },
      fontFamily: {
        display: ['"Poppins"', 'sans-serif'],
        body: ['"Manrope"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 20px 45px rgba(29, 59, 42, 0.12)',
      },
      backgroundImage: {
        hero: 'radial-gradient(circle at top left, rgba(107,154,103,0.35), transparent 38%), linear-gradient(135deg, #f8f6f1 0%, #f2ebe0 100%)',
      },
    },
  },
  plugins: [],
};
