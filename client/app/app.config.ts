import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http'
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core'
import { provideClientHydration, withNoHttpTransferCache } from '@angular/platform-browser'
import { provideAnimations } from '@angular/platform-browser/animations'
import { provideRouter, withComponentInputBinding } from '@angular/router'
import { routes } from './app.routes'
import { authInterceptor } from './interceptors/auth.interceptor'
import { errorInterceptor } from './interceptors/errorInterceptor'
import { transferInterceptor } from './interceptors/transferInterceptor'

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor])),
    provideRouter(routes, withComponentInputBinding()),
    provideAnimations(),
    provideClientHydration()
  ]
}
