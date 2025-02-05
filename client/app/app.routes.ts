import type { Routes } from '@angular/router'
import { LayoutComponent } from './components/layout/layout.component'
import { HomeComponent } from './pages/home/home.component'
import { PostComponent } from './pages/post/post.component'
import { ArchiveComponent } from './pages/archive/archive.component'
import { TagComponent } from './pages/tag/tag.component'
import { CategoryComponent } from './pages/category/category.component'
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component'
import { AdminHomeComponent } from './pages/admin-home/admin-home.component'
import { AdminPostsComponent } from './pages/admin-posts/admin-posts.component'
import { AuthGuard } from './guards/auth.guard'
import { AdminLoginComponent } from './pages/admin-login/admin-login.component'
// import { AboutComponent } from './pages/about/about.component'
// import { FriendsComponent } from './pages/friends/friends.component'

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        component: HomeComponent
        // title: 'Romi Blog - Home'
      },
      {
        path: 'post/:id',
        component: PostComponent
        // title: 'Article'
      },
      // {
      //   path: 'about',
      //   component: AboutComponent,
      //   title: 'About'
      // },
      {
        path: 'archive',
        component: ArchiveComponent
      },
      {
        path: 'tag/:name',
        component: TagComponent
      },
      {
        path: 'category/:name',
        component: CategoryComponent
      }
    ]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'login',
        component: AdminLoginComponent
      },
      {
        path: 'dashboard',
        component: AdminHomeComponent
      },
      {
        path: 'posts',
        component: AdminPostsComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
]
