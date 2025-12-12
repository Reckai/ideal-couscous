import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  transpilePackages: ['@netflix-tinder/shared'],
}

export default withNextIntl(nextConfig)
