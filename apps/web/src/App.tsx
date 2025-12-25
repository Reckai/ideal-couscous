import { clearStack, context } from '@reatom/core'
import { reatomContext } from '@reatom/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import RootLayout from '@/components/layout/RootLayout'
import { initRoomEffect } from '@/models/room.model'
import Home from '@/pages/Home'
import Room from '@/pages/Room'
import RoomEntry from '@/pages/RoomEntry'
import './i18n'

clearStack()
const rootFrame = context.start()

// Run effect INSIDE the context
rootFrame.run(initRoomEffect)

function App() {
  return (
    <reatomContext.Provider value={rootFrame}>
      <BrowserRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/room" element={<RoomEntry />} />
            <Route path="/room/:inviteCode" element={<Room />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </reatomContext.Provider>
  )
}

export default App
