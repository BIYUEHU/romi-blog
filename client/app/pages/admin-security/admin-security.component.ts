import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { WebComponentInputAccessorDirective } from '../../directives/web-component-input-accessor.directive'
import { ResIpBlacklistItem, ResLogEntry, ResLogFile } from '../../models/api.model'
import { ApiService } from '../../services/api.service'

@Component({
  selector: 'app-admin-security',
  imports: [FormsModule, WebComponentInputAccessorDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-security.component.html'
})
export class AdminSecurityComponent implements OnInit {
  public logs: ResLogFile[] = []
  public selectedLog = ''
  public entries: ResLogEntry[] = []
  public isLoading = false

  public blacklist: ResIpBlacklistItem[] = []
  public newIp = ''
  public newReason = ''
  public logFilter = ''

  public constructor(private readonly apiService: ApiService) {}

  public ngOnInit() {
    this.apiService.getLogs().subscribe((logs) => {
      this.logs = logs.sort((a, b) => b.name.localeCompare(a.name))
    })
    this.loadBlacklist()
  }

  public loadBlacklist() {
    this.apiService.getIpBlacklist().subscribe((blacklist) => {
      this.blacklist = blacklist
    })
  }

  public addBlacklist() {
    if (!this.newIp.trim()) return
    this.apiService.addIpBlacklist(this.newIp.trim(), this.newReason.trim() || null).subscribe(() => {
      this.newIp = ''
      this.newReason = ''
      this.loadBlacklist()
    })
  }

  public deleteBlacklist(id: number) {
    this.apiService.deleteIpBlacklist(id).subscribe(() => {
      this.loadBlacklist()
    })
  }

  public selectLog(name: string) {
    this.selectedLog = name
    this.isLoading = true
    this.apiService.getLog(name).subscribe((entries) => {
      this.entries = entries
      this.isLoading = false
    })
  }

  public get filteredEntries() {
    const q = this.logFilter.trim().toLowerCase()
    if (!q) return this.entries
    return this.entries.filter((entry) => entry.msg.toLowerCase().includes(q) || entry.level.toLowerCase().includes(q))
  }

  public formatTime(time: bigint | number) {
    return new Date(Number(time)).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }
}
