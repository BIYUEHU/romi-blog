import { defineConfig, presetAttributify, presetUno } from 'unocss'

export default defineConfig({
  cli: {
    entry: {
      patterns: ['src/**/*.{html,ts}'],
      outFile: 'src/app/styles/uno.css'
    }
  },
  presets: [presetAttributify({}), presetUno()]
  // rules: [['m-1', { margin: '1px' }]]
})
