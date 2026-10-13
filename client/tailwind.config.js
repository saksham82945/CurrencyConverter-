/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../shared/**/*.{js,ts}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fintech: {
          dark: '#0a0f1d',
          card: '#111827',
          border: '#1f2937',
          muted: '#9ca3af',
          accent: '#10b981', // emerald
          accentHover: '#059669',
          glow: 'rgba(16, 185, 129, 0.15)',
          indigo: '#6366f1',
          danger: '#ef4444'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    },
  },
  plugins: [],
}
