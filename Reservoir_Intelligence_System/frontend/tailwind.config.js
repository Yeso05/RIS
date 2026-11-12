/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ris: {
          dark: '#0b0f17',
          panel: '#141c2b',
          card: '#1a2436',
          border: '#2a364f',
          muted: '#8b9bb4',
          accent: '#14b8a6',
          accentDark: '#0d9488',
          amber: '#f59e0b',
          alertRed: '#ef4444',
          text: '#f0f6fc'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
