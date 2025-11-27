import { Injectable } from '@angular/core'
import { CanActivate, Router } from '@angular/router'
import { AuthService } from '../services/auth.service'
import { BrowserService } from '../services/browser.service'

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  public constructor(
    private readonly authService: AuthService,
    private readonly browserService: BrowserService,
    private readonly router: Router
  ) {}

  public canActivate() {
    if (!this.browserService.is) return true
    if (this.authService.isLoggedIn()) return true
    if (this.router.url.includes('/admin/login')) return true
    this.router.navigate(['/admin/login'])
    return false
  }
}
