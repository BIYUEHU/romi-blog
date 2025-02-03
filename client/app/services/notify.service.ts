import { Injectable } from '@angular/core'
import { Subject } from 'rxjs'
import { AppComponent } from '../app.component'

@Injectable({
  providedIn: 'root'
})
export class NotifyService {
  private headerUpdatedSource = new Subject<Partial<AppComponent['headerData']>>()

  public headerUpdated$ = this.headerUpdatedSource.asObservable()

  public updateHeaderContent(data: Partial<AppComponent['headerData']>) {
    this.headerUpdatedSource.next(data)
  }
}
