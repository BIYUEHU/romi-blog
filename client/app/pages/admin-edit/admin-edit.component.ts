import { CUSTOM_ELEMENTS_SCHEMA, Component, OnDestroy, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { ApiService } from '../../services/api.service'
import type { ReqPostData } from '../../models/api.model'
import { WebComponentCheckboxAccessorDirective } from '../../directives/web-component-checkbox-accessor.directive'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import Vditor from 'vditor'
import { NotifyService } from '../../services/notify.service'

@Component({
  selector: 'app-admin-edit',
  standalone: true,
  imports: [FormsModule, WebComponentCheckboxAccessorDirective, WebComponentInputAccessorDirective],
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
            this.editor?.setValue(this.postForm.text)
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
    modified: Date.now(),
    tags: [],
    categories: [],
    banner: null
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
    private readonly notifyService: NotifyService
  ) {}

  public ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'))
    if (id && !Number.isNaN(Number(id))) {
      this.isEdit = true
      this.isLoading = true
      this.apiService.getPost(id).subscribe({
        next: (post) => {
          const created = new Date(post.created * 1000)
          const addZero = (num: number) => (num < 10 ? `0${num}` : num)
          this.postForm = {
            ...post,
            created: `${created.getFullYear()}-${addZero(created.getMonth() + 1)}-${addZero(created.getDate())}T${addZero(created.getHours())}:${addZero(created.getMinutes())}`
          }
          this.isLoading = false
        },
        error: (error) => {
          console.error('Failed to load post:', error)
          this.isLoading = false
        }
      })
    } else {
      this.isLoading = false
    }

    this.apiService.getMetas().subscribe((metas) => {
      this.allTags = metas.filter(({ is_category }) => !is_category).map(({ name }) => name)
      this.allCategories = metas.filter(({ is_category }) => is_category).map(({ name }) => name)
    })
  }

  public ngOnDestroy() {
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
    this.postForm.text = this.editor?.getValue() ?? this.postForm.text
    if (!this.postForm.title || !this.postForm.text) {
      this.notifyService.showMessage('标题和内容不能为空', 'warning')
      return
    }

    const form = {
      ...this.postForm,
      created: Math.floor(new Date(this.postForm.created).getTime() / 1000),
      modified: Math.floor(Date.now() / 1000)
    }

    const request = this.isEdit
      ? this.apiService.updatePost(Number(this.route.snapshot.paramMap.get('id')), form)
      : this.apiService.createPost(form)

    request.subscribe(() => {
      this.notifyService.showMessage('文章保存成功', 'success')
      this.goBack()
    })
  }

  public goBack() {
    this.router.navigate(['/admin/posts'])
  }
}
