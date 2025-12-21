import { DatePipe } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import Vditor from 'vditor'
import { WebComponentCheckboxAccessorDirective } from '../../directives/web-component-checkbox-accessor.directive'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import type { ReqPostData } from '../../models/api.model'
import { ApiService } from '../../services/api.service'
import { NotifyService } from '../../services/notify.service'
import { STORE_KEYS, StoreService } from '../../services/store.service'
import { formatDate } from '../../utils'

@Component({
  selector: 'app-admin-edit',
  imports: [FormsModule, WebComponentCheckboxAccessorDirective, WebComponentInputAccessorDirective, DatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-edit.component.html'
})
export class AdminEditComponent implements OnInit, OnDestroy {
  private static readonly EDOTPR_OPTIONS: IOptions = {
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
          ...AdminEditComponent.EDOTPR_OPTIONS,
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
      return [STORE_KEYS.postDraft(this.getId()), STORE_KEYS.postDraftTime(this.getId())]
    }
    return STORE_KEYS.POST_DRAFT_NEW
  }

  private getPostText() {
    const notify = () => this.notifyService.showMessage('文章内容来自自动保存草稿', 'info')
    const STORE_KEYS = this.getDraftKey()
    if (!Array.isArray(STORE_KEYS)) {
      try {
        const { text, password, title, hide, allow_comment, tags, categories, banner } = JSON.parse(
          this.storeService.getItem(STORE_KEYS) ?? ''
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
    private readonly storeService: StoreService
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

    const STORE_KEYS = this.getDraftKey()
    this.draftTimerId = Number(
      setInterval(() => {
        const text = this.editor?.getValue()
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
