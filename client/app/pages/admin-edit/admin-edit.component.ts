import { CUSTOM_ELEMENTS_SCHEMA, Component, OnDestroy, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { ApiService } from '../../services/api.service'
import type { ReqPostData } from '../../models/api.model'
import { WebComponentCheckboxAccessorDirective } from '../../directives/web-component-checkbox-accessor.directive'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import Vditor from 'vditor'
import { NotifyService } from '../../services/notify.service'
import { formatDate } from '../../utils'
import { BrowserService } from '../../services/browser.service'
import { DatePipe } from '@angular/common'

@Component({
  selector: 'app-admin-edit',
  standalone: true,
  imports: [FormsModule, WebComponentCheckboxAccessorDirective, WebComponentInputAccessorDirective, DatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-edit.component.html'
})
export class AdminEditComponent implements OnInit, OnDestroy {
  private readonly editorOptions: IOptions = {
    height: '50rem',
    mode: 'ir',
    typewriterMode: true,
    theme: 'classic',
    toolbar: [
      'emoji',
      'headings',
      'bold',
      'italic',
      'strike',
      'link',
      '|',
      'list',
      'ordered-list',
      'check',
      'outdent',
      'indent',
      '|',
      'quote',
      'line',
      'code',
      'inline-code',
      'insert-before',
      'insert-after',
      '|',
      'upload',
      'record',
      'table',
      '|',
      'undo',
      'redo',
      'fullscreen',
      'edit-mode'
    ],
    toolbarConfig: {
      pin: true
    },
    counter: {
      enable: true
    },
    cache: {
      enable: false
    }
  }

  public isEdit = false
  private isLoadingData = false

  private editor?: Vditor

  private getId() {
    return Number(this.route.snapshot.paramMap.get('id'))
  }

  public get isLoading() {
    return this.isLoadingData
  }

  private set isLoading(value: boolean) {
    this.isLoadingData = value
    if (!value)
      setTimeout(() => {
        this.editor = new Vditor('editor', {
          ...this.editorOptions,
          after: () => {
            this.editor?.setValue(this.getPostText())
          }
        })
      }, 0)
  }

  public postForm: Omit<ReqPostData, 'created'> & { created: string } = {
    title: '',
    text: '',
    password: null,
    hide: false,
    allow_comment: true,
    created: '',
    modified: 0,
    tags: [],
    categories: [],
    banner: null
  }

  public lastSaveDraftTime?: number

  private draftTimerId?: number

  private getDraftKey() {
    if (this.isEdit) {
      const draftKey = `post-draft-${this.getId()}`
      return [draftKey, `${draftKey}-time`]
    }
    return 'post-draft-new'
  }

  private getPostText() {
    if (!this.browserService.isBrowser) return this.postForm.text

    const notify = () => this.notifyService.showMessage('文章内容来自自动保存草稿', 'info')
    const keys = this.getDraftKey()
    if (typeof keys === 'string') {
      try {
        const { text, password, title, hide, allow_comment, tags, categories, banner } = JSON.parse(
          localStorage.getItem(keys) ?? ''
        )
        this.postForm = {
          ...this.postForm,
          password: password || null,
          title,
          hide: !!hide,
          allow_comment: !!allow_comment,
          tags,
          categories,
          banner: banner || null
        }
        notify()
        this.lastSaveDraftTime = Date.now()
        notify()

        return text
      } catch {}
      return this.postForm.text
    }

    const update = this.postForm.modified * 1000
    const [draftKey, draftTimeKey] = keys
    const draft = localStorage.getItem(draftKey)
    const draftTime = Number(localStorage.getItem(draftTimeKey))
    if (draft && draftTime && !Number.isNaN(draftTime) && draftTime >= update) {
      if (draft !== this.postForm.text) {
        notify()
        this.lastSaveDraftTime = draftTime
      }
      return draft
    }
    localStorage.removeItem(draftKey)
    localStorage.removeItem(draftTimeKey)
    return this.postForm.text
  }

  public tagInput = ''
  public categoryInput = ''
  public allTags: string[] = []
  public allCategories: string[] = []
  public filteredTags: string[] = []
  public filteredCategories: string[] = []

  public constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly apiService: ApiService,
    private readonly notifyService: NotifyService,
    private readonly browserService: BrowserService
  ) {}

  public ngOnInit() {
    const id = this.getId()
    if (id && !Number.isNaN(id)) {
      this.isEdit = true
      this.isLoading = true
      this.apiService.getPost(id).subscribe((post) => {
        this.postForm = {
          ...post,
          created: formatDate(new Date(post.created * 1000))
        }
        this.isLoading = false
      })
    } else {
      this.isLoading = false
    }

    this.apiService.getMetas().subscribe((metas) => {
      this.allTags = metas.filter(({ is_category }) => !is_category).map(({ name }) => name)
      this.allCategories = metas.filter(({ is_category }) => is_category).map(({ name }) => name)
    })

    if (!this.browserService.isBrowser) return

    const keys = this.getDraftKey()
    this.draftTimerId = Number(
      setInterval(() => {
        const text = this.editor?.getValue()
        if (!text || text === this.postForm.text) return

        this.lastSaveDraftTime = Date.now()
        if (typeof keys === 'string') {
          localStorage.setItem(keys, JSON.stringify({ ...this.postForm, text }))
        } else {
          const [draftKey, draftTimeKey] = keys
          localStorage.setItem(draftKey, text)
          localStorage.setItem(draftTimeKey, String(this.lastSaveDraftTime))
        }
      }, 5 * 1000)
    )
  }

  public ngOnDestroy() {
    if (this.draftTimerId) clearInterval(this.draftTimerId)
    this.editor?.destroy()
  }

  public searchTags() {
    if (!this.tagInput) {
      this.filteredTags = []
      return
    }
    this.filteredTags = this.allTags.filter(
      (tag) => tag.toLowerCase().includes(this.tagInput.toLowerCase()) && !this.postForm.tags.includes(tag)
    )
    if (!this.filteredTags.includes(this.tagInput)) {
      this.filteredTags.push(this.tagInput)
    }
  }

  public searchCategories() {
    if (!this.categoryInput) {
      this.filteredCategories = []
      return
    }
    this.filteredCategories = this.allCategories.filter(
      (category) =>
        category.toLowerCase().includes(this.categoryInput.toLowerCase()) &&
        !this.postForm.categories.includes(category)
    )
    if (!this.filteredCategories.includes(this.categoryInput)) {
      this.filteredCategories.push(this.categoryInput)
    }
  }

  public addTag(tag: string) {
    if (!this.postForm.tags.includes(tag)) {
      this.postForm.tags.push(tag)
    }
    this.tagInput = ''
    this.filteredTags = []
  }

  public removeTag(tag: string) {
    this.postForm.tags = this.postForm.tags.filter((t) => t !== tag)
  }

  public addCategory(category: string) {
    if (!this.postForm.categories.includes(category)) {
      this.postForm.categories.push(category)
    }
    this.categoryInput = ''
    this.filteredCategories = []
  }

  public removeCategory(category: string) {
    this.postForm.categories = this.postForm.categories.filter((c) => c !== category)
  }

  public savePost() {
    this.postForm.text = this.editor?.getValue() ?? ''
    if (!this.postForm.title || !this.postForm.text) {
      this.notifyService.showMessage('标题和内容不能为空', 'warning')
      return
    }

    const form = {
      ...this.postForm,
      created: Math.floor(new Date(this.postForm.created || Date.now()).getTime() / 1000),
      modified: Math.floor(Date.now() / 1000)
    }
    console.log(form, this.postForm)
    const request = this.isEdit ? this.apiService.updatePost(this.getId(), form) : this.apiService.createPost(form)

    request.subscribe(() => {
      this.notifyService.showMessage('文章保存成功', 'success')
      this.goBack()
    })
  }

  public goBack() {
    this.router.navigate(['/admin/posts'])
  }
}
