import { isPlatformBrowser } from '@angular/common'
import { Inject, Injectable, PLATFORM_ID } from '@angular/core'

@Injectable({
  providedIn: 'root'
})
export class BrowserService {
  public constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  public get windowRef(): Window | null {
    return this.isBrowser ? window : null
  }

  public get documentRef(): Document | null {
    return this.isBrowser ? document : null
  }

  public get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId)
  }
}
