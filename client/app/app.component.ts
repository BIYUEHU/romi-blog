import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { NavigationStart, Router, RouterOutlet } from '@angular/router'
import { HeaderComponent } from './components/header/header.component'
import { FooterComponent } from './components/footer/footer.component'
import { ProgressComponent } from './components/progress/progress.component'
import { NotifyService } from './services/notify.service'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ProgressComponent, HeaderComponent, FooterComponent, CommonModule],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  private initHeaderData = {
    title: 'Arimura Sena',
    subTitle: ['What is mind? No matter.', 'What is matter? Never mind.'],
    imageUrl: 'https://api.hotaru.icu/ial/background?id=2'
  }

  public headerData: Partial<typeof this.initHeaderData> = this.initHeaderData

  public constructor(
    private readonly router: Router,
    private readonly notifyService: NotifyService
  ) {}

  public ngOnInit() {
    this.notifyService.headerUpdated$.subscribe((data) => this.updateHeaderContent(data))
    this.router.events.subscribe((event) => this.handleRouteEvent(event))
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
      // setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0)
    }
  }
}
