'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, UtensilsCrossed } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { createSession } from '@/lib/actions/session'

const schema = z.object({
  name: z.string().min(1, 'Session name is required').max(100),
  description: z.string().max(500).optional(),
  closingAt: z.string().optional(),
  options: z
    .array(
      z.object({
        name: z.string().min(1, 'Option name is required').max(100),
        address: z.string().max(200).optional(),
        imageUrl: z.string().optional(),
      })
    )
    .min(1, 'Add at least one restaurant option')
    .max(10),
})

type FormValues = z.infer<typeof schema>

export function CreateSessionForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { options: [{ name: '', address: '', imageUrl: '' }] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'options' })

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await createSession(values)
      if (result.success) {
        toast.success('Session created!')
        router.push(`/sessions/${result.data.id}`)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-orange-500" />
            Session Details
          </h2>

          <div className="space-y-1.5">
            <Label htmlFor="name">Session Name *</Label>
            <Input id="name" placeholder="Friday Lunch" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What's this meal session about?"
              rows={2}
              {...register('description')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="closingAt">Voting Deadline (optional)</Label>
            <Input
              id="closingAt"
              type="datetime-local"
              {...register('closingAt')}
              min={new Date().toISOString().slice(0, 16)}
            />
            <p className="text-xs text-muted-foreground">Leave blank to close voting manually.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base">Restaurant Options *</h2>
            <span className="text-xs text-muted-foreground">{fields.length}/10</span>
          </div>

          {errors.options?.root && (
            <p className="text-xs text-destructive">{errors.options.root.message}</p>
          )}

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border p-4 space-y-3 bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Option {index + 1}
                  </span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`options.${index}.name`}>Restaurant Name *</Label>
                  <Input
                    id={`options.${index}.name`}
                    placeholder="Sushi Paradise"
                    {...register(`options.${index}.name`)}
                  />
                  {errors.options?.[index]?.name && (
                    <p className="text-xs text-destructive">
                      {errors.options[index]?.name?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`options.${index}.address`}>Address (optional)</Label>
                  <Input
                    id={`options.${index}.address`}
                    placeholder="123 Main St"
                    {...register(`options.${index}.address`)}
                  />
                </div>
              </div>
            ))}
          </div>

          {fields.length < 10 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full border-dashed"
              onClick={() => append({ name: '', address: '', imageUrl: '' })}
            >
              <Plus className="h-4 w-4" />
              Add Another Option
            </Button>
          )}
        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={isPending}
        size="lg"
        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
      >
        {isPending ? 'Creating...' : 'Create Session'}
      </Button>
    </form>
  )
}
