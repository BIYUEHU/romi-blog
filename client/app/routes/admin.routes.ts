import { AuthGuard } from '../guards/auth.guard'
import { defineRoutes } from '../shared/tools'

export const adminRoutes = defineRoutes([
  {
    path: '',
    loadComponent: () =>
      import('../components/admin-layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../pages/admin-dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent)
      },
      {
        path: 'posts',
        loadComponent: () => import('../pages/admin-posts/admin-posts.component').then((m) => m.AdminPostsComponent)
      },
      {
        path: 'edit/:id',
        loadComponent: () => import('../pages/admin-edit/admin-edit.component').then((m) => m.AdminEditComponent)
      },
      {
        path: 'metas',
        loadComponent: () => import('../pages/admin-metas/admin-metas.component').then((m) => m.AdminMetasComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('../pages/admin-users/admin-users.component').then((m) => m.AdminUsersComponent)
      },
      {
        path: 'comments',
        loadComponent: () =>
          import('../pages/admin-comments/admin-comments.component').then((m) => m.AdminCommentsComponent)
      },
      {
        path: 'hitokotos',
        loadComponent: () =>
          import('../pages/admin-hitokotos/admin-hitokotos.component').then((m) => m.AdminHitokotosComponent)
      },
      {
        path: 'news',
        loadComponent: () => import('../pages/admin-news/admin-news.component').then((m) => m.AdminNewsComponent)
      },
      {
        path: 'chars',
        loadComponent: () => import('../pages/admin-chars/admin-chars.component').then((m) => m.AdminCharsComponent)
      },
      {
        path: 'char-edit/:id',
        loadComponent: () =>
          import('../pages/admin-char-edit/admin-char-edit.component').then((m) => m.AdminCharEditComponent)
      }
    ]
  },
  {
    path: 'login',
    loadComponent: () => import('../pages/admin-login/admin-login.component').then((m) => m.AdminLoginComponent)
  }
])
