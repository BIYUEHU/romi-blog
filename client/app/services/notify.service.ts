import { Injectable } from '@angular/core'
import { Subject } from 'rxjs'
import { LayoutComponent } from '../components/layout/layout.component'

@Injectable({
  providedIn: 'root'
})
export class NotifyService {
  private headerUpdated = new Subject<Partial<LayoutComponent['headerData']>>()

  public headerUpdated$ = this.headerUpdated.asObservable()

  public updateHeaderContent(data: Partial<LayoutComponent['headerData']>) {
    Promise.resolve().then(() => {
      this.headerUpdated.next(data)
    })
  }
}
