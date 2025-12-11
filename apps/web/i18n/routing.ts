import { createNavigation } from 'next-intl/navigation'
import { defineRouting } from 'next-intl/routing'

export type locales = 'en' | 'ru' | 'uk'

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'ru', 'uk'],

  // Used when no locale matches
  defaultLocale: 'en',

  // The `pathnames` object maps internal pathnames to external ones
  // This is optional but useful for localized routes
  pathnames: {
    '/': '/',
    '/room': '/room',
  },
})

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname }
  = createNavigation(routing)
