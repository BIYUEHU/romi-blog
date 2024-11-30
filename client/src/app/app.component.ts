import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterOutlet } from '@angular/router'
import { HeaderComponent } from './components/header/header.component'
import { FooterComponent } from './components/footer/footer.component'
// import { TuiResponsiveDialogService } from '@taiga-ui/addon-mobile'
// import { TuiRoot } from '@taiga-ui/core'
// import { TUI_CONFIRM } from '@taiga-ui/kit'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [/* TuiRoot, */ RouterOutlet, HeaderComponent, FooterComponent, CommonModule],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  public title = 'Romi Blog'

  // public constructor(private readonly dialogs: TuiResponsiveDialogService) {}

  public ngOnInit() {
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
  }
}
