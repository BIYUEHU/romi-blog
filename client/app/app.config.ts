import { ApplicationConfig, inject, provideZoneChangeDetection } from '@angular/core'
import { provideRouter } from '@angular/router'
import { routes } from './app.routes'
import { provideClientHydration } from '@angular/platform-browser'
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http'
import { AuthInterceptor } from './interceptors/auth.interceptor'

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withFetch(), withInterceptors([(req, next) => inject(AuthInterceptor).intercept(req, next)])),

    provideRouter(routes),
    provideClientHydration()
  ]
}
