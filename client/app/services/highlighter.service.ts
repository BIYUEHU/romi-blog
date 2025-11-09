import { Injectable } from '@angular/core'
import { BundledLanguage, BundledTheme, bundledLanguages, createHighlighter, HighlighterGeneric } from 'shiki'
import { NotifyService } from './notify.service'

@Injectable({ providedIn: 'root' })
export class HighlighterService {
  private static readonly SUPPORTS_LANGUAGES = Object.entries(bundledLanguages).flatMap(([canonical, def]) => [
    canonical,
    ...('aliases' in def ? (Array.isArray(def.aliases) ? def.aliases : [def.aliases]) : [])
  ])
  private static readonly DEFAULT_LANGUAGES = [
    'javascript',
    'typescript',
    'rust',
    'haskell',
    'bash',
    'markdown',
    'json',
    'json5',
    'html',
    'css'
  ]

  private highlighterPromise: Promise<HighlighterGeneric<BundledLanguage, BundledTheme>> | null = null
  private loadedLangs = new Set<string>()

  public constructor(private readonly notifyService: NotifyService) {}

  public async getHighlighter(langs: string[]): Promise<HighlighterGeneric<BundledLanguage, BundledTheme>> {
    if (!this.highlighterPromise) {
      this.highlighterPromise = createHighlighter({
        themes: ['vitesse-light'],
        langs: HighlighterService.DEFAULT_LANGUAGES
      })
    }

    const highlighter = await this.highlighterPromise

    const unloads = langs.filter((l) => !this.loadedLangs.has(l))
    const validated = unloads.filter((l) => HighlighterService.SUPPORTS_LANGUAGES.includes(l))
    const missed = unloads.filter((l) => !HighlighterService.SUPPORTS_LANGUAGES.includes(l))

    if (validated.length > 0) {
      await highlighter.loadLanguage(...(validated as BundledLanguage[]))
      for (const l of validated) this.loadedLangs.add(l)
    }

    if (missed.length > 0) {
      const msg = missed.join(', ')
      this.notifyService.showMessage(
        `${msg.length > 25 ? `${msg.substring(0, 22)}...` : msg} 语言高亮不支持`,
        'warning'
      )
    }

    return highlighter
  }

  public async dispose(): Promise<void> {
    if (!this.highlighterPromise) return
    try {
      const hl = await this.highlighterPromise
      hl.dispose()
    } finally {
      this.highlighterPromise = null
      this.loadedLangs.clear()
    }
  }
}
