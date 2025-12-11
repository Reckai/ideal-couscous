import type { Metadata, Viewport } from 'next'
import type { locales } from '@/i18n/routing'
import { Analytics } from '@vercel/analytics/next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Geist } from 'next/font/google'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { SocketProvider } from '@/providers/SocketProvider'
import '../globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AniTinder | Find What to Watch Together',
  description: 'Stop the endless debate. Create a room, swipe through options together, and match on something you both love to watch.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as locales)) {
    notFound()
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages()

  return (
    <html lang={locale} className={`dark ${geist.className}`}>
      <body className="font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <SocketProvider>{children}</SocketProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  )
}
