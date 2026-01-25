import { DatePipe } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
import { MarkdownEditorComponent } from '../../components/markdown-editor/markdown-editor.component'
import { WebComponentCheckboxAccessorDirective } from '../../directives/web-component-checkbox-accessor.directive'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import type { ReqPostData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { LoggerService } from '../../services/logger.service'
import { NotifyService } from '../../services/notify.service'
import { STORE_KEYS, StoreService } from '../../services/store.service'
import { formatDate } from '../../utils'

@Component({
  selector: 'app-admin-edit',
  imports: [
    FormsModule,
    WebComponentCheckboxAccessorDirective,
    WebComponentInputAccessorDirective,
    DatePipe,
    MarkdownEditorComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-edit.component.html'
})
export class AdminEditComponent implements OnInit, OnDestroy {
  public isEdit = false

  private getId() {
    return Number(this.route.snapshot.paramMap.get('id'))
  }

  public isLoading = true

  public postForm: Omit<ReqPostData, 'created'> & { created: string } = {
    title: '',
    text: '',
    str_id: null,
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
    if (this.isEdit) return [STORE_KEYS.postDraft(this.getId()), STORE_KEYS.postDraftTime(this.getId())]
    return STORE_KEYS.POST_DRAFT_NEW
  }

  private getPostText(): string {
    const notify = () => this.notifyService.showMessage('文章内容来自自动保存草稿', 'info')
    const STORE_KEYS = this.getDraftKey()
    if (!Array.isArray(STORE_KEYS)) {
      try {
        const { text, password, title, str_id, hide, allow_comment, tags, categories, banner, created } = JSON.parse(
          this.storeService.getItem(STORE_KEYS) ?? ''
        )
        this.postForm = {
          ...this.postForm,
          password: password || null,
          title,
          str_id,
          hide: !!hide,
          allow_comment: !!allow_comment,
          tags,
          categories,
          created,
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
    const [draftKey, draftTimeKey] = STORE_KEYS
    const draft = this.storeService.getItem(draftKey)
    const draftTime = Number(this.storeService.getItem(draftTimeKey))
    if (draft && draftTime && !Number.isNaN(draftTime) && draftTime >= update) {
      if (draft !== this.postForm.text) {
        notify()
        this.lastSaveDraftTime = draftTime
      }
      return draft
    }
    this.storeService.removeItem(draftKey)
    this.storeService.removeItem(draftTimeKey)
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
    private readonly storeService: StoreService,
    private readonly loggerService: LoggerService
  ) {}

  public ngOnInit() {
    const id = this.getId()
    if (id && !Number.isNaN(id)) {
      this.isEdit = true
      this.apiService.getPost(id).subscribe((post) => {
        this.postForm = {
          ...post,
          created: formatDate(new Date(post.created * 1000))
        }
        this.isLoading = false
        this.postForm.text = this.getPostText()
      })
    }

    this.apiService.getMetas().subscribe((metas) => {
      this.allTags = metas.filter(({ is_category }) => !is_category).map(({ name }) => name)
      this.allCategories = metas.filter(({ is_category }) => is_category).map(({ name }) => name)
    })

    const STORE_KEYS = this.getDraftKey()
    this.draftTimerId = Number(
      setInterval(() => {
        const text = /*this.editor?.getMarkdown?.() ??*/ ''
        if (!text || text === this.postForm.text) return

        this.lastSaveDraftTime = Date.now()
        if (Array.isArray(STORE_KEYS)) {
          const [draftKey, draftTimeKey] = STORE_KEYS
          this.storeService.setItem(draftKey, text)
          this.storeService.setItem(draftTimeKey, String(this.lastSaveDraftTime))
        } else {
          this.storeService.setItem(STORE_KEYS, JSON.stringify({ ...this.postForm, text }))
        }
      }, 5 * 1000)
    )
  }

  public ngOnDestroy() {
    if (this.draftTimerId) clearInterval(this.draftTimerId)
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
    this.postForm.text = /* this.editor?.getValue() ?? */ ''
    if (!this.postForm.title || !this.postForm.text) {
      this.notifyService.showMessage('标题和内容不能为空', 'warning')
      return
    }

    // biome-ignore lint: *
    if (this.postForm.str_id && !/^[a-zA-Z][\x00-\x7F]*$/.test(this.postForm.str_id)) {
      this.notifyService.showMessage('语义化地址不符合要求：仅 ASCII 字符且开头非数字', 'error')
      return
    }

    const form = {
      ...this.postForm,
      created: Math.floor(new Date(this.postForm.created || Date.now()).getTime() / 1000),
      modified: Math.floor(Date.now() / 1000)
    }
    const request = this.isEdit ? this.apiService.updatePost(this.getId(), form) : this.apiService.createPost(form)

    request.subscribe(() => {
      if (!this.isEdit) {
        this.storeService.removeItem(STORE_KEYS.POST_DRAFT_NEW)
      }
      this.notifyService.showMessage('文章保存成功', 'success')
      this.goBack()
    })
  }

  public goBack() {
    this.router.navigate(['/admin/posts'])
  }
}
