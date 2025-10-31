import { Injectable } from '@angular/core'
import { BundledLanguage, BundledTheme, createHighlighter, HighlighterGeneric } from 'shiki'
import { SUPPORTS_HIGHLIGHT_LANGUAGES } from '../shared/constants'

@Injectable({ providedIn: 'root' })
export class HighlighterService {
  private highlighterPromise: Promise<HighlighterGeneric<BundledLanguage, BundledTheme>> | null = null

  public getHighlighter(): Promise<HighlighterGeneric<BundledLanguage, BundledTheme>> {
    if (!this.highlighterPromise) {
      this.highlighterPromise = createHighlighter({
        themes: ['vitesse-light'],
        langs: SUPPORTS_HIGHLIGHT_LANGUAGES
      })
    }
    return this.highlighterPromise
  }

  public async dispose(): Promise<void> {
    if (!this.highlighterPromise) return
    try {
      ;(await this.highlighterPromise).dispose()
    } finally {
      this.highlighterPromise = null
    }
  }
}
