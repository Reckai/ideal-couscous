import { clearStack, context } from '@reatom/core'
import { reatomContext } from '@reatom/react'
import { RouterProvider } from 'react-router-dom'
// import { initRoomEffect } from '@/models/room.model'
import { router } from '@/router'
import './i18n'

clearStack()
const rootFrame = context.start()

function App() {
  return (
    <reatomContext.Provider value={rootFrame}>
      <RouterProvider router={router} />
    </reatomContext.Provider>
  )
}

export default App
