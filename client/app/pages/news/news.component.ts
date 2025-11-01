import { DatePipe } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { LoadingComponent } from '../../components/loading/loading.component'
import { ResNewsData } from '../../models/api.model'
import { NotifyService } from '../../services/notify.service'
import { romiComponentFactory } from '../../utils/romi-component-factory'

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [DatePipe, LoadingComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './news.component.html'
})
export class NewsComponent extends romiComponentFactory<ResNewsData>('news') implements OnInit {
  public isLoading = true

  public constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly notifyService: NotifyService
  ) {
    super()
  }

  public ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'))
    if (Number.isNaN(id) || id <= 0) {
      this.router.navigate(['/404']).then(() => {})
      return
    }
    this.loadData(this.apiService.getNews(id)).subscribe((data) => {
      this.data = data
      this.isLoading = false
      this.notifyService.setTitle(data.text)
      this.notifyService.updateHeaderContent({
        title: '动态详情',
        subTitle: [`${data.views} 次阅读 • ${data.comments} 条评论 • ${data.likes} 人喜欢`]
      })
    })
  }
}
