import { Injectable, isDevMode } from '@angular/core'
import { ConsoleTransport, Logger, LoggerLevel } from '@kotori-bot/logger'

@Injectable({
  providedIn: 'root'
})
export class LoggerService extends Logger {
  public constructor() {
    super({
      level: isDevMode() ? LoggerLevel.DEBUG : LoggerLevel.RECORD,
      transports: [new ConsoleTransport({ template: '<bold>%level%</bold> %labels%: <bold>%msg%<bold>' })]
    })
  }
}
