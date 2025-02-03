import { Injectable, PLATFORM_ID, Inject } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'

@Injectable({
  providedIn: 'root'
})
export class BrowserService {
  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  public get windowRef(): Window | null {
    return isPlatformBrowser(this.platformId) ? window : null
  }

  public get localStorage(): Storage | null {
    return isPlatformBrowser(this.platformId) ? window.localStorage : null
  }

  public get sessionStorage(): Storage | null {
    return isPlatformBrowser(this.platformId) ? window.sessionStorage : null
  }

  public get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId)
  }
}
