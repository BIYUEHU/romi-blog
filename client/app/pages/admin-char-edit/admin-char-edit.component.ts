import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { ApiService } from '../../services/api.service'
import type { ReqCharacterData, ResMusicData } from '../../models/api.model'
import { WebComponentCheckboxAccessorDirective } from '../../directives/web-component-checkbox-accessor.directive'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { NotifyService } from '../../services/notify.service'
import { formatDate } from '../../utils'

@Component({
  selector: 'app-admin-char-edit',
  standalone: true,
  imports: [FormsModule, WebComponentCheckboxAccessorDirective, WebComponentInputAccessorDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-char-edit.component.html'
})
export class AdminCharEditComponent implements OnInit {
  public isEdit = false
  private isLoadingData = false

  public get isLoading() {
    return this.isLoadingData
  }

  private set isLoading(value: boolean) {
    this.isLoadingData = value
  }

  public charForm: Omit<ReqCharacterData, 'birthday'> & { birthday: string | null } = {
    name: '',
    romaji: '',
    color: '',
    song_id: null,
    gender: 'FEMALE',
    alias: [],
    age: null,
    images: [],
    url: [],
    description: '',
    comment: null,
    hitokoto: null,
    birthday: null,
    voice: null,
    series: '',
    series_genre: 'GALGAME',
    tags: [],
    hair_color: null,
    eye_color: null,
    blood_type: null,
    height: null,
    weight: null,
    bust: null,
    waist: null,
    hip: null,
    order: null,
    hide: false
  }

  public tagInput = ''
  public aliasInput = ''
  public imagesInput = ''
  public urlInput = ''
  public songInput = ''
  public allTags: string[] = []
  public filteredTags: string[] = []
  public allSongs: ResMusicData[] = []
  public filteredSongs: ResMusicData[] = []

  public get mainColor() {
    return this.charForm.color ? `#${this.charForm.color}` : ''
  }

  public set mainColor(color: string) {
    this.charForm.color = color.replace('#', '')
  }

  public get songName() {
    return this.charForm.song_id
      ? this.allSongs.find(({ url }) => url.includes(`id=${this.charForm.song_id}.mp3`))?.name
      : ''
  }

  public constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly apiService: ApiService,
    private readonly notifyService: NotifyService
  ) {}

  public ngOnInit() {
    this.apiService.getMusic().subscribe((songs) => {
      this.allSongs = songs
    })

    const id = Number(this.route.snapshot.paramMap.get('id'))
    if (id && !Number.isNaN(Number(id))) {
      this.isEdit = true
      this.isLoading = true
      this.apiService.getCharacters().subscribe((chars) => {
        this.allTags = Array.from(new Set(chars.flatMap(({ tags }) => tags)))
        const char = chars.find(({ id: charId }) => charId === id)
        if (!char) {
          this.notifyService.showMessage('未找到该角色', 'error')
          return
        }
        this.charForm = { ...char, birthday: char.birthday ? formatDate(new Date(char.birthday * 1000)) : null }

        this.isLoading = false
      })
    } else {
      this.isLoading = false
    }
  }

  public searchTags() {
    if (!this.tagInput) {
      this.filteredTags = []
      return
    }
    this.filteredTags = this.allTags.filter(
      (tag) => tag.toLowerCase().includes(this.tagInput.toLowerCase()) && !this.charForm.tags.includes(tag)
    )
    if (!this.filteredTags.includes(this.tagInput)) {
      this.filteredTags.push(this.tagInput)
    }
  }

  public addTag(tag: string) {
    if (!this.charForm.tags.includes(tag)) {
      this.charForm.tags.push(tag)
    }
    this.tagInput = ''
    this.filteredTags = []
  }

  public removeTag(tag: string) {
    this.charForm.tags = this.charForm.tags.filter((t) => t !== tag)
  }

  public addAlias() {
    if (!this.aliasInput) return
    if (!this.charForm.alias.includes(this.aliasInput)) {
      this.charForm.alias.push(this.aliasInput)
    }
    this.aliasInput = ''
  }

  public removeAlias(alias: string) {
    this.charForm.alias = this.charForm.alias.filter((a) => a !== alias)
  }

  public addImage() {
    if (!this.imagesInput) return
    if (!this.charForm.images.includes(this.imagesInput)) {
      this.charForm.images.push(this.imagesInput)
    }
    this.imagesInput = ''
  }

  public removeImage(image: string) {
    this.charForm.images = this.charForm.images.filter((i) => i !== image)
  }

  public searchSongs() {
    if (!this.songInput) {
      this.filteredSongs = []
      return
    }
    this.filteredSongs = this.allSongs
      .filter(
        (song) => song.name.toLowerCase().includes(this.songInput.toLowerCase()) || song.url.includes(this.songInput)
      )
      .slice(0, 5)
  }

  public setSong(song: ResMusicData) {
    this.songInput = ''
    this.filteredSongs = []
    // Example url: https://www.xxx.com/xxxxx?id=123456789.mp3
    const id = Number(song.url.split('id=')[1].split('.')[0])
    if (Number.isNaN(id)) {
      this.notifyService.showMessage(`歌曲链接格式不正确：${song.url}`, 'error')
      return
    }
    this.charForm.song_id = id
  }

  public clearSong() {
    this.charForm.song_id = null
  }

  public addUrl() {
    if (!this.urlInput) return
    if (!this.charForm.url.includes(this.urlInput)) {
      this.charForm.url.push(this.urlInput)
    }
    this.urlInput = ''
  }

  public removeUrl(url: string) {
    this.charForm.url = this.charForm.url.filter((u) => u !== url)
  }

  public saveCharacter() {
    if (
      !this.charForm.name ||
      !this.charForm.romaji ||
      !this.charForm.description ||
      this.charForm.images.length === 0
    ) {
      this.notifyService.showMessage('名字和罗马字和描述不能为空且至少要有一张图片', 'warning')
      return
    }

    const numberKeys = ['age', 'height', 'weight', 'bust', 'waist', 'hip', 'order'] as const
    const form = {
      ...this.charForm,
      birthday: this.charForm.birthday ? Math.floor(new Date(this.charForm.birthday).getTime() / 1000) : null
    }
    for (const key of numberKeys) {
      if (form[key] === null) continue
      form[key] = Number(form[key])
      if (form[key] === 0) form[key] = null
      if (Number.isNaN(form[key]) || (!!form[key] && (form[key] as number) < 0)) {
        this.notifyService.showMessage(`"${key}" 必须为数字`, 'error')
        return
      }
    }

    const request = this.isEdit
      ? this.apiService.updateCharacter(Number(this.route.snapshot.paramMap.get('id')), form)
      : this.apiService.createCharacter(form)

    request.subscribe(() => {
      this.notifyService.showMessage('角色保存成功', 'success')
      this.goBack()
    })
  }

  public goBack() {
    this.router.navigate(['/admin/chars'])
  }
}
