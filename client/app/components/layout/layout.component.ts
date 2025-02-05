import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { NavigationStart, Router, RouterLink, RouterOutlet } from '@angular/router'
import { HeaderComponent } from '../header/header.component'
import { FooterComponent } from '../footer/footer.component'
import { NotifyService } from '../../services/notify.service'
import { BrowserService } from '../../services/browser.service'

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, CommonModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './layout.component.html'
})
export class LayoutComponent implements OnInit {
  private initHeaderData = {
    title: 'Arimura Sena',
    subTitle: ['What is mind? No matter.', 'What is matter? Never mind.'],
    imageUrl: 'https://api.hotaru.icu/ial/background?id=2'
  }

  public showBackTop = false

  public headerData: Partial<typeof this.initHeaderData> = this.initHeaderData

  public constructor(
    private readonly router: Router,
    private readonly notifyService: NotifyService,
    private readonly browserService: BrowserService
  ) {}

  public ngOnInit() {
    this.notifyService.headerUpdated$.subscribe((data) => this.updateHeaderContent(data))
    this.router.events.subscribe((event) => this.handleRouteEvent(event))
    this.browserService.windowRef?.window.addEventListener('scroll', (e) => {
      this.showBackTop = window.scrollY > 100
    })
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
    }
  }

  public scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
