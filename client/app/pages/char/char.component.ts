import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { DatePipe } from '@angular/common'
import { Character } from '../../models/api.model'
import { LoadingComponent } from '../../components/loading/loading.component'
import { romiComponentFactory } from '../../utils/romi-component-factory'
import { NotifyService } from '../../services/notify.service'

@Component({
  selector: 'app-char',
  standalone: true,
  imports: [DatePipe, LoadingComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './char.component.html'
})
export class CharComponent extends romiComponentFactory<Character>('char') implements OnInit {
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
      this.router.navigate(['/'])
      return
    }
    this.setData(
      (set) => this.apiService.getCharacter(id).subscribe((data) => set(data)),
      (data) => {
        this.isLoading = false
        this.notifyService.updateHeaderContent({
          title: data.name,
          subTitle: [data.romaji, data.description]
        })
      }
    )
  }
}
