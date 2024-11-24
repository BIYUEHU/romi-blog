import { defineConfig } from 'unocss'

export default defineConfig({
  cli: {
    entry: {
      patterns: ['src/**/*.html'],
      outFile: 'src/app/styles/uno.css'
    }
  }
  // rules: [['m-1', { margin: '1px' }]]
})
