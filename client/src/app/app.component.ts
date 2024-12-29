import { AfterViewInit, Component, ElementRef, OnInit, Renderer2 } from '@angular/core'
import { CommonModule } from '@angular/common'
import { NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router'
import { HeaderComponent } from './components/header/header.component'
import { FooterComponent } from './components/footer/footer.component'
import { NotifyService } from './services/notify.service'
// import { TuiResponsiveDialogService } from '@taiga-ui/addon-mobile'
// import { TuiRoot } from '@taiga-ui/core'
// import { TUI_CONFIRM } from '@taiga-ui/kit'

// TODO: move the code which is unrelated with appComponent to other components
// TODO: improve the implementation of progress bar
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [/* TuiRoot,  */ RouterOutlet, HeaderComponent, FooterComponent, CommonModule],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, AfterViewInit {
  private initHeaderData = {
    title: 'Romi Blog',
    subTitle: ['What is mind? No matter.', 'What is matter? Never mind.'],
    imageUrl: 'https://api.hotaru.icu/ial/background?id=2'
  }
  private header?: HTMLElement

  public headerData: Partial<typeof this.initHeaderData> = this.initHeaderData

  public constructor(
    private renderer: Renderer2,
    private el: ElementRef,
    private router: Router,
    private notifyService: NotifyService
    // private readonly dialogs: TuiResponsiveDialogService
  ) {}

  public ngOnInit() {
    this.header = this.el.nativeElement.querySelector('#header')

    this.notifyService.headerUpdated$.subscribe((data) => this.updateHeaderContent(data))
    this.router.events.subscribe((event) => this.handleRouteEvent(event))
  }

  public ngAfterViewInit() {
    // this.dialogs
    //   .open<boolean>(TUI_CONFIRM, {
    //     label: '公告',
    //     size: 's',
    //     data: {
    //       content: /* html */ `当前博客正在逐步重构中，观察进度可前往 <a target="_blank" href="https://github.com/biyuehu/romichan">biyuehu/romichan</a>，旧博客：<a target="_blank" href="https://old.hotaru.icu">old.hotaru.icu</a>`,
    //       yes: 'That is great!',
    //       no: 'Who cares?'
    //     }
    //   })
    //   .subscribe((response) => {})
    window.addEventListener('scroll', this.checkHeader.bind(this))
    this.initProgress()
  }

  private checkHeader() {
    if (this.header) {
      if (window.scrollY > 345) {
        this.renderer.addClass(this.header, 'header-pull-up')
      } else {
        this.renderer.removeClass(this.header, 'header-pull-up')
      }
    }
  }

  private updateHeaderContent(data: Partial<typeof this.initHeaderData>) {
    this.headerData = {
      ...this.initHeaderData,
      ...data
    }
  }

  private handleRouteEvent(event: object) {
    if (event instanceof NavigationStart) {
      this.updateHeaderContent({})
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0)
      this.startProgress()
    }

    if (event instanceof NavigationEnd || event instanceof NavigationError) {
      this.endProgress()
    }
  }

  private startProgress() {
    // 启动进度条动画
    const progressBar = document.getElementById('progress-bar')
    if (progressBar) {
      progressBar.style.transition = 'none' // 禁用过渡，瞬间改变宽度
      progressBar.style.width = '0%' // 初始化宽度为0
      setTimeout(() => {
        progressBar.style.transition = 'width 0.5s ease-out' // 启用过渡动画
        progressBar.style.width = '50%'
      }, 50)

      // 模拟进度条在页面加载过程中增加
      setTimeout(() => {
        progressBar.style.width = '90%'
      }, 500)
    }
  }

  private endProgress() {
    // 页面加载结束时，完成进度条
    const progressBar = document.getElementById('progress-bar')
    if (progressBar) {
      progressBar.style.width = '100%' // 完成进度
      setTimeout(() => {
        progressBar.style.width = '0%' // 隐藏进度条
      }, 500) // 完成后延迟一段时间再收回进度条
    }
  }

  private initProgress() {
    // 在视图加载后初始化进度条样式
    const progressBar = document.createElement('div')
    progressBar.id = 'progress-bar'
    progressBar.style.position = 'fixed'
    progressBar.style.top = '0'
    progressBar.style.left = '0'
    progressBar.style.height = '4px'
    progressBar.style.backgroundColor = 'var(--main-color)'
    progressBar.style.width = '0%'
    progressBar.style.zIndex = '9999' // 确保进度条在页面最上层
    document.body.appendChild(progressBar)
  }
}
