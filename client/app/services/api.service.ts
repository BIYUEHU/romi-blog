import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { jwtDecode } from 'jwt-decode'
import { catchError, map, of } from 'rxjs'
import { environment } from '../../environments/environment'
import type {
  AuthUser,
  BangumiData,
  LoginResponse,
  ReqCharacterData,
  ReqHitokotoData,
  ReqMetaData,
  ReqNewsData,
  ReqPostData,
  ReqUserData,
  ResCharacterData,
  ResCommentData,
  ResDashboardData,
  ResHitokotoData,
  ResMetaData,
  ResMusicData,
  ResNewsData,
  ResPostData,
  ResPostSingleData,
  ResProjectData,
  ResSettingsData,
  ResUserData,
  UserAuthData,
  Video
} from '../models/api.model'
import { HEADER_CONTEXT } from '../shared/constants'

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  public constructor(private readonly http: HttpClient) {}

  private genHeaders(attributes: HEADER_CONTEXT[]) {
    return attributes.reduce((header, attribute) => header.set(attribute, ''), new HttpHeaders())
  }

  public getPosts() {
    return this.http.get<ResPostData[]>(`${environment.api_base_url}/post`)
  }

  public getPost(id: number) {
    return this.http.get<ResPostSingleData>(`${environment.api_base_url}/post/${id}`)
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

  public deletePost(id: number) {
    return this.http.delete<void>(`${environment.api_base_url}/post/${id}`)
  }

  public getMetas() {
    return this.http.get<ResMetaData[]>(`${environment.api_base_url}/meta`)
  }

  public createMeta(data: ReqMetaData) {
    return this.http.post<void>(`${environment.api_base_url}/meta`, data)
  }

  public deleteMeta(id: number) {
    return this.http.delete<void>(`${environment.api_base_url}/meta/${id}`)
  }

  public login(username: string, password: string) {
    return this.http
      .post<LoginResponse>(
        `${environment.api_base_url}/user/login`,
        {
          username,
          password
        },
        {
          headers: this.genHeaders([HEADER_CONTEXT.SKIP_ERROR_HANDLING])
        }
      )
      .pipe(
        map((res) => {
          try {
            return {
              ...jwtDecode<AuthUser>(res.token),
              token: res.token
            } as UserAuthData
          } catch {
            return null
          }
        }),
        catchError(() => {
          return of(null)
        })
      )
  }

  public getUsers() {
    return this.http.get<ResUserData[]>(`${environment.api_base_url}/user`)
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
    return this.http.get<ResCommentData[]>(`${environment.api_base_url}/comment`)
  }

  public getCommentsByPost(id: number) {
    return this.http.get<ResCommentData[]>(`${environment.api_base_url}/comment/post/${id}`)
  }

  public sendComment(pid: number, text: string) {
    return this.http.post<void>(`${environment.api_base_url}/comment`, { pid, text })
  }

  public deleteComment(id: number) {
    return this.http.delete<void>(`${environment.api_base_url}/comment/${id}`)
  }

  public getHitokoto(id?: number) {
    return this.http.get<ResHitokotoData>(`${environment.api_base_url}/hitokoto${id ? `/${id}` : ''}`)
  }

  public getHitokotos(isPublic: boolean) {
    return this.http.get<ResHitokotoData[]>(`${environment.api_base_url}/hitokoto/${isPublic ? 'public' : 'all'}`)
  }

  public createHitokoto(data: ReqHitokotoData) {
    return this.http.post<void>(`${environment.api_base_url}/hitokoto`, data)
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
    return this.http.get<ResCharacterData[]>(`${environment.api_base_url}/character`)
  }

  public getCharacter(id: number) {
    return this.http.get<ResCharacterData>(`${environment.api_base_url}/character/${id}`)
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
    return this.http.get<ResNewsData[]>(`${environment.api_base_url}/news`)
  }

  public getNews(id: number) {
    return this.http.get<ResNewsData>(`${environment.api_base_url}/news/${id}`)
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

  public getDashboard() {
    return this.http.get<ResDashboardData>(`${environment.api_base_url}/info/dashboard`)
  }

  public getProjects() {
    return /* isDevMode() ? of([]) : */ this.http.get<ResProjectData[]>(`${environment.api_base_url}/info/projects`)
  }

  public getMusic() {
    return this.http.get<ResMusicData[]>(`${environment.api_base_url}/info/music`)
  }

  public getVideos() {
    return this.http.get<Video[]>('/data/bilibili.json')
  }
}
