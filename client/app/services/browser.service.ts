import { isPlatformBrowser } from '@angular/common'
import { Inject, Injectable, PLATFORM_ID } from '@angular/core'

@Injectable({
  providedIn: 'root'
})
export class BrowserService {
  public constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  public get is(): boolean {
    return isPlatformBrowser(this.platformId)
  }

  public on<T>(callback: () => T): T | null {
    return this.is ? callback() : null
  }
}
