import { Routes } from '@angular/router'
import { DynamicComponent } from './pages/dynamic/dynamic.component'
import { dynamicResolver } from './pages/dynamic/dynamic.resolver'
import { publicRoutes } from './routes/public.routes'

export const routes: Routes = [
  {
    path: '',
    children: publicRoutes
  },
  {
    path: 'admin',
    loadChildren: () => import('./routes/admin.routes').then((m) => m.adminRoutes)
  },
  {
    path: ':slug',
    component: DynamicComponent,
    resolve: {
      dynamic: dynamicResolver
    },
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/404'
  }
]
