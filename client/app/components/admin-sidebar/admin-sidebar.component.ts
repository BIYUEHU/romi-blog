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
        { text: '分类管理', link: '/admin/categories', icon: 'i-mdi:folder' },
        { text: '标签管理', link: '/admin/tags', icon: 'i-mdi:tag' },
        { text: '评论管理', link: '/admin/comments', icon: 'i-mdi:comment' }
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
      text: '系统设置',
      children: [
        { text: '站点设置', link: '/admin/settings', icon: 'i-mdi:cog' },
        { text: '个人资料', link: '/admin/profile', icon: 'i-mdi:account' }
      ]
    }
  ]

  public constructor(private readonly notifyService: NotifyService) {}

  public onMenuClick() {
    if (window.innerWidth < 1024) this.notifyService.closeSidebar()
  }
}
