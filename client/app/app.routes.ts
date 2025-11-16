import type { Routes } from '@angular/router'
import { publicRoutes } from './routes/public.routes'

export const routes: Routes = [
  {
    path: '',
    children: publicRoutes
  },
  {
    path: 'admin',
    loadChildren: () => import('./routes/admin.routes').then((m) => m.adminRoutes)
  }
]
