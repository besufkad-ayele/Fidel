import { z } from 'zod'

export const recordPaymentSchema = z.object({
  studentId: z.string().uuid(),
  organizationId: z.string().uuid().optional().or(z.literal('')),
  amount: z.number().positive(),
  currency: z.enum(['ETB', 'USD', 'EUR', 'GBP']),
  provider: z.enum([
    'manual_bank',
    'manual_cash',
    'manual_cheque',
    'manual_invoice',
    'mobile_money',
    'other',
  ]),
  paidAt: z.coerce.date().optional(),
  reference: z.string().max(80).optional().or(z.literal('')),
  status: z.enum(['paid', 'pending', 'partial']),
  note: z.string().max(500).optional().or(z.literal('')),
})

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>
