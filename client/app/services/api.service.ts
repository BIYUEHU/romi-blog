import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Injectable, signal } from '@angular/core'
import { jwtDecode } from 'jwt-decode'
import { catchError, map, of, tap } from 'rxjs'
import { environment } from '../../environments/environment'
import type {
  AuthUser,
  BangumiData,
  LanguageColors,
  ReqCharacterData,
  ReqDecryptPostData,
  ReqHitokoto2Data,
  ReqHitokotoData,
  ReqMetaData,
  ReqNewsData,
  ReqPostData,
  ReqUserData,
  ResCharacterData,
  ResCommentData,
  ResDashboardData,
  ResDecryptPostData,
  ResHitokoto2Data,
  ResHitokotoData,
  ResIpBlacklistItem,
  ResLogEntry,
  ResLogFile,
  ResLoginData,
  ResMetaData,
  ResMusicData,
  ResNewsData,
  ResPostData,
  ResPostSingleData,
  ResProjectData,
  ResSearchResultItem,
  ResSettingsData,
  ResSmtpSettings,
  ResUserData,
  UserAuthData,
  Video
} from '../models/api.model'
import { HEADER_CONTEXT } from '../shared/constants'
import { CommentStatus, RTime } from '../shared/types'
import { CacheService } from './cache.service'

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  public constructor(
    private readonly http: HttpClient,
    private readonly cacheService: CacheService
  ) {}

  private readonly _settings = signal<ResSettingsData>({} as ResSettingsData)

  private genHeaders(attributes: HEADER_CONTEXT[]) {
    return attributes.reduce((header, attribute) => header.set(attribute, ''), new HttpHeaders())
  }

  public readonly settings = this._settings.asReadonly()

  public loadSettings() {
    return this.getSettings().pipe(
      tap((settings) => {
        this._settings.set(settings)
      })
    )
  }

  public getPosts() {
    return this.http.get<ResPostData[]>(`${environment.api_base_url}/post`)
  }

  public getPost(id: number) {
    return this.http.get<ResPostSingleData>(`${environment.api_base_url}/post/${id}`, {
      headers: this.genHeaders([HEADER_CONTEXT.ERROR_REDIRECT])
    })
  }

  public getPostByStrId(str_id: string) {
    return this.http.get<ResPostSingleData>(`${environment.api_base_url}/post/str_id/${str_id}`, {
      headers: this.genHeaders([HEADER_CONTEXT.ERROR_REDIRECT])
    })
  }

  public createPost(data: ReqPostData) {
    return this.http.post<void>(`${environment.api_base_url}/post`, data)
  }

  public updatePost(id: number, data: ReqPostData) {
    return this.http.put<void>(`${environment.api_base_url}/post/${id}`, data)
  }

  public likePost(id: number) {
    return this.http.put<void>(`${environment.api_base_url}/post/like/${id}`, null)
  }

  public viewPost(id: number) {
    return this.http.put<void>(`${environment.api_base_url}/post/view/${id}`, null)
  }

  public decryptPost(id: number, data: ReqDecryptPostData) {
    return this.http
      .post<ResDecryptPostData>(`${environment.api_base_url}/post/decrypt/${id}`, data, {
        headers: this.genHeaders([HEADER_CONTEXT.SKIP_ERROR_HANDLING, HEADER_CONTEXT.NO_CLEAR_ON_ERROR])
      })
      .pipe(catchError(() => of(null)))
  }

  public deletePost(id: number) {
    return this.http.delete<void>(`${environment.api_base_url}/post/${id}`)
  }

  public getMetas() {
    return this.http.get<ResMetaData[]>(`${environment.api_base_url}/meta`, {
      headers: this.genHeaders([HEADER_CONTEXT.ERROR_REDIRECT])
    })
  }

  public createMeta(data: ReqMetaData) {
    return this.http.post<void>(`${environment.api_base_url}/meta`, data)
  }

  public deleteMeta(id: number) {
    return this.http.delete<void>(`${environment.api_base_url}/meta/${id}`)
  }

  public login(email: string, password: string) {
    return this.http
      .post<ResLoginData>(
        `${environment.api_base_url}/user/login`,
        {
          email,
          password
        },
        {
          headers: this.genHeaders([HEADER_CONTEXT.SKIP_ERROR_HANDLING, HEADER_CONTEXT.NO_CLEAR_ON_ERROR])
        }
      )
      .pipe(
        map(
          (res) =>
            ({
              ...jwtDecode<AuthUser>(res.token),
              token: res.token,
              email
            }) as UserAuthData
        ),
        catchError(() => of(null))
      )
  }

  public getUsers() {
    return this.http.get<ResUserData[]>(`${environment.api_base_url}/user`, {
      headers: this.genHeaders([HEADER_CONTEXT.ERROR_REDIRECT])
    })
  }

  public getUser(id: number) {
    return this.http.get<ResUserData>(`${environment.api_base_url}/user/${id}`)
  }

  public createUser(data: ReqUserData) {
    return this.http.post<void>(`${environment.api_base_url}/user`, data)
  }

  public updateUser(id: number, data: ReqUserData) {
    return this.http.put<void>(`${environment.api_base_url}/user/${id}`, data)
  }

  public deleteUser(id: number) {
    return this.http.delete<void>(`${environment.api_base_url}/user/${id}`)
  }

  public getComments() {
    return this.http.get<ResCommentData[]>(`${environment.api_base_url}/comment`, {
      headers: this.genHeaders([HEADER_CONTEXT.ERROR_REDIRECT])
    })
  }

  public getCommentsByPost(id: number) {
    return this.http.get<ResCommentData[]>(`${environment.api_base_url}/comment/post/${id}`)
  }

  public sendComment(pid: number, text: string) {
    return this.http.post<void>(
      `${environment.api_base_url}/comment`,
      { pid, text },
      {
        headers: this.genHeaders([HEADER_CONTEXT.ERROR_REDIRECT])
      }
    )
  }

  public remarkComment(id: number, status: CommentStatus) {
    return this.http.post<void>(
      `${environment.api_base_url}/comment/remark/${id}/${CommentStatus.toNumber(status)}`,
      null
    )
  }

  public deleteComment(id: number) {
    return this.http.delete<void>(`${environment.api_base_url}/comment/${id}`)
  }

  public getHitokoto(id?: number) {
    return this.http.get<ResHitokotoData>(`${environment.api_base_url}/hitokoto${id ? `/${id}` : ''}`, {
      headers: this.genHeaders([HEADER_CONTEXT.ERROR_REDIRECT])
    })
  }

  public getHitokotos(isPublic: boolean) {
    return this.http.get<ResHitokotoData[]>(`${environment.api_base_url}/hitokoto/${isPublic ? 'public' : 'all'}`)
  }

  public createHitokoto(data: ReqHitokotoData) {
    return this.http.post<void>(`${environment.api_base_url}/hitokoto`, data)
  }

  public getHitokoto2() {
    return this.http.get<ResHitokoto2Data>(`${environment.api_base_url}/hitokoto/new`, {
      headers: this.genHeaders([HEADER_CONTEXT.ERROR_REDIRECT])
    })
  }

  public getHitokotos2() {
    return this.http.get<ResHitokoto2Data[]>(`${environment.api_base_url}/hitokoto/new/all`)
  }

  public createHitokoto2(data: ReqHitokoto2Data) {
    return this.http.post<void>(`${environment.api_base_url}/hitokoto/new`, data)
  }

  public updateHitokoto2(uuid: string, data: ReqHitokoto2Data) {
    return this.http.put<void>(`${environment.api_base_url}/hitokoto/new/${uuid}`, data)
  }

  public deleteHitokoto2(uuid: string) {
    return this.http.delete<void>(`${environment.api_base_url}/hitokoto/new/${uuid}`)
  }

  public updateHitokoto(id: number, data: ReqHitokotoData) {
    return this.http.put<void>(`${environment.api_base_url}/hitokoto/${id}`, data)
  }

  public likeHitokoto(id: number) {
    return this.http.put<void>(`${environment.api_base_url}/hitokoto/like/${id}`, {})
  }

  public deleteHitokoto(id: number) {
    return this.http.delete<void>(`${environment.api_base_url}/hitokoto/${id}`)
  }

  public getHitokotoById(id: number) {
    return this.http.get<ResHitokotoData>(`${environment.api_base_url}/hitokoto/${id}`)
  }

  public getCharacters() {
    return this.http.get<ResCharacterData[]>(`${environment.api_base_url}/character`, {
      headers: this.genHeaders([HEADER_CONTEXT.ERROR_REDIRECT])
    })
  }

  public getCharacter(id: number) {
    return this.http.get<ResCharacterData>(`${environment.api_base_url}/character/${id}`, {
      headers: this.genHeaders([HEADER_CONTEXT.ERROR_REDIRECT])
    })
  }

  public createCharacter(data: ReqCharacterData) {
    return this.http.post<void>(`${environment.api_base_url}/character`, data)
  }

  public updateCharacter(id: number, data: ReqCharacterData) {
    return this.http.put<void>(`${environment.api_base_url}/character/${id}`, data)
  }

  public deleteCharacter(id: number) {
    return this.http.delete<void>(`${environment.api_base_url}/character/${id}`)
  }

  public getBangumi(offset: number, isAnime: boolean) {
    return this.http.get<BangumiData>('https://api.bgm.tv/v0/users/himeno/collections', {
      params: {
        limit: 50,
        offset,
        subject_type: isAnime ? 2 : 4
      },
      headers: this.genHeaders([HEADER_CONTEXT.SKIP_BRING_TOKEN])
    })
  }

  public getNewses() {
    return this.http.get<ResNewsData[]>(`${environment.api_base_url}/news`, {
      headers: this.genHeaders([HEADER_CONTEXT.ERROR_REDIRECT])
    })
  }

  public getNews(id: number) {
    return this.http.get<ResNewsData>(`${environment.api_base_url}/news/${id}`, {
      headers: this.genHeaders([HEADER_CONTEXT.ERROR_REDIRECT])
    })
  }

  public likeNews(id: number) {
    return this.http.put<void>(`${environment.api_base_url}/news/like/${id}`, null)
  }

  public viewNews(id: number) {
    return this.http.put<void>(`${environment.api_base_url}/news/view/${id}`, null)
  }

  public createNews(data: ReqNewsData) {
    return this.http.post<void>(`${environment.api_base_url}/news`, data)
  }

  public updateNews(id: number, data: ReqNewsData) {
    return this.http.put<void>(`${environment.api_base_url}/news/${id}`, data)
  }

  public deleteNews(id: number) {
    return this.http.delete<void>(`${environment.api_base_url}/news/${id}`)
  }

  public getSettings() {
    return this.http.get<ResSettingsData>(`${environment.api_base_url}/info/settings`)
  }

  public updateSettings(settings: ResSettingsData) {
    return this.http.put<ResSettingsData>(`${environment.api_base_url}/info/settings`, settings)
  }

  public getDashboard() {
    return this.http.get<ResDashboardData>(`${environment.api_base_url}/info/dashboard`)
  }

  public getProjects() {
    return this.cacheService.wrap(
      'projects',
      () => this.http.get<ResProjectData[]>(`${environment.api_base_url}/info/projects`),
      (data) => data.length > 0,
      RTime.Hour(12),
      RTime.Hour(6)
    )
  }

  public getLanguageColors() {
    return this.cacheService.wrap(
      'language-colors',

      () => this.http.get<LanguageColors>('https://cdn.jsdelivr.net/gh/ozh/github-colors/colors.json'),
      () => true,
      RTime.Day(31),
      RTime.Day(31)
    )
  }

  public getMusic() {
    return this.cacheService.wrap(
      'music',
      () => this.http.get<ResMusicData[]>(`${environment.api_base_url}/info/music`),
      (data) => data.length > 0,
      RTime.Hour(12),
      RTime.Hour(1)
    )
  }

  public getVideos() {
    return this.cacheService.wrap(
      'videos',
      () => this.http.get<Video[]>('/data/bilibili.json'),
      (data) => data.length > 0,
      RTime.Hour(12),
      RTime.Hour(1)
    )
  }

  public search(query: string, page = 1, perPage = 20) {
    return this.http.get<ResSearchResultItem[]>(`${environment.api_base_url}/info/search`, {
      params: { q: query, page, per_page: perPage }
    })
  }

  public getSmtpSettings() {
    return this.http.get<ResSmtpSettings>(`${environment.api_base_url}/info/smtp`)
  }

  public updateSmtpSettings(settings: ResSmtpSettings) {
    return this.http.put<ResSmtpSettings>(`${environment.api_base_url}/info/smtp`, settings)
  }

  public testSmtp(to: string, subject: string, content: string) {
    return this.http.post<void>(`${environment.api_base_url}/info/smtp/test`, { to, subject, content })
  }

  public register(username: string, email: string, url: string | null) {
    return this.http.post<void>(
      `${environment.api_base_url}/user/register`,
      { username, email, url },
      { headers: this.genHeaders([HEADER_CONTEXT.SKIP_ERROR_HANDLING]) }
    )
  }

  public updateProfile(username: string | null, url: string | null, oldPassword: string, newPassword: string | null) {
    return this.http.put<void>(
      `${environment.api_base_url}/user/profile`,
      { username, url, oldPassword, newPassword },
      { headers: this.genHeaders([HEADER_CONTEXT.SKIP_ERROR_HANDLING]) }
    )
  }

  public getLogs() {
    return this.http.get<ResLogFile[]>(`${environment.api_base_url}/info/logs`)
  }

  public getLog(name: string) {
    return this.http.get<ResLogEntry[]>(`${environment.api_base_url}/info/logs/${name}`)
  }

  public getIpBlacklist() {
    return this.http.get<ResIpBlacklistItem[]>(`${environment.api_base_url}/info/security/blacklist`)
  }

  public addIpBlacklist(ip: string, reason: string | null) {
    return this.http.post<void>(`${environment.api_base_url}/info/security/blacklist`, { ip, reason })
  }

  public deleteIpBlacklist(id: number) {
    return this.http.delete<void>(`${environment.api_base_url}/info/security/blacklist/${id}`)
  }
}
