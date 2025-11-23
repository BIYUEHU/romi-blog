import { Component, Input } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ResPostSingleData } from '../../../output'
import { LayoutComponent } from '../../components/layout/layout.component'
import { PostContentComponent } from '../../components/post-content/post-content.component'
import { LinksComponent } from '../links/links.component'
import { NotFoundComponent } from '../not-found/not-found.component'

type DependentPage = {
  name: string
  title: string
  id: number
} & (
  | {
      routine: true
      hideToc: boolean
      hideComments: boolean
    }
  | {
      routine: false
      template: string
    }
)

@Component({
  selector: 'app-control',
  standalone: true,
  imports: [LayoutComponent, PostContentComponent, LinksComponent, NotFoundComponent],
  templateUrl: './control.component.html'
})
export class ControlComponent {
  @Input() public readonly post!: ResPostSingleData

  public static readonly DEPENDENT_PAGES: DependentPage[] = [
    {
      name: 'about',
      title: '关于',
      id: 25,
      routine: true,
      hideToc: true,
      hideComments: false
    },
    {
      name: 'log',
      title: '日志',
      id: 26,
      routine: true,
      hideToc: false,
      hideComments: true
    },
    {
      name: 'links',
      title: '友情链接',
      id: 6,
      routine: false,
      template: 'links'
    }
  ]

  public dependentPageUsing!: DependentPage

  public constructor(route: ActivatedRoute) {
    this.dependentPageUsing = ControlComponent.DEPENDENT_PAGES.find(({ name }) => name === route.snapshot.url[0]?.path)!
  }
}
