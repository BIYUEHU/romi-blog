import { isDevMode } from '@angular/core'

export const API_BASE_URL = isDevMode()
  ? 'http://localhost:8000/api'
  : typeof process !== 'undefined'
    ? `http://127.0.0.1:${Number((process.env as { PORT: string }).PORT ?? 4200) - 1}/api`
    : '/api'

export const POSTS_PER_PAGE = 10

export const SUPPORTS_HIGHLIGHT_LANGUAGES = [
  'python',
  'javascript',
  'java',
  'c++',
  'c#',
  'php',
  'ruby',
  'go',
  'rust',
  'typescript',
  'kotlin',
  'julia',
  'haskell',
  'perl',
  'lua',
  'r',
  'bash',
  'powershell',
  'html',
  'css',
  'json',
  'yaml',
  'xml',
  'yaml',
  'toml',
  'properties',
  'dotenv',
  'nginx',
  'apache',
  'ini',
  'toml',
  'c',
  'ocaml',
  'markdown'
]
