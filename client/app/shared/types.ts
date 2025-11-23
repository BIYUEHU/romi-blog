import { ResMusicData } from '../models/api.model'

export type APlayer = {
  destroy(): void
  play(): void
  pause(): void
  toggle(): void
  seek(time: number): void
  list: {
    show(): void
    hide(): void
    add(data: ResMusicData[]): void
    remove(index: number): void
    switch(index: number): void
  }
}

export const APlayer = (globalThis as unknown as { APlayer: new (options: object) => APlayer }).APlayer

export interface LayoutConfig {
  imageHeight: string
  fullBackground: boolean
  disabledFooter: boolean
  headerTitle: string
  headerSubTitle: string[]
  headerImageUrl: string
}

export type DependentPage = {
  name: string
  title: string
  id: number
} & (
  | {
      routine: true
      hideToc: boolean
      hideComments: boolean
    }
  | {
      routine: false
      template: string
    }
)
