import { ResCharacterData } from '../models/api.model'

export function sortByCreatedTime<T extends { created: number }[]>(list: T, reverse = true): T {
  return list.sort((a, b) => (reverse ? -1 : 1) * (a.created - b.created))
}

export function renderCharacterBWH({ bust, waist, hip }: ResCharacterData) {
  return `${bust ? `B${bust}` : ''}${waist ? `${bust ? '/' : ''}W${waist}` : ''}${hip ? `${bust || waist ? '/' : ''}H${hip}` : ''}`
}

export function randomRTagType() {
  return randomSelect(['primary', 'secondary', 'accent', 'success', 'info', 'warning', 'error'])
}

export function formatDate(date: Date) {
  const addZero = (num: number) => (num < 10 ? `0${num}` : num)
  return `${date.getFullYear()}-${addZero(date.getMonth() + 1)}-${addZero(date.getDate())}T${addZero(date.getHours())}:${addZero(date.getMinutes())}`
}

export function randomSelect<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function showErr(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}
