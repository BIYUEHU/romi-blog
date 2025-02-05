import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { BehaviorSubject } from 'rxjs'
import { UserAuthData } from '../models/api.model'
import { BrowserService } from './browser.service'

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'admin_auth'
  private userSubject = new BehaviorSubject<UserAuthData | null>(null)
  public user$ = this.userSubject.asObservable()

  public constructor(
    private readonly router: Router,
    private readonly browserService: BrowserService
  ) {
    this.restoreSession()
  }

  private restoreSession() {
    const { localStorage } = this.browserService
    if (!localStorage) return

    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (stored) {
      try {
        const userData = JSON.parse(stored)
        this.userSubject.next(userData)
      } catch {
        localStorage.removeItem(this.STORAGE_KEY)
      }
    }
  }

  public setUser(userData: UserAuthData, remember = false) {
    const { localStorage } = this.browserService
    if (!localStorage) return

    this.userSubject.next(userData)
    if (remember) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData))
    } else {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData))
    }
  }

  public logout() {
    const { localStorage } = this.browserService
    if (!localStorage) return

    this.userSubject.next(null)
    localStorage.removeItem(this.STORAGE_KEY)
    sessionStorage.removeItem(this.STORAGE_KEY)
    this.router.navigate(['/admin/login'])
  }

  public isLoggedIn(): boolean {
    return !!this.userSubject.value
  }

  public getToken(): string | null {
    return this.userSubject.value?.token ?? null
  }
}
