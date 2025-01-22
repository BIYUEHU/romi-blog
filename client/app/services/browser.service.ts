import { Injectable, PLATFORM_ID, Inject } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'

@Injectable({
  providedIn: 'root'
})
export class BrowserService {
  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  get windowRef(): Window | null {
    return isPlatformBrowser(this.platformId) ? window : null
  }

  get localStorage(): Storage | null {
    return isPlatformBrowser(this.platformId) ? window.localStorage : null
  }

  get sessionStorage(): Storage | null {
    return isPlatformBrowser(this.platformId) ? window.sessionStorage : null
  }
}
