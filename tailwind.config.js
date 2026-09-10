/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        primary: 'hsl(var(--primary))',
        secondary: 'hsl(var(--secondary))',
        background: 'rgb(var(--background))',
        card: 'rgb(var(--card))',
        foreground: 'rgb(var(--foreground))',
        border: 'rgb(var(--border))',
        muted: 'rgb(var(--muted))',
        'muted-foreground': 'rgb(var(--muted-foreground))',
        'muted-solid': 'rgb(var(--muted-solid))',
      },
      borderRadius: {
        cc: 'var(--radius)',
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Kanit', 'Geist', 'sans-serif'],
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'slide-up': {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in .4s ease forwards',
        'slide-up': 'slide-up .45s cubic-bezier(.22,1,.36,1) forwards',
      },
    },
  },
  plugins: [],
};
