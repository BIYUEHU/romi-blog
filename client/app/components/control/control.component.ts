import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { LinksComponent } from '../../pages/links/links.component'
import { NotFoundComponent } from '../../pages/not-found/not-found.component'
import { LayoutUsingComponent } from '../layout-using/layout-using.component'
import { PostContentComponent } from '../post-content/post-content.component'

type DependentPage = {
  name: string
  title: string
  using: number
} & (
  | {
      routinue: true
      hideToc: boolean
      hideComments: boolean
    }
  | {
      routinue: false
      template: string
    }
)

@Component({
  selector: 'app-control',
  standalone: true,
  imports: [LayoutUsingComponent, PostContentComponent, LinksComponent, NotFoundComponent],
  templateUrl: './control.component.html'
})
export class ControlComponent {
  public routerParams: string[]
  public dependentPageUsing?: ControlComponent['dependentPages'][number]

  public dependentPages: DependentPage[] = [
    {
      name: 'about',
      title: '关于',
      using: 25,
      routinue: true,
      hideToc: true,
      hideComments: false
    },
    {
      name: 'log',
      title: '日志',
      using: 26,
      routinue: true,
      hideToc: false,
      hideComments: true
    },
    {
      name: 'links',
      title: '友情链接',
      using: 6,
      routinue: false,
      template: 'links'
    }
  ]

  public constructor(private readonly router: Router) {
    this.routerParams = this.router.url
      .split('#')[0]
      .split('/')
      .filter((p) => p)
    if (this.routerParams.length === 1) {
      this.dependentPageUsing = this.dependentPages.find(({ name }) => name === this.routerParams[0])
    }
  }
}
