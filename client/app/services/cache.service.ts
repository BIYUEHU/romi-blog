import { Injectable } from '@angular/core'
import { pipe } from 'fp-ts/function'
import { filterMap, none, Option, some } from 'fp-ts/Option'
import { iso, Newtype } from 'newtype-ts'
import { Observable, of, tap } from 'rxjs'
import { match, P } from 'ts-pattern'
import { STORE_KEYS, StoreService } from './store.service'

export interface RTime
  extends Newtype<
    { readonly RTime: unique symbol },
    | { readonly _tag: 'RDay'; value: number }
    | { readonly _tag: 'RHour'; value: number }
    | { readonly _tag: 'RMinute'; value: number }
    | { readonly _tag: 'RSecond'; value: number }
    | { readonly _tag: 'RMerge'; value: [RTime, RTime] }
  > {}

const isoRtime = iso<RTime>()

export const RDay = (value: number) => isoRtime.wrap({ _tag: 'RDay', value })
export const RHour = (value: number) => isoRtime.wrap({ _tag: 'RHour', value })
export const RMinute = (value: number) => isoRtime.wrap({ _tag: 'RMinute', value })
export const RSecond = (value: number) => isoRtime.wrap({ _tag: 'RSecond', value })
export const RMerge = (time1: RTime, time2: RTime) => isoRtime.wrap({ _tag: 'RMerge', value: [time1, time2] })

export function toNumber(time: RTime): number {
  return match(isoRtime.unwrap(time))
    .with({ _tag: 'RDay' }, ({ value }) => value * 24 * 60 * 60 * 1000)
    .with({ _tag: 'RHour' }, ({ value }) => value * 60 * 60 * 1000)
    .with({ _tag: 'RMinute' }, ({ value }) => value * 60 * 1000)
    .with({ _tag: 'RSecond' }, ({ value }) => value * 1000)
    .with({ _tag: 'RMerge' }, ({ value: [t1, t2] }) => toNumber(t1) + toNumber(t2))
    .exhaustive()
}

interface CacheEntry<T> {
  data: T
  timestamp: number
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private static SHORT_TTL: RTime = RSecond(30)

  private get<T = unknown>(key: string): Option<CacheEntry<T>> {
    return pipe(
      match(this.storeService.getItem(STORE_KEYS.cache(key)))
        .with(P.string, some)
        .with(null, () => none)
        .exhaustive(),
      filterMap((source) => {
        try {
          return some(JSON.parse(source))
        } catch {
          return none
        }
      })
    )
  }

  private set<T = unknown>(key: string, data: T) {
    this.storeService.setItem(
      STORE_KEYS.cache(key),
      JSON.stringify({
        data,
        timestamp: Date.now() + pipe(CacheService.SHORT_TTL, toNumber)
      })
    )
  }

  public constructor(private readonly storeService: StoreService) {}

  public wrap<T = unknown>(key: string, longTtl: RTime, f: () => Observable<T>): Observable<T> {
    return match(this.get<T>(key))
      .with(
        { _tag: 'Some', value: { timestamp: P.when((timestamp) => Date.now() < timestamp) } },
        ({ value: { data } }) => of(data)
      )
      .with(
        { _tag: 'Some', value: { timestamp: P.when((timestamp) => Date.now() < timestamp + pipe(longTtl, toNumber)) } },
        ({ value: { data } }) => {
          f().pipe(tap((data) => this.set(key, data)))
          return of(data)
        }
      )
      .otherwise(() => f().pipe(tap((data) => this.set(key, data))))
  }
}
