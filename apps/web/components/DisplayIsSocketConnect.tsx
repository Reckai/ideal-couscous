'use client'

import React from 'react'
import { useSocket } from '@/providers/SocketProvider'

function DisplaySocketState() {
  const { isConnected } = useSocket()
  console.log(isConnected)
  return (
    <div>
      State :
      {' '}
      {isConnected ? 'Connected' : 'notConnected'}
    </div>
  )
}

export default DisplaySocketState
