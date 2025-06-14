import type { Routes } from '@angular/router'
import { LayoutComponent } from './components/layout/layout.component'
import { PostComponent } from './pages/post/post.component'
import { ArchiveComponent } from './pages/archive/archive.component'
import { TagComponent } from './pages/tag/tag.component'
import { CategoryComponent } from './pages/category/category.component'
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component'
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component'
import { AdminPostsComponent } from './pages/admin-posts/admin-posts.component'
import { AuthGuard } from './guards/auth.guard'
import { AdminLoginComponent } from './pages/admin-login/admin-login.component'
import { AdminEditComponent } from './pages/admin-edit/admin-edit.component'
import { AdminMetasComponent } from './pages/admin-metas/admin-metas.component'
import { AdminUsersComponent } from './pages/admin-users/admin-users.component'
import { AdminCommentsComponent } from './pages/admin-comments/admin-comments.component'
import { AdminHitokotosComponent } from './pages/admin-hitokotos/admin-hitokotos.component'
import { ControlComponent } from './components/control/control.component'
import { HitokotosComponent } from './pages/hitokotos/hitokotos.component'
import { HitokotoComponent } from './pages/hitokoto/hitokoto.component'
import { AnimeComponent } from './pages/anime/anime.component'
import { GalComponent } from './pages/gal/gal.component'
import { AdminNewsComponent } from './pages/admin-news/admin-news.component'
import { NewsesComponent } from './pages/newses/newses.component'
import { NewsComponent } from './pages/news/news.component'
import { MusicComponent } from './pages/music/music.component'
import { CharComponent } from './pages/char/char.component'
import { CharsComponent } from './pages/chars/chars.component'
import { ProjectComponent } from './pages/project/project.component'
import { PostsComponent } from './pages/posts/posts.component'
import { AdminCharsComponent } from './pages/admin-chars/admin-chars.component'
import { AdminCharEditComponent } from './pages/admin-char-edit/admin-char-edit.component'

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'post/:id',
        component: PostComponent
        // title: 'Article'
      },
      {
        path: 'post',
        component: PostsComponent
      },
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
      },
      {
        path: 'hitokotos',
        component: HitokotosComponent
      },
      {
        path: 'anime',
        component: AnimeComponent
      },
      {
        path: 'gal',
        component: GalComponent
      },
      {
        path: 'news',
        component: NewsesComponent
      },
      {
        path: 'news/:id',
        component: NewsComponent
      },
      {
        path: 'music',
        component: MusicComponent
      },
      {
        path: 'char',
        component: CharsComponent
      },
      {
        path: 'char/:id',
        component: CharComponent
      },
      {
        path: 'project',
        component: ProjectComponent
      }
    ]
  },
  {
    path: 'admin/login',
    component: AdminLoginComponent
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
        path: 'dashboard',
        component: AdminDashboardComponent
      },
      {
        path: 'posts',
        component: AdminPostsComponent
      },
      {
        path: 'edit/:id',
        component: AdminEditComponent
      },
      {
        path: 'metas',
        component: AdminMetasComponent
      },
      {
        path: 'users',
        component: AdminUsersComponent
      },
      {
        path: 'comments',
        component: AdminCommentsComponent
      },
      {
        path: 'hitokotos',
        component: AdminHitokotosComponent
      },
      {
        path: 'news',
        component: AdminNewsComponent
      },
      {
        path: 'chars',
        component: AdminCharsComponent
      },
      {
        path: 'char-edit/:id',
        component: AdminCharEditComponent
      }
    ]
  },
  {
    path: 'hitokoto',
    component: HitokotoComponent
  },
  {
    path: 'hitokoto/:id',
    component: HitokotoComponent
  },
  {
    path: '**',
    component: ControlComponent,
    pathMatch: 'full'
  }
]
