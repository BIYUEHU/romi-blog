import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http'
import { ApplicationConfig, inject, provideZoneChangeDetection } from '@angular/core'
import { provideClientHydration } from '@angular/platform-browser'
import { provideAnimations } from '@angular/platform-browser/animations'
import { provideRouter } from '@angular/router'
import { routes } from './app.routes'
import { AuthInterceptor } from './interceptors/auth.interceptor'

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withFetch(), withInterceptors([(req, next) => inject(AuthInterceptor).intercept(req, next)])),
    provideRouter(routes),
    provideAnimations(),
    provideClientHydration()
  ]
}
