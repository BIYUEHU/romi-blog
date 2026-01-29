import { AfterViewInit, Component, ElementRef, forwardRef, OnDestroy, signal, ViewChild } from '@angular/core'
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
  lineNumbers,
  rectangularSelection
} from '@codemirror/view'
import { defaultValueCtx, Editor, rootCtx } from '@milkdown/kit/core'
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener'
import { commonmark } from '@milkdown/kit/preset/commonmark'
import { replaceAll } from '@milkdown/kit/utils'
import { iso, Newtype } from 'newtype-ts'
import { match } from 'ts-pattern'
import { LoggerService } from '../../services/logger.service'
import { NotifyService } from '../../services/notify.service'

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

  private onChange: (value: string) => void = () => {}
  private onTouched: () => void = () => {}
  private editor?: Editor
  private cm?: EditorView
  private pendingValue: string | null = null
  private isInternalUpdate = false
  private cmHasFocus = false
  private pendingCmSync: string | null = null

  public currentMode = signal<EditorMode>(EditorMode.Both)
  public isFullscreen = signal(false)

  public constructor(
    private readonly loggerService: LoggerService,
    private readonly notifyService: NotifyService
  ) {}

  public async ngAfterViewInit() {
    this.initCodemirror()
    await this.initEditor()
    if (this.pendingValue !== null) {
      this.applyContent(this.pendingValue)
      this.pendingValue = null
    }
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
      this.notifyService.showMessage(`创建编辑器失败: ${err instanceof Error ? err.message : String(err)}`)
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
        // 监听焦点变化
        EditorView.focusChangeEffect.of((_, focusing) => {
          this.cmHasFocus = focusing
          // 失去焦点时,如果有待同步的内容就同步过去
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

    // 如果 CM 正在编辑中,就不要打断它!缓存起来等失去焦点时再同步
    if (this.cmHasFocus) {
      this.pendingCmSync = markdown
      return
    }

    this.applySyncToCm(markdown)
  }

  private applySyncToCm(markdown: string) {
    if (!this.cm) return
    const current = this.cm.state.doc.toString()
    if (current === markdown) return

    // 保存当前光标位置
    const { selection } = this.cm.state
    const cursorPos = selection.main.head

    // 简单的 diff:找到第一个和最后一个不同的字符位置
    let start = 0
    let endCurrent = current.length
    let endNew = markdown.length

    // 从前往后找第一个不同的位置
    while (start < endCurrent && start < endNew && current[start] === markdown[start]) {
      start++
    }

    // 从后往前找第一个不同的位置
    while (endCurrent > start && endNew > start && current[endCurrent - 1] === markdown[endNew - 1]) {
      endCurrent--
      endNew--
    }

    // 只更新变化的部分
    if (start < endCurrent || start < endNew) {
      const changes = {
        from: start,
        to: endCurrent,
        insert: markdown.slice(start, endNew)
      }

      // 计算新的光标位置
      let newCursorPos = cursorPos
      if (cursorPos >= endCurrent) {
        // 光标在变化区域之后,需要调整偏移
        newCursorPos = cursorPos + (endNew - endCurrent)
      } else if (cursorPos > start) {
        // 光标在变化区域内,放到变化结束位置
        newCursorPos = endNew
      }
      // 否则光标在变化区域之前,位置不变

      this.cm.dispatch({
        changes,
        selection: { anchor: Math.min(newCursorPos, markdown.length) }
      })
    }
  }

  private syncToCrepe(markdown: string) {
    if (!this.editor) return
    this.editor.action(replaceAll(markdown))
  }

  private applyContent(md: string) {
    this.isInternalUpdate = true

    if (this.cm) {
      this.cm.dispatch({
        changes: { from: 0, to: this.cm.state.doc.length, insert: md }
      })
    }

    if (this.editor) {
      this.editor.action(replaceAll(md))
    }

    this.isInternalUpdate = false
  }

  public cycleMode() {
    const modes: Array<EditorMode> = [EditorMode.Both, EditorMode.Source, EditorMode.Preview]
    const currentIndex = modes.indexOf(this.currentMode())
    const nextIndex = (currentIndex + 1) % modes.length
    this.currentMode.set(modes[nextIndex])
  }

  // public getModeText(): string {
  //   match(isoEditorMode.unwrap(this.currentMode())).with(
  //     { _tag: 'both' }, () => ""
  //   )
  //   const mode = this.currentMode()
  //   switch (mode) {
  //     case 'both':
  //       return '双栏'
  //     case 'codemirror':
  //       return '源码'
  //     case 'milkdown':
  //       return '所见即所得'
  //   }
  // }

  public toggleFullscreen() {
    this.isFullscreen.update((v) => !v)
  }

  public writeValue(value: string): void {
    if (value === undefined || value === null) {
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
}
