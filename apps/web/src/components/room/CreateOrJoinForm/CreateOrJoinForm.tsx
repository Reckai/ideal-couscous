import { zodResolver } from '@hookform/resolvers/zod'
import { wrap } from '@reatom/core'
import { reatomComponent } from '@reatom/react'
import { Plus, Users } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { cn } from '@/lib/utils'
import { createRoomAction, errorAtom, joinRoomAction } from '@/models/room.model'

const items = [0, 1, 2, 3, 4, 5]
const ALLOWED_CHARS_REGEX = /^[A-HJ-NP-Z2-9]+$/

const validationSchema = z.object({
  inviteCode: z.string().min(6, { message: 'Code must be 6 characters.' }).regex(ALLOWED_CHARS_REGEX, {
    message: 'Invalid characters (A-Z, 2-9)',
  }),
})

const CreateOrJoinForm = reatomComponent(() => {
  const error = errorAtom()
  const isCreatePending = Boolean(createRoomAction.pending())
  const isJoinPending = Boolean(joinRoomAction.pending())
  const isPending = isCreatePending || isJoinPending
  const [mode, setMode] = useState<'create' | 'join'>('create')

  const form = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
    mode: 'onChange',
    defaultValues: {
      inviteCode: '',
    },
  })

  const onSubmit = wrap((data: z.infer<typeof validationSchema>) => {
    joinRoomAction(data.inviteCode)
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
        <Button
          variant={mode === 'create' ? 'default' : 'ghost'}
          onClick={() => setMode('create')}
          className={cn('w-full transition-all', mode === 'create' && 'shadow-sm')}
          type="button"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create
        </Button>
        <Button
          variant={mode === 'join' ? 'default' : 'ghost'}
          onClick={() => setMode('join')}
          className={cn('w-full transition-all', mode === 'join' && 'shadow-sm')}
          type="button"
        >
          <Users className="mr-2 h-4 w-4" />
          Join
        </Button>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
          {error}
        </div>
      )}

      <div className="min-h-[150px] flex items-center justify-center">
        {mode === 'create'
          ? (
              <div className="space-y-4 w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                <p className="text-muted-foreground text-sm">
                  Start a new matching session and invite friends to join.
                </p>
                <Button
                  onClick={wrap(createRoomAction)}
                  disabled={isPending}
                  className="w-full"
                  size="lg"
                >
                  Start New Room
                </Button>
              </div>
            )
          : (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-center">
                  <Controller
                    name="inviteCode"
                    control={form.control}
                    render={({ field }) => (
                      <InputOTP maxLength={6} value={field.value} onChange={field.onChange}>
                        <InputOTPGroup>
                          {items.map((el) => (
                            <InputOTPSlot
                              className="w-10 h-12 text-lg dark:border-input border-input"
                              index={el}
                              key={el}
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    )}
                  />
                </div>

                {form.formState.errors.inviteCode && (
                  <p className="text-sm text-center text-red-500 animate-in zoom-in-95">
                    {form.formState.errors.inviteCode.message}
                  </p>
                )}

                <Button
                  disabled={isPending || !form.formState.isValid}
                  type="submit"
                  size="lg"
                  className="w-full"
                >
                  Join Room
                </Button>
              </form>
            )}
      </div>
    </div>
  )
}, 'CreateOrJoinForm')

export default CreateOrJoinForm
