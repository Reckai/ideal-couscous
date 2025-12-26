import { createBrowserRouter } from 'react-router-dom'
import RootLayout from '@/components/layout/RootLayout'
import Home from '@/pages/Home'

import RoomEntry from '@/pages/RoomEntry'
import Room from './pages/Room/Room'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/room', element: <RoomEntry /> },
      { path: '/room/:inviteCode', element: <Room /> },
    ],
  },
])
