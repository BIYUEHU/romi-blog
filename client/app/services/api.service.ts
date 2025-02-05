import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import {
  ResMetaData,
  type ResHitokotoData,
  type ResPostData,
  type ResPostSingleData,
  LoginResponse,
  AuthUser,
  UserAuthData
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

  public getHitokoto() {
    return this.http.get<ResHitokotoData>(`${this.apiUrl}/hitokoto`)
  }

  public getMetas() {
    return this.http.get<ResMetaData[]>(`${this.apiUrl}/meta`)
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
}
