import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core'

@Component({
    selector: 'app-loading',
    imports: [],
    templateUrl: './loading.component.html',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LoadingComponent {
  @Input() public text = '加载中，请稍候...'
}
