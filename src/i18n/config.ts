export const locales = ['en'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

/** Where the visitor's locale override is persisted before they have a profile. */
export const LOCALE_COOKIE = 'fidel-locale'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
}
