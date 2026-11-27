/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Exact 5 swatches from Cyberpunk Matrix theme mockup:
        'ide-bg': '#050a08',           // Background swatch: Dark forest pitch obsidian
        'ide-sidebar': '#07100b',      // Deeper rail & tree surface
        'ide-panel': '#09150f',        // Panel swatch: Dark cyber slate matrix surface
        'ide-border': '#132b1f',       // Subtle cyber cyan-green border
        'ide-border-glow': '#00ff88',  // Glowing border highlight
        'ide-accent': '#00ff88',       // Accent swatch: Vibrant electric matrix neon emerald
        'ide-accent-hover': '#10e885', // Radiant hover emerald
        'ide-text': '#709985',         // Text swatch: Muted cyber sage terminal text
        'ide-text-bright': '#dcf7ec',  // Crisp ice green-white
        'ide-green': '#00ff88',        // Terminal matrix neon green
        'ide-red': '#ff3366',          // Cyberpunk neon crimson
        'ide-blue': '#00f0b5',         // Status swatch: Glowing cyber aquamarine
        'ide-yellow': '#ffb454',       // Neon amber
        'ide-purple': '#00f0b5',       // Cyan status highlight (replaced purple)
        'ide-cyan': '#00f0b5',         // Status swatch: Electric aquamarine cyan
        'diff-add': '#092115',         // Deep matrix green diff
        'diff-remove': '#260a12',      // Deep matrix crimson diff
        'diff-add-highlight': '#103d27',
        'diff-remove-highlight': '#471220',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'matrix-glow': '0 0 15px -2px rgba(0, 255, 136, 0.35)',
        'matrix-card': '0 4px 20px -2px rgba(0, 255, 136, 0.08)',
        'cyan-glow': '0 0 15px -2px rgba(0, 240, 181, 0.35)',
      }
    },
  },
  plugins: [],
}
