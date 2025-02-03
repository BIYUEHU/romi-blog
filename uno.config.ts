import { resolve } from 'node:path'
import { defineConfig, presetIcons, presetUno, transformerDirectives, transformerVariantGroup } from 'unocss'
import { presetRomiUI } from './ui/src/preset'

export default defineConfig({
  cli: {
    entry: {
      patterns: ['client/**/*.{html,ts}', 'ui/**/*.{html,ts}'],
      outFile: resolve(__dirname, 'ui/styles.css')
    }
  },
  presets: [presetUno(), presetIcons(), presetRomiUI()],

  transformers: [transformerDirectives(), transformerVariantGroup()],
  theme: {
    colors: {
      'primary-100': 'var(--primary-100)',
      'primary-200': 'var(--primary-200)',
      'primary-300': 'var(--primary-300)',
      'primary-400': 'var(--primary-100)',
      'primary-500': 'var(--primary-200)',
      'primary-600': 'var(--primary-300)',
      'primary-700': 'var(--primary-100)',
      'primary-800': 'var(--primary-200)',
      'primary-900': 'var(--primary-300)',
      'accent-100': 'var(--accent-100)',
      'accent-200': 'var(--accent-200)',
      'accent-300': 'var(--accent-300)',
      'accent-400': 'var(--accent-100)',
      'accent-500': 'var(--accent-200)',
      'accent-600': 'var(--accent-300)',
      'accent-700': 'var(--accent-100)',
      'accent-800': 'var(--accent-200)',
      'accent-900': 'var(--accent-300)',
      'text-100': 'var(--text-100)',
      'text-200': 'var(--text-200)',
      'text-300': 'var(--text-300)',
      'bg-100': 'var(--bg-100)',
      'bg-200': 'var(--bg-200)',
      'bg-300': 'var(--bg-300)'
    }
  }
})
