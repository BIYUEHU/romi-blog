import { Injectable } from '@angular/core'
import { pipe } from 'fp-ts/function'
import { filterMap, none, Option, some } from 'fp-ts/Option'
import { Observable, of, tap } from 'rxjs'
import { match, P } from 'ts-pattern'
import { RTime } from '../shared/types'
import { STORE_KEYS, StoreService } from './store.service'

interface CacheEntry<T> {
  data: T
  timestamp: number
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private static SHORT_TTL: RTime = RTime.Second(30)

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

  private set<T = unknown>(key: string, data: T, shortTtl: RTime) {
    this.storeService.setItem(
      STORE_KEYS.cache(key),
      JSON.stringify({
        data,
        timestamp: Date.now() + pipe(shortTtl, RTime.toNumber)
      })
    )
  }

  public constructor(private readonly storeService: StoreService) {}

  public wrap<T = unknown>(
    key: string,
    f: () => Observable<T>,
    cacheCondition: (data: T) => boolean,
    longTtl: RTime,
    shortTtl: RTime = CacheService.SHORT_TTL
  ): Observable<T> {
    return match(this.get<T>(key))
      .with(
        { _tag: 'Some', value: { timestamp: P.when((timestamp) => Date.now() < timestamp) } },
        ({ value: { data } }) => of(data)
      )
      .with(
        {
          _tag: 'Some',
          value: { timestamp: P.when((timestamp) => Date.now() < timestamp + pipe(longTtl, RTime.toNumber)) }
        },
        ({ value: { data } }) => {
          f().subscribe((data) => {
            if (cacheCondition(data)) this.set(key, data, shortTtl)
          })
          return of(data)
        }
      )
      .otherwise(() =>
        f().pipe(
          tap((data) => {
            if (cacheCondition(data)) this.set(key, data, shortTtl)
          })
        )
      )
  }
}
