import { Component, Input } from '@angular/core'
import { ResolveFn } from '@angular/router'
import { LayoutComponent } from '../../components/layout/layout.component'
import { LinksComponent } from '../../components/links/links.component'
import { PostContentComponent } from '../../components/post-content/post-content.component'
import { NotFoundComponent } from '../not-found/not-found.component'
import { dynamicResolver } from './dynamic.resolver'

@Component({
  selector: 'app-dynamic',
  standalone: true,
  imports: [LayoutComponent, PostContentComponent, LinksComponent, NotFoundComponent],
  templateUrl: './dynamic.component.html'
})
export class DynamicComponent {
  @Input() public readonly dynamic!: typeof dynamicResolver extends ResolveFn<infer T> ? T : never
}
