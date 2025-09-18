/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        casino: {
          red: '#c1121f',
          redDark: '#7a0610',
          redDeep: '#54050a',
          blue: '#1f6feb',
          gold: '#d4af37',
          green: '#21c55d'
        },
        brand: {
          bgFrom: '#0b1220',
          bgTo: '#1a2235'
        }
      },
      boxShadow: {
        glossy: 'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        glossy: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.05) 40%, rgba(0,0,0,0.15) 100%)',
      }
    },
  },
  plugins: [],
}
