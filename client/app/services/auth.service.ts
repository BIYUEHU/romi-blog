import { Injectable, signal } from '@angular/core'
import { Router } from '@angular/router'
import { BehaviorSubject } from 'rxjs'
import { UserAuthData } from '../models/api.model'
import { BrowserService } from './browser.service'
import { KEYS } from './store.service'

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // private user = signal<UserAuthData | null>(null)
  // public user$ = this.user.asReadonly()
  private userSubject = new BehaviorSubject<UserAuthData | null>(null)
  public user$ = this.userSubject.asObservable()

  public constructor(
    private readonly router: Router,
    private readonly browserService: BrowserService
  ) {
    this.restoreSession()
  }

  private restoreSession() {
    const { store } = this.browserService
    if (!store) return

    const stored = store.getItem(KEYS.ADMIN_AUTH)
    if (stored) {
      try {
        const userData = JSON.parse(stored)
        this.userSubject.next(userData)
      } catch {
        store.removeItem(KEYS.ADMIN_AUTH)
      }
    }
  }

  public setUser(userData: UserAuthData, remember = false) {
    const { store } = this.browserService
    if (!store) return

    this.userSubject.next(userData)
    store.setItem(KEYS.ADMIN_AUTH, JSON.stringify(userData), remember)
  }

  public logout() {
    const { store } = this.browserService
    if (!store) return

    this.userSubject.next(null)
    store.removeItem(KEYS.ADMIN_AUTH, true)
    store.removeItem(KEYS.ADMIN_AUTH, false)
    this.router.navigate(['/admin/login'])
  }

  public isLoggedIn(): boolean {
    return !!this.userSubject.value
  }

  public getToken(): string | null {
    return this.userSubject.value?.token ?? null
  }
}
