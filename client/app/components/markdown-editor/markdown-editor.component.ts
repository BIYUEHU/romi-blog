import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { bracketMatching, defaultHighlightStyle, indentOnInput, syntaxHighlighting } from '@codemirror/language'
import { lintKeymap } from '@codemirror/lint'
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
  rectangularSelection
} from '@codemirror/view'
import { defaultValueCtx, Editor, rootCtx } from '@milkdown/kit/core'
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener'
import { commonmark } from '@milkdown/kit/preset/commonmark'
import { nord } from '@milkdown/theme-nord'
import { LoggerService } from '../../services/logger.service'
import { NotifyService } from '../../services/notify.service'

const basicSetup: Extension = [
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
  template: `
      <div class="container">
        <!-- 左侧：纯净 CodeMirror 源码区 -->
        <div #codemirrorContainer class="codemirror-editor"></div>

        <!-- 右侧：Milkdown Crepe 所见即所得区 -->
        <div #crepeContainer class="crepe-editor"></div>
      </div>

      <div style="padding: 16px; background: #f8f9fa;">
        <button (click)="toggleMode()">切换模式（当前：{{ currentMode === 'crepe' ? 'Crepe 编辑' : '源码编辑' }}）</button>
      </div>
    `,
  styles: [
    `
            .container {
                display: flex;
                height: 600px; /* 可自行调整或用 vh */
                border: 1px solid #ddd;
                border-radius: 8px;
                overflow: hidden;
            }

            .codemirror-editor,
            .crepe-editor {
                flex: 1;
                overflow: auto;
            }

            .codemirror-editor {
                border-right: 1px solid #ddd;
            }
        `
  ],
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

  private onChange: (value: string) => void = () => {}
  private onTouched: () => void = () => {}
  private editor!: Editor
  private cm!: EditorView
  private isUpdatingFromCm = false
  private isUpdatingFromCrepe = false
  private lastSyncedContent: string = ''

  public currentMode: 'crepe' | 'codemirror' = 'crepe'

  public constructor(
    private readonly loggerService: LoggerService,
    private readonly notifyService: NotifyService
  ) {}

  public async ngAfterViewInit() {
    await this.initEditor()
    this.initCodemirror()
  }

  private async initEditor() {
    try {
      this.editor = await Editor.make()
        .config((ctx) => {
          ctx.set(rootCtx, this.editorContainer.nativeElement)
        })
        // .use(nord) // 主题（可换成其他主题）
        .use(commonmark)
        .use(listener)
        .create()
      this.editor.action((ctx) => {
        const listener = ctx.get(listenerCtx)
        listener.markdownUpdated((_, markdown) => {
          if (this.isUpdatingFromCm) return
          if (markdown === this.lastSyncedContent) return

          this.isUpdatingFromCrepe = true
          try {
            const currentCm = this.cm.state.doc.toString()
            if (currentCm !== markdown) {
              this.cm.dispatch({
                changes: { from: 0, to: this.cm.state.doc.length, insert: markdown }
              })
            }
            this.onChange(markdown)
            this.onTouched()
          } finally {
            this.isUpdatingFromCrepe = false
          }
        })
      })
    } catch (err) {
      this.loggerService.error('Fail to create editor:', err)
      this.notifyService.showMessage(`创建编辑器失败：${err instanceof Error ? err.message : String(err)}`)
    }
  }

  private initCodemirror() {
    this.cm = new EditorView({
      doc: '',
      extensions: [
        basicSetup,
        markdown()
        // 这里可以继续关闭你讨厌的智能行为，例如：
        // indent(), bracketMatching(), closeBrackets(), autocompletion() 等
        // 如果要完全纯净，可以只用 basicSetup + markdown()，其他全不加
      ],
      parent: this.codemirrorContainer.nativeElement
    })

    this.cm.dispatch = (_) => {
      if (this.isUpdatingFromCrepe) return

      this.isUpdatingFromCm = true
      try {
        const newMd = this.cm.state.doc.toString()
        if (newMd === this.lastSyncedContent) return
        this.setContent(newMd)
        this.onChange(newMd)
        this.onTouched()
      } finally {
        this.isUpdatingFromCm = false
      }
    }
  }

  public toggleMode() {
    this.currentMode = this.currentMode === 'crepe' ? 'codemirror' : 'crepe'
    // 可以加动画或隐藏/显示逻辑，这里简化处理
    // 如果想完全隐藏一个，可以用 *ngIf 或 CSS display: none
  }

  public writeValue(value: string): void {
    if (value !== undefined && value !== this.getContent()) {
      this.setContent(value)
    }
  }

  public registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  public getContent(): string {
    return this.cm?.state.doc.toString() ?? ''
  }

  public setContent(md: string) {
    if (!this.cm || !this.editor) return
    this.isUpdatingFromCm = true
    this.cm.dispatch({ changes: { from: 0, to: this.cm.state.doc.length, insert: md } })
    this.editor.action((ctx) => ctx.set(defaultValueCtx, md))
    this.isUpdatingFromCm = false
  }

  public ngOnDestroy() {
    this.editor?.destroy().then()
    this.cm?.destroy()
  }
}
