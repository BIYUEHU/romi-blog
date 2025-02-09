import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import {
  ResMetaData,
  type ResHitokotoData,
  type ResPostData,
  type ResPostSingleData,
  LoginResponse,
  AuthUser,
  UserAuthData,
  ResSettingsData,
  ResDashboardData,
  ReqPostData,
  ReqMetaData,
  ResUserData,
  ReqUserData,
  ResCommentData,
  ReqCommentData,
  ReqHitokotoData
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

  public getPosts() {
    return this.http.get<ResPostData[]>(`${this.apiUrl}/post`)
  }

  public getPost(id: string) {
    return this.http.get<ResPostSingleData>(`${this.apiUrl}/post/${id}`)
  }

  public createPost(data: ReqPostData) {
    return this.http.post<void>(`${this.apiUrl}/post`, data)
  }

  public updatePost(id: number, data: ReqPostData) {
    return this.http.put<void>(`${this.apiUrl}/post/${id}`, data)
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
      .post<LoginResponse>(`${this.apiUrl}/user/login`, {
        username,
        password
      })
      .pipe(
        map((res) => {
          try {
            return { ...jwtDecode<AuthUser>(res.token), token: res.token } as UserAuthData
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

  public sendComment(id: string, text: string) {
    return this.http.post<void>(`${this.apiUrl}/comment`, { pid: id, text })
  }

  public deleteComment(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/comment/${id}`)
  }

  public getHitokoto() {
    return this.http.get<ResHitokotoData>(`${this.apiUrl}/hitokoto`)
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

  public deleteHitokoto(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/hitokoto/${id}`)
  }

  public getHitokotoById(id: number) {
    return this.http.get<ResHitokotoData>(`${this.apiUrl}/hitokoto/${id}`)
  }

  public getSettings() {
    return this.http.get<ResSettingsData>(`${this.apiUrl}/info/settings`)
  }

  public getDashboard() {
    return this.http.get<ResDashboardData>(`${this.apiUrl}/info/dashboard`)
  }
}
