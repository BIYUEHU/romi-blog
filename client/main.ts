/** 我草你妈的，傻逼支那豚，你翻你妈的代码 **/

import { bootstrapApplication } from '@angular/platform-browser'
import { appConfig } from './app/app.config'
import { AppComponent } from './app/app.component'
import { LoggerService } from './app/services/logger.service'

const logger = new LoggerService().label('BOOTSTRAP')

bootstrapApplication(AppComponent, appConfig).catch((err) => logger.fatal(err))
