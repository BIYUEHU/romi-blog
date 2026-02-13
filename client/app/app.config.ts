import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http'
import { APP_INITIALIZER, ApplicationConfig } from '@angular/core'
import { provideClientHydration, withNoHttpTransferCache } from '@angular/platform-browser'
import { provideAnimations } from '@angular/platform-browser/animations'
import { provideRouter, TitleStrategy, withComponentInputBinding } from '@angular/router'
import { routes } from './app.routes'
import { authInterceptor } from './interceptors/auth.interceptor'
import { errorInterceptor } from './interceptors/errorInterceptor'
import { transferInterceptor } from './interceptors/transferInterceptor'
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
      useFactory: (apiService: ApiService) => () => apiService.loadSettings(),
      deps: [ApiService],
      multi: true
    }
  ]
}
