import { bootstrapApplication } from '@angular/platform-browser'
import { AppComponent } from './app/app.component'
import { appConfig } from './app/app.config'
import { LoggerService } from './app/services/logger.service'

const logger = new LoggerService().label('BOOTSTRAP')

bootstrapApplication(AppComponent, appConfig).catch((err) => logger.fatal(err))
