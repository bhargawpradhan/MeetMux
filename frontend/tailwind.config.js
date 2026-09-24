/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // User's exact Dark Navy & Cyan/Teal Palette
        navy: {
          bg: '#07111F',      // Main Background
          card: '#0D1B2A',    // Card Background
          border: '#1B3448',  // Card Border
          deep: '#050B14',    // Deep Navy
        },
        cyan: {
          bright: '#22D3EE',  // Bright Cyan
          DEFAULT: '#22D3EE',
          primary: '#00B8D9', // Primary Blue
        },
        teal: {
          secondary: '#14B8A6', // Secondary Teal
          DEFAULT: '#14B8A6',
          success: '#2DD4BF',   // Success
        },
        apptext: {
          main: '#E6F1F5',    // Main text
          muted: '#78909C',   // Muted text
        },
        alert: {
          warning: '#FBBF24', // Warning
          critical: '#FF4D5A',// Critical
          success: '#2DD4BF', // Success
        },
        // Mapped rose utility classes for seamless 100% compatibility across all pages
        rose: {
          50: '#0D1B2A',     // Card navy
          100: '#152A3E',    // Subtle panel navy
          200: '#1B3448',    // Card border
          300: '#14B8A6',    // Secondary teal
          400: '#78909C',    // Muted text
          500: '#00B8D9',    // Primary blue
          600: '#22D3EE',    // Bright cyan
          700: '#14B8A6',    // Secondary teal
          800: '#78909C',    // Muted text
          900: '#E6F1F5',    // Main crisp white text
          950: '#07111F',    // Deep background navy
        },
        risk: {
          low: {
            DEFAULT: '#2DD4BF',
            bg: 'rgba(45, 212, 191, 0.12)',
            border: '#14B8A6',
          },
          medium: {
            DEFAULT: '#FBBF24',
            bg: 'rgba(251, 191, 36, 0.12)',
            border: '#FBBF24',
          },
          high: {
            DEFAULT: '#F97316',
            bg: 'rgba(249, 115, 22, 0.12)',
            border: '#F97316',
          },
          critical: {
            DEFAULT: '#FF4D5A',
            bg: 'rgba(255, 77, 90, 0.15)',
            border: '#FF4D5A',
          }
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'cyan-glass': '0 8px 32px rgba(34, 211, 238, 0.12), inset 0 0 0 1px rgba(27, 52, 72, 0.5)',
        'cyan-glow': '0 0 24px rgba(34, 211, 238, 0.45)',
        'pink-glass': '0 8px 32px rgba(13, 27, 42, 0.4), inset 0 0 0 1px rgba(27, 52, 72, 0.7)',
        'pink-glass-lg': '0 12px 48px rgba(7, 17, 31, 0.6), inset 0 0 0 1px rgba(34, 211, 238, 0.25)',
        'pink-glow': '0 0 24px rgba(34, 211, 238, 0.35)',
      },
      backdropBlur: {
        'glass': '16px',
        'glass-heavy': '24px',
      }
    },
  },
  plugins: [],
}
