/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        airbnb: {
          coral: '#FF385C',
          darkCoral: '#E00B41',
          lightCoral: '#FFF0F2',
          black: '#222222',
          charcoal: '#484848',
          gray: '#717171',
          lightGray: '#B0B0B0',
          border: '#EBEBEB',
          bg: '#F8F9FA',
          card: '#FFFFFF',
        },
        cute: {
          mint: '#10B981',
          mintLight: '#ECFDF5',
          sky: '#0EA5E9',
          skyLight: '#F0F9FF',
          amber: '#F59E0B',
          amberLight: '#FEF3C7',
          purple: '#8B5CF6',
          purpleLight: '#F5F3FF',
          pink: '#EC4899',
          pinkLight: '#FDF2F8',
          peach: '#F97316',
          peachLight: '#FFF7ED',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'cute-sm': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'cute-md': '0 6px 20px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.04)',
        'cute-lg': '0 12px 32px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)',
        'cute-pill': '0 4px 14px rgba(255, 56, 92, 0.25)',
        'cute-tile': '0 4px 0 #E2E8F0, 0 6px 12px rgba(0, 0, 0, 0.04)',
        'cute-tile-active': '0 2px 0 #E2E8F0, 0 3px 6px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        pulseSubtle: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.04)', opacity: '0.9' },
        }
      }
    },
  },
  plugins: [],
}
