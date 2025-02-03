import type { Preset } from 'unocss'
import { colors } from 'unocss/preset-mini'

const types = ['primary', 'secondary', 'accent', 'success', 'info', 'warning', 'error'] as const
const levels = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const
const sizes = ['sm', 'md', 'lg', 'full'] as const
const fractions = ['1/2', '1/3', '1/4', '1/5', '1/6', 'full', '80', '96', '120', 'sm', 'md', 'lg'] as const
const nums = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

export type Types = (typeof types)[number]
export type Levels = (typeof levels)[number]
export type Sizes = (typeof sizes)[number]
export type Fractions = (typeof fractions)[number]
export type Nums = (typeof nums)[number]

export function presetRomiUI(): Preset {
  return {
    name: '@unocss-ui/preset',
    safelist: [
      ...types.flatMap((t) => levels.map((l) => `bg-${t}-${l}`)),
      ...types.flatMap((t) => levels.map((l) => `hover:bg-${t}-${l}`)),
      ...types.flatMap((t) => levels.map((l) => `border-${t}-${l}`)),
      ...types.flatMap((t) => levels.map((l) => `text-${t}-${l}`)),
      ...types.flatMap((t) => levels.map((l) => `focus:ring-${t}-${l}`)),
      ...types.flatMap((t) => levels.map((l) => `focus:border-${t}-${l}`)),
      ...fractions.flatMap((f) => `w-${f} h-${f}`.split(' ')),
      ...types.map((t) => `border-r-${t}-500`),
      ...sizes.map((s) => `rounded-${s}`),
      ...levels.map((l) => `duration-${l}`),
      ...nums.map((n) => `border-${n}`),
      ...nums.map((n) => `border-t-${n}`)
    ],
    theme: {
      colors: {
        primary: colors.pink,
        secondary: colors.teal,
        accent: colors.purple,
        success: colors.green,
        info: colors.blue,
        warning: colors.yellow,
        error: colors.red
      }
    }
  }
}
