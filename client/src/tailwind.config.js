module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            color: '#fff',
            a: {
              color: '#3182ce',
              '&:hover': {
                color: '#2c5282'
              }
            }
          }
        }
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
}
