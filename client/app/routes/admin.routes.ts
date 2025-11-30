import { Routes } from '@angular/router'
import { authGuard } from '../guards/auth.guard'

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../components/admin-layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../pages/admin-dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
        title: '控制台'
      },
      {
        path: 'posts',
        loadComponent: () => import('../pages/admin-posts/admin-posts.component').then((m) => m.AdminPostsComponent),
        title: '文章管理'
      },
      {
        path: 'edit/:id',
        loadComponent: () => import('../pages/admin-edit/admin-edit.component').then((m) => m.AdminEditComponent),
        title: '文章编辑'
      },
      {
        path: 'metas',
        loadComponent: () => import('../pages/admin-metas/admin-metas.component').then((m) => m.AdminMetasComponent),
        title: '字段管理'
      },
      {
        path: 'users',
        loadComponent: () => import('../pages/admin-users/admin-users.component').then((m) => m.AdminUsersComponent),
        title: '用户管理'
      },
      {
        path: 'comments',
        loadComponent: () =>
          import('../pages/admin-comments/admin-comments.component').then((m) => m.AdminCommentsComponent),
        title: '评论管理'
      },
      {
        path: 'hitokotos',
        loadComponent: () =>
          import('../pages/admin-hitokotos/admin-hitokotos.component').then((m) => m.AdminHitokotosComponent),
        title: '一言管理'
      },
      {
        path: 'news',
        loadComponent: () => import('../pages/admin-news/admin-news.component').then((m) => m.AdminNewsComponent),
        title: '动态管理'
      },
      {
        path: 'chars',
        loadComponent: () => import('../pages/admin-chars/admin-chars.component').then((m) => m.AdminCharsComponent),
        title: '角色管理'
      },
      {
        path: 'char-edit/:id',
        loadComponent: () =>
          import('../pages/admin-char-edit/admin-char-edit.component').then((m) => m.AdminCharEditComponent),
        title: '角色编辑'
      }
    ]
  },
  {
    path: 'login',
    loadComponent: () => import('../pages/admin-login/admin-login.component').then((m) => m.AdminLoginComponent),
    title: '后台登录'
  }
]
