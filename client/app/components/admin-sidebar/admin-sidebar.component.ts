import { Component } from '@angular/core'
import { RouterLink, RouterLinkActive } from '@angular/router'
import { NotifyService } from '../../services/notify.service'

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.component.html'
})
export class AdminSidebarComponent {
  public menuItems = [
    {
      text: '控制台',
      link: '/admin/dashboard',
      icon: 'i-mdi:view-dashboard'
    },
    {
      text: '内容管理',
      children: [
        { text: '文章管理', link: '/admin/posts', icon: 'i-mdi:file-document' },
        { text: '字段管理', link: '/admin/metas', icon: 'i-mdi:tag' },
        { text: '评论管理', link: '/admin/comments', icon: 'i-mdi:comment' },
        { text: '用户管理', link: '/admin/users', icon: 'i-mdi:account-multiple' },
        { text: '一言管理', link: '/admin/hitokotos', icon: 'i-mdi:format-quote-close' },
        { text: '动态管理', link: '/admin/dynamics', icon: 'i-mdi:newspaper' }
      ]
    },
    {
      text: '媒体管理',
      children: [
        { text: '文件管理', link: '/admin/files', icon: 'i-mdi:file' },
        { text: '图片管理', link: '/admin/images', icon: 'i-mdi:image' }
      ]
    },
    {
      text: '系统管理',
      children: [
        { text: '站点设置', link: '/admin/settings', icon: 'i-mdi:cog' },
        { text: '安全设置', link: '/admin/security', icon: 'i-mdi:shield-key' },
        { text: '个人资料', link: '/admin/profile', icon: 'i-mdi:account' },
        { text: '网站日志', link: '/admin/logs', icon: 'i-mdi:file-document-outline' }
      ]
    }
  ]

  public constructor(private readonly notifyService: NotifyService) {}

  public onMenuClick() {
    if (window.innerWidth < 1024) this.notifyService.closeSidebar()
  }
}
