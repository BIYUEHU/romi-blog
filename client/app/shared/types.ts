import { iso, Newtype } from 'newtype-ts'
import { match } from 'ts-pattern'
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

export interface MessageBoxType
  extends Newtype<
    { readonly MessageBoxType: unique symbol },
    | { readonly _tag: 'Info' }
    | { readonly _tag: 'Error' }
    | { readonly _tag: 'Success' }
    | { readonly _tag: 'Warning' }
    | { readonly _tag: 'Secondary' }
    | { readonly _tag: 'Primary' }
  > {}

export const isoMessageBoxType = iso<MessageBoxType>()

export const MessageBoxType = {
  Info: isoMessageBoxType.wrap({ _tag: 'Info' }),
  Error: isoMessageBoxType.wrap({ _tag: 'Error' }),
  Success: isoMessageBoxType.wrap({ _tag: 'Success' }),
  Warning: isoMessageBoxType.wrap({ _tag: 'Warning' }),
  Secondary: isoMessageBoxType.wrap({ _tag: 'Secondary' }),
  Primary: isoMessageBoxType.wrap({ _tag: 'Primary' }),
  show: (type: MessageBoxType) => isoMessageBoxType.unwrap(type)._tag.toLowerCase()
}

export interface MessageBoxSecond
  extends Newtype<{ readonly MessageBoxSecond: unique symbol }, { readonly _tag: 'MessageBoxSecond'; value: number }> {}

export const isoMessageBoxSecond = iso<MessageBoxSecond>()

export const MessageBoxSecond = (value: number) => isoMessageBoxSecond.wrap({ _tag: 'MessageBoxSecond', value })

export interface RTime
  extends Newtype<
    { readonly RTime: unique symbol },
    | { readonly _tag: 'Day'; value: number }
    | { readonly _tag: 'Hour'; value: number }
    | { readonly _tag: 'Minute'; value: number }
    | { readonly _tag: 'Second'; value: number }
    | { readonly _tag: 'Merge'; value: [RTime, RTime] }
  > {}

export const isoRTime = iso<RTime>()

export const RTime = {
  Day: (value: number) => isoRTime.wrap({ _tag: 'Day', value }),
  Hour: (value: number) => isoRTime.wrap({ _tag: 'Hour', value }),
  Minute: (value: number) => isoRTime.wrap({ _tag: 'Minute', value }),
  Second: (value: number) => isoRTime.wrap({ _tag: 'Second', value }),
  Merge: (time1: RTime, time2: RTime) => isoRTime.wrap({ _tag: 'Merge', value: [time1, time2] }),
  toNumber: (time: RTime): number =>
    match(isoRTime.unwrap(time))
      .with({ _tag: 'Day' }, ({ value }) => value * 24 * 60 * 60 * 1000)
      .with({ _tag: 'Hour' }, ({ value }) => value * 60 * 60 * 1000)
      .with({ _tag: 'Minute' }, ({ value }) => value * 60 * 1000)
      .with({ _tag: 'Second' }, ({ value }) => value * 1000)
      .with({ _tag: 'Merge' }, ({ value: [t1, t2] }) => RTime.toNumber(t1) + RTime.toNumber(t2))
      .exhaustive()
}

export interface UrlPattern
  extends Newtype<
    { readonly UrlPattern: unique symbol },
    | { readonly _tag: 'Starts'; value: string }
    | { readonly _tag: 'Full'; value: string }
    | { readonly _tag: 'Ends'; value: string }
    | { readonly _tag: 'All' }
  > {}

const isoUrlPattern = iso<UrlPattern>()

export const UrlPattern = {
  Starts: (value: string) => isoUrlPattern.wrap({ _tag: 'Starts', value }),
  Full: (value: string) => isoUrlPattern.wrap({ _tag: 'Full', value }),
  Ends: (value: string) => isoUrlPattern.wrap({ _tag: 'Ends', value }),
  All: isoUrlPattern.wrap({ _tag: 'All' }),
  test: (url: string, pattern: UrlPattern): boolean =>
    match(isoUrlPattern.unwrap(pattern))
      .with({ _tag: 'Starts' }, ({ value }) => url.startsWith(value))
      .with({ _tag: 'Full' }, ({ value }) => url === value)
      .with({ _tag: 'Ends' }, ({ value }) => url.endsWith(value))
      .with({ _tag: 'All' }, () => true)
      .exhaustive(),
  dispatch: (target: string, list: [UrlPattern, () => void][]) => {
    for (const [pattern, callback] of list) if (UrlPattern.test(target, pattern)) return callback()
  }
}

export interface CommentStatus
  extends Newtype<
    { readonly CommentStatus: unique symbol },
    { readonly _tag: 'Resolved' } | { readonly _tag: 'Pending' } | { readonly _tag: 'Spam' }
  > {}

export const isoCommentStatus = iso<CommentStatus>()
//
// export const CommentResolved = isoCommentStatus.wrap({ _tag: 'Resolved' })
// export const CommentPending = isoCommentStatus.wrap({ _tag: 'Pending' })
// export const CommentSpam = isoCommentStatus.wrap({ _tag: 'Spam' })

export const CommentStatus = {
  Resolved: isoCommentStatus.wrap({ _tag: 'Resolved' }),
  Pending: isoCommentStatus.wrap({ _tag: 'Pending' }),
  Spam: isoCommentStatus.wrap({ _tag: 'Spam' }),
  toNumber: (status: CommentStatus): number =>
    match(isoCommentStatus.unwrap(status))
      .with({ _tag: 'Resolved' }, () => 0)
      .with({ _tag: 'Pending' }, () => 1)
      .with({ _tag: 'Spam' }, () => 2)
      .exhaustive()
}
