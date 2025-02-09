import { Injectable } from '@angular/core'
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router'
import { AuthService } from '../services/auth.service'
import { BrowserService } from '../services/browser.service'

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  public constructor(
    private readonly authService: AuthService,
    private readonly browserService: BrowserService
  ) {}

  public canActivate(): boolean {
    if (!this.browserService.isBrowser) return true
    if (this.authService.isLoggedIn()) return true
    if (location.href.includes('/admin/login')) return true
    location.href = '/admin/login'
    return false
  }
}
