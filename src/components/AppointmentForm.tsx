'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, MapPin, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { setAppointment } from '@/lib/actions/appointment'
import type { Appointment } from '@/types'

const schema = z.object({
  restaurantName: z.string().min(1, 'Restaurant name is required').max(100),
  address: z.string().max(200).optional(),
  scheduledAt: z.string().min(1, 'Date and time is required'),
  notes: z.string().max(500).optional(),
})

type FormValues = z.infer<typeof schema>

interface AppointmentFormProps {
  sessionId: string
  existing: Appointment | null
  onSuccess?: () => void
}

export function AppointmentForm({ sessionId, existing, onSuccess }: AppointmentFormProps) {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      restaurantName: existing?.restaurantName ?? '',
      address: existing?.address ?? '',
      scheduledAt: existing?.scheduledAt
        ? new Date(existing.scheduledAt).toISOString().slice(0, 16)
        : '',
      notes: existing?.notes ?? '',
    },
  })

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await setAppointment({
        sessionId,
        restaurantName: values.restaurantName,
        address: values.address,
        scheduledAt: new Date(values.scheduledAt).toISOString(),
        notes: values.notes,
      })

      if (result.success) {
        toast.success('Appointment confirmed! Members have been notified.')
        onSuccess?.()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="restaurantName">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            Restaurant Name
          </span>
        </Label>
        <Input
          id="restaurantName"
          placeholder="e.g. Sushi Paradise"
          {...register('restaurantName')}
        />
        {errors.restaurantName && (
          <p className="text-xs text-destructive">{errors.restaurantName.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Address (optional)</Label>
        <Input id="address" placeholder="e.g. 123 Main St" {...register('address')} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="scheduledAt">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            Date & Time
          </span>
        </Label>
        <Input
          id="scheduledAt"
          type="datetime-local"
          {...register('scheduledAt')}
          min={new Date().toISOString().slice(0, 16)}
        />
        {errors.scheduledAt && (
          <p className="text-xs text-destructive">{errors.scheduledAt.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            Notes (optional)
          </span>
        </Label>
        <Textarea
          id="notes"
          placeholder="Any extra info for the group..."
          rows={3}
          {...register('notes')}
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
      >
        {isPending ? 'Confirming...' : existing ? 'Update Appointment' : 'Confirm Appointment'}
      </Button>
    </form>
  )
}
