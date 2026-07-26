import { z } from 'zod'

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(160),
  type: z.enum([
    'embassy',
    'ngo',
    'government',
    'university',
    'company',
    'religious',
    'individual',
    'other',
  ]),
  country: z.string().max(2).optional().or(z.literal('')),
  billingContactName: z.string().max(120).optional().or(z.literal('')),
  billingContactEmail: z.string().email().optional().or(z.literal('')),
  billingAddress: z.string().max(500).optional().or(z.literal('')),
  taxId: z.string().max(80).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
