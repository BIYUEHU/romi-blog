import { AfterViewInit, Component, ElementRef, forwardRef, Input, OnDestroy, signal, ViewChild } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { bracketMatching, defaultHighlightStyle, indentOnInput, syntaxHighlighting } from '@codemirror/language'
import { Diagnostic, linter, lintKeymap } from '@codemirror/lint'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import type { Extension } from '@codemirror/state'
import { EditorState } from '@codemirror/state'
import {
  crosshairCursor,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection
} from '@codemirror/view'
import { defaultValueCtx, Editor, rootCtx } from '@milkdown/kit/core'
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener'
import { commonmark } from '@milkdown/kit/preset/commonmark'
import { replaceAll } from '@milkdown/kit/utils'
import { iso, Newtype } from 'newtype-ts'
import { pangu } from 'pangu/browser'
import { match } from 'ts-pattern'
import { LoggerService } from '../../services/logger.service'
import { NotifyService } from '../../services/notify.service'
import { DEFAULT_LINT_CONFIG } from '../../shared/constants'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/nord.css'
import { applyFixes, LintError } from 'markdownlint'
import { lint } from 'markdownlint/sync'
import { showErr } from '../../shared/utils'

interface EditorMode
  extends Newtype<
    { readonly EditorMode: unique symbol },
    { readonly _tag: 'Both' } | { readonly _tag: 'Source' } | { readonly _tag: 'Preview' }
  > {}

const isoEditorMode = iso<EditorMode>()

const EditorMode = {
  Both: isoEditorMode.wrap({ _tag: 'Both' }),
  Source: isoEditorMode.wrap({ _tag: 'Source' }),
  Preview: isoEditorMode.wrap({ _tag: 'Preview' })
}

const lintTheme = EditorView.baseTheme({
  '.cm-diagnostic': {
    padding: '3px 6px 3px 8px',
    marginLeft: '-1px',
    display: 'block',
    whiteSpace: 'pre-wrap'
  },
  '.cm-diagnostic-error': { borderLeft: '5px solid #d11' },
  '.cm-diagnostic-warning': { borderLeft: '5px solid #f80' },
  '.cm-diagnostic-info': { borderLeft: '5px solid #999' },
  '.cm-diagnosticAction': {
    font: 'inherit',
    border: 'none',
    padding: '2px 4px',
    backgroundColor: '#444',
    color: 'white',
    borderRadius: '3px',
    marginLeft: '8px',
    cursor: 'pointer'
  },
  '.cm-diagnosticSource': {
    fontSize: '70%',
    opacity: 0.7
  },
  '.cm-lintRange': {
    backgroundPosition: 'left bottom',
    backgroundRepeat: 'repeat-x',
    paddingBottom: '0.7px'
  },
  '.cm-lintRange-error': {
    backgroundImage:
      "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='6' height='3'><path d='m0 3 l2 -2 l1 0 l2 2 l1 0' stroke='%23d11' fill='none' stroke-width='.7'/></svg>\")"
  },
  '.cm-lintRange-warning': {
    backgroundImage:
      "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='6' height='3'><path d='m0 3 l2 -2 l1 0 l2 2 l1 0' stroke='%23f80' fill='none' stroke-width='.7'/></svg>\")"
  },
  '.cm-lintRange-info': {
    backgroundImage:
      "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='6' height='3'><path d='m0 3 l2 -2 l1 0 l2 2 l1 0' stroke='%23999' fill='none' stroke-width='.7'/></svg>\")"
  },
  '.cm-lintRange-active': { backgroundColor: '#fec' },
  '.cm-tooltip-lint': {
    padding: 0,
    margin: 0
  },
  '.cm-lintPoint': {
    position: 'relative',
    '&:after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: '-2px',
      borderLeft: '3px solid transparent',
      borderRight: '3px solid transparent',
      borderBottom: '4px solid #d11'
    }
  },
  '.cm-lintPoint-warning:after': { borderBottomColor: '#f80' },
  '.cm-lintPoint-info:after': { borderBottomColor: '#999' },
  '.cm-panel.cm-panel-lint': {
    position: 'relative',
    '& ul': {
      maxHeight: '100px',
      overflowY: 'auto',
      '& [aria-selected]': {
        backgroundColor: '#ddd',
        '& u': { textDecoration: 'underline' }
      },
      '&:focus [aria-selected]': {
        background_fallback: '#bdf',
        backgroundColor: 'Highlight',
        color_fallback: 'white',
        color: 'HighlightText'
      },
      '& u': { textDecoration: 'none' },
      padding: 0,
      margin: 0
    },
    '& [name=close]': {
      position: 'absolute',
      top: '0',
      right: '2px',
      background: 'inherit',
      border: 'none',
      font: 'inherit',
      padding: 0,
      margin: 0,
      cursor: 'pointer'
    }
  }
})

const basicSetup: Extension = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  lintTheme,
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...completionKeymap,
    ...lintKeymap
  ])
]

@Component({
  selector: 'app-markdown-editor',
  standalone: true,
  templateUrl: './markdown-editor.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MarkdownEditorComponent),
      multi: true
    }
  ]
})
export class MarkdownEditorComponent implements AfterViewInit, OnDestroy, ControlValueAccessor {
  @ViewChild('codemirrorContainer') public readonly codemirrorContainer!: ElementRef<HTMLDivElement>
  @ViewChild('crepeContainer') public readonly editorContainer!: ElementRef<HTMLDivElement>

  @Input() public lintConfig = DEFAULT_LINT_CONFIG

  private onChange: (value: string) => void = () => {}
  private onTouched: () => void = () => {}
  private editor?: Editor
  private cm?: EditorView
  private pendingValue: string | null = null
  private isInternalUpdate = false
  private cmHasFocus = false
  private pendingCmSync: string | null = null

  public readonly currentMode = signal<EditorMode>(EditorMode.Preview)
  public readonly isFullscreen = signal(false)

  public constructor(
    private readonly loggerService: LoggerService,
    private readonly notifyService: NotifyService
  ) {}

  public async ngAfterViewInit() {
    this.initCodemirror()
    await this.initEditor()
    if (!this.pendingValue) return
    this.applyContent(this.pendingValue)
    this.pendingValue = null
  }

  public lint(handler: (errors: LintError[]) => void) {
    for (const errors of Object.values(
      lint({ strings: { content: this.cm?.state.doc.toString() ?? '' }, config: { default: true, ...this.lintConfig } })
    )) {
      handler(errors)
    }
  }

  private createLinter() {
    return linter(async (view) => {
      const diagnostics: Diagnostic[] = []
      this.lint((errors) => {
        for (const error of errors) {
          const line = view.state.doc.line(error.lineNumber)
          diagnostics.push({
            from: line.from,
            to: line.to,
            severity: error.severity,
            message: `${error.ruleNames.join('/')}: ${error.ruleDescription}`
          })
        }
      })
      return diagnostics
    })
  }

  private async initEditorWithValue(initialValue: string = '') {
    try {
      this.editor = await Editor.make()
        .config((ctx) => {
          ctx.set(rootCtx, this.editorContainer.nativeElement)
          ctx.set(defaultValueCtx, initialValue)
        })
        .use(commonmark)
        .use(listener)
        .create()

      this.editor.action((ctx) => {
        const listener = ctx.get(listenerCtx)
        listener.markdownUpdated((_, markdown) => {
          if (this.isInternalUpdate) return

          this.isInternalUpdate = true
          this.syncToCm(markdown)
          this.onChange(markdown)
          this.onTouched()
          this.isInternalUpdate = false
        })
      })
    } catch (err) {
      this.loggerService.error('Failed to create editor:', err)
      this.notifyService.showMessage(`创建编辑器失败: ${showErr(err)}`)
    }
  }

  private async initEditor() {
    await this.initEditorWithValue(this.pendingValue ?? '')
  }

  private initCodemirror() {
    this.cm = new EditorView({
      doc: '',
      extensions: [
        basicSetup,
        markdown(),
        this.createLinter(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !this.isInternalUpdate) {
            const newMd = update.state.doc.toString()
            this.isInternalUpdate = true
            this.syncToCrepe(newMd)
            this.onChange(newMd)
            this.onTouched()
            this.isInternalUpdate = false
          }
        }),
        EditorView.focusChangeEffect.of((_, focusing) => {
          this.cmHasFocus = focusing
          if (!focusing && this.pendingCmSync !== null) {
            const pending = this.pendingCmSync
            this.pendingCmSync = null
            this.applySyncToCm(pending)
          }
          return null
        })
      ],
      parent: this.codemirrorContainer.nativeElement
    })
  }

  private syncToCm(markdown: string) {
    if (!this.cm) return

    if (!this.cmHasFocus) this.applySyncToCm(markdown)
    this.pendingCmSync = markdown
  }

  private applySyncToCm(markdown: string) {
    if (!this.cm) return
    const current = this.cm.state.doc.toString()
    if (current === markdown) return

    const { selection } = this.cm.state
    const cursorPos = selection.main.head

    let start = 0
    let endCurrent = current.length
    let endNew = markdown.length

    while (start < endCurrent && start < endNew && current[start] === markdown[start]) start++

    while (endCurrent > start && endNew > start && current[endCurrent - 1] === markdown[endNew - 1]) {
      endCurrent--
      endNew--
    }

    if (start < endCurrent || start < endNew) {
      this.cm.dispatch({
        changes: { from: start, to: endCurrent, insert: markdown.slice(start, endNew) },
        selection: {
          anchor: Math.min(
            cursorPos >= endCurrent ? cursorPos + (endNew - endCurrent) : cursorPos > start ? endNew : cursorPos,
            markdown.length
          )
        }
      })
    }
  }

  private syncToCrepe(markdown: string) {
    if (!this.editor) return
    this.editor.action(replaceAll(markdown))
  }

  private applyContent(md: string) {
    this.isInternalUpdate = true
    if (this.cm) this.cm.dispatch({ changes: { from: 0, to: this.cm.state.doc.length, insert: md } })
    if (this.editor) this.editor.action(replaceAll(md))
    this.isInternalUpdate = false
  }

  public cycleMode() {
    const modes: Array<EditorMode> = [EditorMode.Preview, EditorMode.Source, EditorMode.Both]
    const currentIndex = modes.indexOf(this.currentMode())
    const nextIndex = (currentIndex + 1) % modes.length
    this.currentMode.set(modes[nextIndex])
  }

  public getModeText(): string {
    return match(isoEditorMode.unwrap(this.currentMode()))
      .with({ _tag: 'Both' }, () => '双栏')
      .with({ _tag: 'Source' }, () => '源码')
      .with({ _tag: 'Preview' }, () => '预览')
      .exhaustive()
  }

  public toggleFullscreen() {
    this.isFullscreen.update((v) => !v)
  }

  public fixAll() {
    if (!this.cm) return
    const content = this.cm.state.doc.toString()
    this.lint((errors) => {
      this.writeValue(applyFixes(content, errors))
      this.notifyService.showMessage('修复完成')
    })
  }

  public pangu() {
    if (!this.cm) return
    this.writeValue(pangu.spacingText(this.cm.state.doc.toString()))
    this.notifyService.showMessage('盘古完成')
  }

  public writeValue(value: string): void {
    if (value === void 0 || value === null) {
      value = ''
    }

    if (!this.cm || !this.editor) {
      this.pendingValue = value
      return
    }

    this.applyContent(value)
  }

  public registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  public ngOnDestroy() {
    this.editor?.destroy()
    this.cm?.destroy()
  }

  protected readonly EditorMode = EditorMode
}
