import { Route } from '@angular/router'
import { LayoutConfig } from './types'

export function defineRoutes(routes: (Omit<Route, 'data'> & { data?: LayoutConfig })[]): Route[] {
  return routes as Route[]
}
