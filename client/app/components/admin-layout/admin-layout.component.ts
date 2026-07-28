import { Component, effect, HostListener, OnInit, signal } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { AdminFooterComponent } from '../admin-footer/admin-footer.component'
import { AdminHeaderComponent } from '../admin-header/admin-header.component'
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component'

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, AdminHeaderComponent, AdminSidebarComponent, AdminFooterComponent],
  templateUrl: './admin-layout.component.html'
})
export class AdminLayoutComponent implements OnInit {
  public isSidebarOpen = signal(true)

  public constructor() {
    effect(() => {
      if (typeof document !== 'undefined')
        document.body.style.overflow = window.innerWidth <= 1024 && this.isSidebarOpen() ? 'hidden' : ''
    })
  }

  public ngOnInit() {
    this.onResize()
  }

  @HostListener('window:resize')
  public onResize() {
    this.isSidebarOpen.set(window.innerWidth > 1024)
  }
}
