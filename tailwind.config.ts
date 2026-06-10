import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#DD8609',
          soft: '#F0A343',
          deep: '#B46A06'
        },
        navy: {
          DEFAULT: '#102A43',
          soft: '#243B53'
        }
      },
      maxWidth: {
        '7xl': '95rem'
      },
      fontFamily: {
        sans: ['var(--font-body)', 'Open Sans', 'Inter', 'system-ui', 'sans-serif'],
        heading: [
          'var(--font-heading)',
          'ui-serif',
          'Georgia',
          'Cambria',
          'Times New Roman',
          'Times',
          'serif'
        ]
      }
    }
  },
  plugins: []
} satisfies Config;
