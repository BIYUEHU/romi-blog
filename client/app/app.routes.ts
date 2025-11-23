import { publicRoutes } from './routes/public.routes'
import { defineRoutes } from './shared/tools'

export const routes = defineRoutes([
  {
    path: '',
    children: publicRoutes
  },
  {
    path: 'admin',
    loadChildren: () => import('./routes/admin.routes').then((m) => m.adminRoutes)
  }
])
