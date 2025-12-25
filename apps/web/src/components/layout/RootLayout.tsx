import { Outlet } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { SocketProvider } from '@/providers/SocketProvider'

export default function RootLayout() {
  return (
    <SocketProvider>
      <ThemeProvider>
        <div className="min-h-screen font-sans antialiased text-foreground bg-background">
          <Outlet />
        </div>
      </ThemeProvider>
    </SocketProvider>
  )
}
