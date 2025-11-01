import { ResCharacterData } from '../models/api.model'

export function sortByCreatedTime<T extends { created: number }[]>(list: T, reverse = true): T {
  return list.sort((a, b) => (reverse ? -1 : 1) * (a.created - b.created))
}

export function renderCharacterBWH({ bust, waist, hip }: ResCharacterData) {
  return `${bust ? `B${bust}` : ''}${waist ? `${bust ? '/' : ''}W${waist}` : ''}${hip ? `${bust || waist ? '/' : ''}H${hip}` : ''}`
}

export function randomRTagType() {
  const types = ['primary', 'secondary', 'accent', 'success', 'info', 'warning', 'error']
  return types[Math.floor(Math.random() * types.length)]
}

export function formatDate(date: Date) {
  const addZero = (num: number) => (num < 10 ? `0${num}` : num)
  return `${date.getFullYear()}-${addZero(date.getMonth() + 1)}-${addZero(date.getDate())}T${addZero(date.getHours())}:${addZero(date.getMinutes())}`
}
