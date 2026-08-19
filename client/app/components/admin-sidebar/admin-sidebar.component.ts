import { Component, Input, WritableSignal } from '@angular/core'
import { RouterLink, RouterLinkActive } from '@angular/router'
import { AuthService } from '../../services/auth.service'

@Component({
  selector: 'app-admin-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.component.html'
})
export class AdminSidebarComponent {
  @Input({ required: true }) public isSidebarOpen!: WritableSignal<boolean>

  public constructor(private readonly authService: AuthService) {}

  public get isAdmin() {
    const user = this.authService.user$()
    return user?.is_admin ?? false
  }

  public get menuItems() {
    const allItems = [
      {
        text: '控制台',
        link: '/admin/dashboard',
        icon: 'i-mdi:view-dashboard',
        adminOnly: true
      },
      {
        text: '内容管理',
        children: [
          { text: '文章管理', link: '/admin/posts', icon: 'i-mdi:file-document', adminOnly: true },
          { text: '字段管理', link: '/admin/metas', icon: 'i-mdi:tag', adminOnly: true },
          { text: '评论管理', link: '/admin/comments', icon: 'i-mdi:comment', adminOnly: true },
          { text: '用户管理', link: '/admin/users', icon: 'i-mdi:account-multiple', adminOnly: true },
          { text: '一言管理', link: '/admin/hitokotos', icon: 'i-mdi:format-quote-close', adminOnly: true },
          { text: '一言管理', link: '/admin/hitokotos2', icon: 'i-mdi:format-quote-close', adminOnly: true },
          { text: '动态管理', link: '/admin/news', icon: 'i-mdi:newspaper', adminOnly: true },
          { text: '角色管理', link: '/admin/chars', icon: 'i-mdi:star', adminOnly: true }
        ],
        adminOnly: true
      },
      {
        text: '媒体管理',
        children: [
          { text: '文件管理', link: '/admin/files', icon: 'i-mdi:file', adminOnly: true },
          { text: '图片管理', link: '/admin/images', icon: 'i-mdi:image', adminOnly: true }
        ],
        adminOnly: true
      },
      {
        text: '系统管理',
        children: [
          { text: '系统设置', link: '/admin/settings', icon: 'i-mdi:cog', adminOnly: true },
          { text: '邮箱设置', link: '/admin/smtp', icon: 'i-mdi:email', adminOnly: true },
          { text: '安全设置', link: '/admin/security', icon: 'i-mdi:shield-key', adminOnly: true },
          { text: '个人资料', link: '/admin/profile', icon: 'i-mdi:account', adminOnly: false }
        ],
        adminOnly: false
      }
    ]

    if (this.isAdmin) return allItems
    return allItems
      .map((group) => {
        if (group.children) {
          const filtered = group.children.filter((child) => !child.adminOnly)
          if (filtered.length === 0) return null
          return { ...group, children: filtered }
        }
        if (group.adminOnly) return null
        return group
      })
      .filter((g) => g !== null)
  }

  public onMenuClick() {
    if (window.innerWidth < 1024) this.isSidebarOpen.set(false)
  }
}
