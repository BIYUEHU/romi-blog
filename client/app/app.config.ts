import { isPlatformBrowser } from '@angular/common'
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http'
import { APP_INITIALIZER, ApplicationConfig, PLATFORM_ID } from '@angular/core'
import { provideClientHydration, withNoHttpTransferCache } from '@angular/platform-browser'
import { provideAnimations } from '@angular/platform-browser/animations'
import { provideRouter, TitleStrategy, withComponentInputBinding } from '@angular/router'
import { tap } from 'rxjs'
import { routes } from './app.routes'
import { authInterceptor } from './interceptors/auth.interceptor'
import { errorInterceptor } from './interceptors/error.interceptor'
import { transferInterceptor } from './interceptors/transfer.interceptor'
import { ApiService } from './services/api.service'
import { AppTitleStrategy } from './shared/title-strategy'

export const appConfig: ApplicationConfig = {
  providers: [
    // provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, transferInterceptor, errorInterceptor])),
    provideRouter(routes, withComponentInputBinding()),
    { provide: TitleStrategy, useExisting: AppTitleStrategy },
    provideAnimations(),
    provideClientHydration(withNoHttpTransferCache()),
    {
      provide: APP_INITIALIZER,
      useFactory: (apiService: ApiService) => () =>
        apiService.loadSettings().pipe(
          tap((settings) => {
            if (!isPlatformBrowser(PLATFORM_ID)) return
            const setMetaContent = (name: string, content: string) => {
              let meta = document.querySelector(`meta[name="${name}"]`) as null | HTMLMetaElement
              if (!meta) {
                meta = document.createElement('meta')
                meta.name = name
                document.head.appendChild(meta)
              }
              meta.content = content
            }
            window.document.title = settings.siteTitle
            setMetaContent('keywords', settings.siteKeywords)
            setMetaContent('description', settings.siteDescription)
          })
        ),
      deps: [ApiService],
      multi: true
    }
  ]
}
