/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep forest-green gaming table
        table: {
          50: '#f0fdf0',
          100: '#d0f5d0',
          200: '#a0e8a0',
          300: '#4caf50',
          400: '#2e7d32',
          500: '#1b5e20',
          600: '#174f1c',
          700: '#134017',
          800: '#0f3213',
          900: '#0a220d',
          950: '#061508',
        },
        // Dark charcoal background
        charcoal: {
          50: '#f5f5f5',
          100: '#e0e0e0',
          200: '#bdbdbd',
          300: '#9e9e9e',
          400: '#757575',
          500: '#616161',
          600: '#424242',
          700: '#2d2d2d',
          800: '#1e1e1e',
          900: '#141414',
          950: '#0a0a0a',
        },
        // Warm ivory for cards
        ivory: {
          50: '#fffdf5',
          100: '#fef9e7',
          200: '#fdf3d0',
          300: '#fce9a8',
          400: '#f9dd7e',
          500: '#f5ce4b',
        },
        // Muted gold accents
        gold: {
          50: '#fdf8e8',
          100: '#faecc0',
          200: '#f5d88a',
          300: '#e8c453',
          400: '#d4a839',
          500: '#b8922e',
          600: '#9a7a26',
          700: '#7c621e',
          800: '#5e4a17',
          900: '#403210',
        },
        // Card suit colors
        'suit-red': '#c62828',
        'suit-black': '#1a1a2e',
      },
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        card: ['Georgia', 'serif'],
      },
      animation: {
        'card-deal': 'cardDeal 0.5s ease-out forwards',
        'card-play': 'cardPlay 0.4s ease-in-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        cardDeal: {
          '0%': { transform: 'translateY(-200px) scale(0.5) rotate(-10deg)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1) rotate(0)', opacity: '1' },
        },
        cardPlay: {
          '0%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-20px) scale(1.05)' },
          '100%': { transform: 'translateY(-100px) scale(0.8)', opacity: '0.8' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(212, 168, 57, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(212, 168, 57, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'card': '0 4px 15px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 25px rgba(0, 0, 0, 0.4), 0 0 15px rgba(212, 168, 57, 0.2)',
        'table': 'inset 0 0 100px rgba(0, 0, 0, 0.3)',
        'glow-gold': '0 0 20px rgba(212, 168, 57, 0.4)',
      },
    },
  },
  plugins: [],
};
