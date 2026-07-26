import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, isLocale, LOCALE_COOKIE } from './config'

/**
 * Locale is a user preference (`profiles.locale`), not a URL segment — see
 * docs/01-architecture.md §6. The cookie is written when a signed-in user changes
 * their language, so it is already correct before any database read happens here.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const requested = cookieStore.get(LOCALE_COOKIE)?.value
  const locale = isLocale(requested) ? requested : defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: 'Africa/Addis_Ababa',
  }
})
