import { Component, OnDestroy, OnInit, SimpleChanges } from '@angular/core'
import { RouterLink } from '@angular/router'
import { BrowserService } from '../../services/browser.service'
import { Subject, debounceTime, fromEvent, takeUntil } from 'rxjs'

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>()
  // public navItems = [
  //   { text: '首页', link: '/' },
  //   { text: '归档', link: '/archive' },
  //   { text: '关于', link: '/about' },
  //   { text: '友链', link: '/friends' },
  //   { text: '日志', link: '/log' },
  //   { text: '更多', link: '/more' }
  // ]

  public navItems = [
    { text: '首页', link: '/' },
    {
      text: '笔记',
      children: [
        { text: '文章', link: '/posts' },
        { text: '归档', link: '/archive' },
        { text: '动态', link: '/dynamics' },
        { text: '语录', link: '/quotes' }
      ]
    },
    {
      text: '兴趣',
      children: [
        { text: '歌单', link: '/music' },
        { text: '追番', link: '/anime' },
        { text: 'GAL', link: '/gal' },
        { text: '角色', link: '/characters' }
      ]
    },
    { text: '关于', link: '/about' },
    { text: '友链', link: '/friends' },
    { text: '作品', link: '/works' }
  ]

  public screenWidth = 0
  public isMenuOpen = false

  public constructor(private readonly browserService: BrowserService) {}

  public ngOnInit() {
    const { windowRef } = this.browserService
    if (!windowRef) return
    this.screenWidth = windowRef.innerWidth
    fromEvent(windowRef, 'resize')
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe(() => {
        this.screenWidth = windowRef.innerWidth
      })
  }

  public ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

  public toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen
    if (this.isMenuOpen) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${scrollBarWidth}px`
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }
}
