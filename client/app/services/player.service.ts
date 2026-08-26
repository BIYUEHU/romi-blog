import { Injectable } from '@angular/core'
import {
  destroyInstance,
  hideInstance,
  makePlayer,
  pauseInstance,
  playerInstance,
  playInstance,
  remountInstance,
  showInstance
} from 'resplayer'
import { ApiService } from './api.service'
import { BrowserService } from './browser.service'
import { STORE_KEYS, StoreService } from './store.service'
import { ThemeService } from './theme.service'

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private player?: playerInstance
  private container?: HTMLElement
  private listener() {
    if (!this.player || this.disabled) return
    playInstance(this.player)
    this.removeListeners()
  }
  private addListeners() {
    this.removeListeners()
    this.listenerRefer = this.listener.bind(this)
    ;['click', 'tourchstart'].map((event) => document.addEventListener(event, this.listenerRefer!))
  }
  private removeListeners() {
    if (!this.listenerRefer) return
    ;['click', 'tourchstart'].map((event) => document.removeEventListener(event, this.listenerRefer!))
  }
  private listenerRefer?: () => void

  public constructor(
    private readonly storeService: StoreService,
    private readonly browserService: BrowserService,
    private readonly apiService: ApiService,
    private readonly themeService: ThemeService
  ) {}

  public get disabled() {
    return this.storeService.getItem(STORE_KEYS.PLAYER_DISABLED) === 'true'
  }

  public init(container: HTMLElement) {
    if (!this.browserService.is) return
    if (this.player) {
      if (container && container !== this.container) {
        remountInstance(this.player, container)
        this.container = container
      }
      return
    }

    this.apiService.getMusic().subscribe((musicList) => {
      this.removeListeners
      this.container = container
      this.player = makePlayer({
        container,
        fixed: true,
        autoplay: true,
        order: 'random',
        theme: this.themeService.selectedTheme,
        color: 'var(--brand-base)',
        audio: musicList,
        titleChange: false,
        showList: false,
        debug: false
      })
      if (this.disabled) {
        pauseInstance(this.player)
        hideInstance(this.player)
      } else {
        pauseInstance(this.player)
        this.addListeners()
      }
    })
  }

  public toggle() {
    if (!this.player) return

    if (this.disabled) {
      this.storeService.setItem(STORE_KEYS.PLAYER_DISABLED, 'false')
      showInstance(this.player)
      playInstance(this.player)
    } else {
      this.storeService.setItem(STORE_KEYS.PLAYER_DISABLED, 'true')
      pauseInstance(this.player)
      hideInstance(this.player)
    }
  }

  public destroy() {
    if (!this.player) return
    destroyInstance(this.player)
    this.player = void 0
  }
}
