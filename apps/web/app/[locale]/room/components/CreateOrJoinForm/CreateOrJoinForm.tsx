'use client'
import Link from 'next/link'
import React from 'react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/routes'

function CreateOrJoinForm() {
  return (
    <>
      <Link
        href={ROUTES.ROOM.CREATE}
      >
        <Button
          className="border-border/50 dark:border-border/50 hover:border-pink-400/60 dark:hover:border-pink-400/60 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 w-full"
          size="lg"
          variant="outline"
        >
          Create
        </Button>

      </Link>
      <Link
        href={ROUTES.ROOM.JOIN}
      >
        <Button
          size="lg"
          className="border-border/50 dark:border-border/50 hover:border-purple-500/70 dark:hover:border-purple-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 w-full"
          variant="outline"
        >
          Join
        </Button>

      </Link>
    </>
  )
}

export default CreateOrJoinForm
