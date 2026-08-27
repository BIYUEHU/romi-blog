import { passcore } from 'passcorelib'
import { ResCharacterData, ResPostData, ResPostSingleData } from '../models/api.model'

export const formatHitokotoSource = (from?: string | null, fromWho?: string | null) => {
  const source = from?.trim()
  return [fromWho?.trim(), source ? `「${source}」` : null].filter(Boolean).join('')
}

export function sortByCreatedTime<T extends { created: number }>(list: T[], reverse = true): T[] {
  return list.sort((a, b) => (reverse ? -1 : 1) * (a.created - b.created))
}

export function handlePasswordAndHidePost<T extends ResPostData | ResPostSingleData>(list: T[]): T[] {
  return list.filter((post) => !post.hide).map((post) => (post.password ? { ...post, summary: '文章已加密' } : post))
}

export function renderCharacterBWH({ bust, waist, hip }: ResCharacterData) {
  return `${bust ? `B${bust}` : ''}${waist ? `${bust ? '/' : ''}W${waist}` : ''}${hip ? `${bust || waist ? '/' : ''}H${hip}` : ''}`
}

export function randomRTagType() {
  return randomSelect(['primary', 'secondary', 'accent', 'success', 'info', 'warning', 'error'])
}

export function formatDate(date: Date) {
  const addZero = (num: number) => (num < 10 ? `0${num}` : num)
  return `${date.getFullYear()}-${addZero(date.getMonth() + 1)}-${addZero(date.getDate())} ${addZero(date.getHours())}:${addZero(date.getMinutes())}`
}

export function randomSelect<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function showErr(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export function isPasswordStrong(password: string): boolean {
  return password.length >= 6 && passcore(password).score >= 2
}
