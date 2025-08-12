import { isPlatformBrowser } from '@angular/common'
import { Inject, Injectable, PLATFORM_ID } from '@angular/core'
import { StoreService } from './store.service'

@Injectable({
  providedIn: 'root'
})
export class BrowserService {
  public constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly storeService: StoreService
  ) {}

  public get windowRef(): Window | null {
    return isPlatformBrowser(this.platformId) ? window : null
  }

  public get store(): StoreService | null {
    return isPlatformBrowser(this.platformId) ? this.storeService : null
  }

  // public get localStorage(): Storage | null {
  //   return isPlatformBrowser(this.platformId) ? window.localStorage : null
  // }

  // public get sessionStorage(): Storage | null {
  //   return isPlatformBrowser(this.platformId) ? window.sessionStorage : null
  // }

  public get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId)
  }
}
