import { AfterViewInit, Component, OnInit } from '@angular/core'
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router'
import { BrowserService } from '../../services/browser.service'

@Component({
  selector: 'app-progress',
  standalone: true,
  template: ''
})
export class ProgressComponent implements OnInit, AfterViewInit {
  public constructor(
    private readonly router: Router,
    private readonly browserService: BrowserService
  ) {}

  public ngOnInit() {
    this.router.events.subscribe((event) => this.handleRouteEvent(event))
  }

  public ngAfterViewInit() {
    this.initProgress()
  }

  private handleRouteEvent(event: object) {
    if (event instanceof NavigationStart) this.startProgress()
    if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
      this.endProgress()
    }
  }

  private startProgress() {
    if (!this.browserService.isBrowser) return

    const progressBar = document.getElementById('progress-bar')
    if (progressBar) {
      progressBar.style.transition = 'none'
      progressBar.style.width = '90%'
      setTimeout(() => {
        progressBar.style.transition = 'width 0.5s ease-out'
        progressBar.style.width = '50%'
      }, 50)

      setTimeout(() => {
        progressBar.style.width = '0%'
      }, 500)
    }
  }

  private endProgress() {
    if (!this.browserService.isBrowser) return

    const progressBar = document.getElementById('progress-bar')
    if (progressBar) {
      progressBar.style.width = '0%'
      setTimeout(() => {
        progressBar.style.width = '100%'
      }, 500)
      setTimeout(() => {
        progressBar.style.transition = ''
        progressBar.style.width = '0%'
      }, 1100)
    }
  }

  private initProgress() {
    if (!this.browserService.isBrowser) return

    const progressBar = document.createElement('div')
    progressBar.id = 'progress-bar'
    progressBar.style.position = 'fixed'
    progressBar.style.top = '0'
    progressBar.style.left = '0'
    progressBar.style.height = '4px'
    progressBar.style.backgroundColor = 'var(--primary-100)'
    progressBar.style.width = '100%'
    progressBar.style.zIndex = '9999'
    document.body.appendChild(progressBar)
  }
}
