import { Injectable } from '@angular/core'
import { Subject } from 'rxjs'
import { AppComponent } from '../app.component'

@Injectable({
  providedIn: 'root'
})
export class NotifyService {
  private headerUpdated = new Subject<Partial<AppComponent['headerData']>>()

  public headerUpdated$ = this.headerUpdated.asObservable()

  public updateHeaderContent(data: Partial<AppComponent['headerData']>) {
    Promise.resolve().then(() => {
      this.headerUpdated.next(data)
    })
  }
}
