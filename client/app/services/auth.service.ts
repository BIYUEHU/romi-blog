import { Injectable, signal } from '@angular/core'
import { Router } from '@angular/router'
import { UserAuthData } from '../models/api.model'
import { STORE_KEYS, StoreService } from './store.service'

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private user = signal<UserAuthData | null>(null)
  public user$ = this.user.asReadonly()

  public constructor(
    private readonly router: Router,
    private readonly storeService: StoreService
  ) {
    this.restoreSession()
  }

  private restoreSession() {
    const stored = this.storeService.getItem(STORE_KEYS.ADMIN_AUTH)
    if (!stored) return
    try {
      this.user.set(JSON.parse(stored))
    } catch {
      this.storeService.removeItem(STORE_KEYS.ADMIN_AUTH)
    }
  }

  public setUser(userData: UserAuthData, remember = false) {
    this.user.set(userData)
    this.storeService.setItem(STORE_KEYS.ADMIN_AUTH, JSON.stringify(userData), remember)
  }

  public logout() {
    this.user.set(null)
    this.storeService.removeItem(STORE_KEYS.ADMIN_AUTH, true)
    this.storeService.removeItem(STORE_KEYS.ADMIN_AUTH, false)
    this.router.navigate(['/admin/login'])
  }

  public isLoggedIn(): boolean {
    return !!this.user()
  }

  public getToken(): string | null {
    return this.user()?.token ?? null
  }
}
