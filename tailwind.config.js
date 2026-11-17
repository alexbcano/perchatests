/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        paper: 'color-mix(in srgb, var(--paper) calc(<alpha-value> * 100%), transparent)',
        surface: 'color-mix(in srgb, var(--surface) calc(<alpha-value> * 100%), transparent)',
        ink: 'color-mix(in srgb, var(--ink) calc(<alpha-value> * 100%), transparent)',
        muted: 'color-mix(in srgb, var(--muted) calc(<alpha-value> * 100%), transparent)',
        line: 'color-mix(in srgb, var(--line) calc(<alpha-value> * 100%), transparent)',
        tile: 'color-mix(in srgb, var(--tile) calc(<alpha-value> * 100%), transparent)',
        accent: 'color-mix(in srgb, var(--accent) calc(<alpha-value> * 100%), transparent)',
        'accent-ink': 'color-mix(in srgb, var(--accent-ink) calc(<alpha-value> * 100%), transparent)',
        'accent-soft': 'color-mix(in srgb, var(--accent-soft) calc(<alpha-value> * 100%), transparent)',
        ok: 'color-mix(in srgb, var(--ok) calc(<alpha-value> * 100%), transparent)',
        'ok-soft': 'color-mix(in srgb, var(--ok-soft) calc(<alpha-value> * 100%), transparent)',
        warn: 'color-mix(in srgb, var(--warn) calc(<alpha-value> * 100%), transparent)',
        'warn-soft': 'color-mix(in srgb, var(--warn-soft) calc(<alpha-value> * 100%), transparent)',
        bad: 'color-mix(in srgb, var(--bad) calc(<alpha-value> * 100%), transparent)',
        'bad-soft': 'color-mix(in srgb, var(--bad-soft) calc(<alpha-value> * 100%), transparent)',
      },
      fontFamily: {
        display: ['"Bodoni Moda"', 'Didot', '"Bodoni MT"', 'Georgia', 'serif'],
        sans: ['"Instrument Sans"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', '1rem'],
      },
      boxShadow: {
        sheet: '0 -12px 40px rgb(20 24 43 / 0.18)',
        lift: '0 10px 30px -12px rgb(20 24 43 / 0.28)',
      },
    },
  },
  plugins: [],
};
