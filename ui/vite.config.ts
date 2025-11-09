import unocss from 'unocss/vite'
import { defineConfig, PluginOption } from 'vite'
import config from '../uno.config'

export default defineConfig({
  plugins: [
    unocss({
      mode: 'shadow-dom',
      ...config.presets,
      ...config.theme
    }) as PluginOption
  ],
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'RomiUI',
      fileName: 'romi-ui'
    }
  },
  server: {
    port: 4000
  }
})
