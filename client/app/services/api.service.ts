import { Injectable, isDevMode } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import type {
  AuthUser,
  BangumiData,
  LoginResponse,
  ReqHitokotoData,
  ReqMetaData,
  ReqPostData,
  ReqUserData,
  ResCommentData,
  ResDashboardData,
  ResHitokotoData,
  ResMetaData,
  ResPostData,
  ResPostSingleData,
  ResSettingsData,
  ResUserData,
  UserAuthData,
  ResNewsData,
  ReqNewsData,
  Video,
  ResProjectData,
  ResCharacterData
} from '../models/api.model'
import { API_BASE_URL } from '../shared/constants'
import { catchError, map, of } from 'rxjs'
import { jwtDecode } from 'jwt-decode'

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly apiUrl = API_BASE_URL

  public constructor(private readonly http: HttpClient) {}

  private getSkipErrorHandlerHeaders() {
    return new HttpHeaders().set('Skip-Error-Handler', 'true')
  }

  private getSkipBringTokenhHeaders() {
    return new HttpHeaders().set('Skip-Bring-Token', 'true')
  }

  public getPosts() {
    return this.http.get<ResPostData[]>(`${this.apiUrl}/post`)
  }

  public getPost(id: number) {
    return this.http.get<ResPostSingleData>(`${this.apiUrl}/post/${id}`)
  }

  public createPost(data: ReqPostData) {
    return this.http.post<void>(`${this.apiUrl}/post`, data)
  }

  public updatePost(id: number, data: ReqPostData) {
    return this.http.put<void>(`${this.apiUrl}/post/${id}`, data)
  }

  public likePost(id: number) {
    return this.http.post<void>(`${this.apiUrl}/post/${id}/like`, null, {
      headers: this.getSkipErrorHandlerHeaders()
    })
  }

  public viewPost(id: number) {
    return this.http.post<void>(`${this.apiUrl}/post/${id}/view`, null, {
      headers: this.getSkipErrorHandlerHeaders()
    })
  }

  public deletePost(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/post/${id}`)
  }

  public getMetas() {
    return this.http.get<ResMetaData[]>(`${this.apiUrl}/meta`)
  }

  public createMeta(data: ReqMetaData) {
    return this.http.post<void>(`${this.apiUrl}/meta`, data)
  }

  public deleteMeta(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/meta/${id}`)
  }

  public login(username: string, password: string) {
    return this.http
      .post<LoginResponse>(
        `${this.apiUrl}/user/login`,
        {
          username,
          password
        },
        {
          headers: this.getSkipErrorHandlerHeaders()
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
    return this.http.get<ResUserData[]>(`${this.apiUrl}/user`)
  }

  public getUser(id: number) {
    return this.http.get<ResUserData>(`${this.apiUrl}/user/${id}`)
  }

  public createUser(data: ReqUserData) {
    return this.http.post<void>(`${this.apiUrl}/user`, data)
  }

  public updateUser(id: number, data: ReqUserData) {
    return this.http.put<void>(`${this.apiUrl}/user/${id}`, data)
  }

  public deleteUser(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/user/${id}`)
  }

  public getComments() {
    return this.http.get<ResCommentData[]>(`${this.apiUrl}/comment`)
  }

  public getCommentsByPost(id: number) {
    return this.http.get<ResCommentData[]>(`${this.apiUrl}/comment/${id}`)
  }

  public sendComment(pid: number, text: string) {
    return this.http.post<void>(`${this.apiUrl}/comment`, { pid, text })
  }

  public deleteComment(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/comment/${id}`)
  }

  public getHitokoto(id?: number) {
    return this.http.get<ResHitokotoData>(`${this.apiUrl}/hitokoto${id ? `/${id}` : ''}`)
  }

  public getHitokotos(isPublic: boolean) {
    return this.http.get<ResHitokotoData[]>(`${this.apiUrl}/hitokoto/${isPublic ? 'public' : 'all'}`)
  }

  public createHitokoto(data: ReqHitokotoData) {
    return this.http.post<void>(`${this.apiUrl}/hitokoto`, data)
  }

  public updateHitokoto(id: number, data: ReqHitokotoData) {
    return this.http.put<void>(`${this.apiUrl}/hitokoto/${id}`, data)
  }

  public likeHitokoto(id: number) {
    return this.http.put<void>(`${this.apiUrl}/hitokoto/like/${id}`, {})
  }

  public deleteHitokoto(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/hitokoto/${id}`)
  }

  public getHitokotoById(id: number) {
    return this.http.get<ResHitokotoData>(`${this.apiUrl}/hitokoto/${id}`)
  }

  public getBangumi(offset: number, isAnime: boolean) {
    return this.http.get<BangumiData>('https://api.bgm.tv/v0/users/himeno/collections', {
      params: {
        limit: 50,
        offset,
        subject_type: isAnime ? 2 : 4
      },
      headers: this.getSkipBringTokenhHeaders()
    })
  }

  public getNewses() {
    return this.http.get<ResNewsData[]>(`${this.apiUrl}/news`)
  }

  public getNews(id: number) {
    return this.http.get<ResNewsData>(`${this.apiUrl}/news/${id}`)
  }

  public createNews(data: ReqNewsData) {
    return this.http.post<void>(`${this.apiUrl}/news`, data)
  }

  public updateNews(id: number, data: ReqNewsData) {
    return this.http.put<void>(`${this.apiUrl}/news/${id}`, data)
  }

  public deleteNews(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/news/${id}`)
  }

  public getSettings() {
    return this.http.get<ResSettingsData>(`${this.apiUrl}/info/settings`)
  }

  public getDashboard() {
    return this.http.get<ResDashboardData>(`${this.apiUrl}/info/dashboard`)
  }

  public getProjects() {
    return /* isDevMode() ? of([]) : */ this.http.get<ResProjectData[]>(`${this.apiUrl}/info/projects`)
  }

  public getCharacters() {
    return this.http.get<ResCharacterData[]>(`${this.apiUrl}/character`)
  }

  public getCharacter(id: number) {
    return this.http.get<ResCharacterData>(`${this.apiUrl}/character/${id}`)
  }

  public getVideos() {
    return this.http.get<Video[]>('/data/bilibili.json')
  }
}
