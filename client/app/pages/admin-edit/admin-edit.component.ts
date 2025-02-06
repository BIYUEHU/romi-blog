import { CUSTOM_ELEMENTS_SCHEMA, Component, OnDestroy, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { ApiService } from '../../services/api.service'
import type { ReqPostData } from '../../models/api.model'
import { WebComponentCheckboxAccessorDirective } from '../../directives/web-component-checkbox-accessor.directive'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import Vditor from 'vditor'

@Component({
  selector: 'app-admin-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, WebComponentCheckboxAccessorDirective, WebComponentInputAccessorDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-edit.component.html'
})
export class AdminEditComponent implements OnInit, OnDestroy {
  public isEdit = false
  private isLoadingData = false

  private editor?: Vditor

  public get isLoading() {
    return this.isLoadingData
  }

  private set isLoading(value: boolean) {
    this.isLoadingData = value
    if (!value) setTimeout(() => this.setEditor(), 1000)
  }

  public postForm: ReqPostData = {
    title: '',
    text: '',
    password: '',
    hide: false,
    allow_comment: true,
    created: Math.floor(Date.now() / 1000),
    modified: Math.floor(Date.now() / 1000)
    // tags: [],
    // categories: [],
    // banner: null
  }

  public tagInput = ''
  public categoryInput = ''
  public allTags: string[] = []
  public allCategories: string[] = []
  public filteredTags: string[] = []
  public filteredCategories: string[] = []

  public constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  public ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')
    if (id) {
      this.isEdit = true
      this.loadPost(id)
    } else {
      this.isLoading = false
    }
    // 加载所有标签和分类（这里需要添加相应的API）
    this.loadTagsAndCategories()
  }

  public ngOnDestroy() {
    this.editor?.destroy()
  }

  public setEditor() {
    this.editor = new Vditor('editor', {
      height: 600,
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
        'fullscreen'
      ],
      toolbarConfig: {
        pin: true
      },
      counter: {
        enable: true
      },
      cache: {
        enable: false
      },
      after: () => {
        this.editor?.setValue(this.postForm.text)
      }
    })
  }

  private loadPost(id: string) {
    this.isLoading = true
    this.apiService.getPost(id).subscribe({
      next: (post) => {
        this.postForm = { ...post, password: '' }
        this.isLoading = false
      },
      error: (error) => {
        console.error('Failed to load post:', error)
        this.isLoading = false
      }
    })
  }

  private loadTagsAndCategories() {
    // 这里需要实现加载所有标签和分类的逻辑
    // this.apiService.getTags().subscribe(...)
    // this.apiService.getCategories().subscribe(...)
  }

  public searchTags() {
    if (!this.tagInput) {
      this.filteredTags = []
      return
    }
    this.filteredTags = this.allTags.filter(
      (tag) => tag.toLowerCase().includes(this.tagInput.toLowerCase()) /* &&
        !this.postForm.tags.includes(tag) */
    )
    // 如果没有匹配的标签，允许创建新标签
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
      (category) => category.toLowerCase().includes(this.categoryInput.toLowerCase()) /* &&
        !this.postForm.categories.includes(category) */
    )
    // 如果没有匹配的分类，允许创建新分类
    if (!this.filteredCategories.includes(this.categoryInput)) {
      this.filteredCategories.push(this.categoryInput)
    }
  }

  public addTag(tag: string) {
    // if (!this.postForm.tags.includes(tag)) {
    //   this.postForm.tags.push(tag)
    // }
    this.tagInput = ''
    this.filteredTags = []
  }

  public removeTag(tag: string) {
    // this.postForm.tags = this.postForm.tags.filter(t => t !== tag)
  }

  public addCategory(category: string) {
    // if (!this.postForm.categories.includes(category)) {
    //   this.postForm.categories.push(category)
    // }
    this.categoryInput = ''
    this.filteredCategories = []
  }

  public removeCategory(category: string) {
    // this.postForm.categories = this.postForm.categories.filter(c => c !== category)
  }

  public savePost() {
    if (!this.postForm.title || !this.postForm.text) {
      // 可以添加错误提示
      return
    }

    const id = this.route.snapshot.paramMap.get('id')
    const request = id
      ? this.apiService.updatePost(Number(id), this.postForm)
      : this.apiService.createPost(this.postForm)

    request.subscribe({
      next: () => {
        // 可以添加成功提示
        this.goBack()
      },
      error: (error) => {
        console.error('Failed to save post:', error)
        // 可以添加错误提示
      }
    })
  }

  public goBack() {
    this.router.navigate(['/admin/posts'])
  }
}
