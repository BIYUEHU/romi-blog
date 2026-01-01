import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core'
import { ResolveFn } from '@angular/router'
import { LayoutComponent } from '../../components/layout/layout.component'
import { LinksComponent } from '../../components/links/links.component'
import { PostContentComponent } from '../../components/post-content/post-content.component'
import { AppTitleStrategy } from '../../shared/title-strategy'
import { NotFoundComponent } from '../not-found/not-found.component'
import { dynamicResolver } from './dynamic.resolver'

@Component({
  selector: 'app-dynamic',
  imports: [LayoutComponent, PostContentComponent, LinksComponent, NotFoundComponent],
  templateUrl: './dynamic.component.html'
})
export class DynamicComponent implements OnChanges {
  @Input() public readonly dynamic!: typeof dynamicResolver extends ResolveFn<infer T> ? T : never

  public showContent = true

  public constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly appTitleStrategy: AppTitleStrategy
  ) {}

  public ngOnChanges(changes: SimpleChanges): void {
    if (!changes['dynamic'] || changes['dynamic'].currentValue === changes['dynamic'].previousValue) return
    this.showContent = false
    this.cdr.detectChanges()
    this.showContent = true
    this.cdr.detectChanges()
    if (this.dynamic[1].banner) this.appTitleStrategy.updateHeader({ imageUrl: this.dynamic[1].banner })
  }
}
