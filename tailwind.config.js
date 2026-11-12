module.exports = {
  darkMode: 'class',
  content: [
    "./public/**/*.html",
    "./public/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        meva: {
          bg: '#0F1117',
          surface: '#161922',
          border: '#232734',
          accent: '#B8A9F5',
          accentHover: '#A78BFA',
          blue: '#93C5FD',
          textMain: '#F8FAFC',
          textMuted: '#94A3B8'
        }
      }
    },
  },
  plugins: [],
}