import { z } from 'zod'

export const grantEntitlementSchema = z
  .object({
    studentId: z.string().uuid(),
    scope: z.enum(['level', 'unit']),
    levelIds: z.array(z.string()).default([]),
    unitIds: z.array(z.string()).default([]),
    source: z.enum(['purchase', 'trial', 'promo', 'admin_grant', 'staff']),
    grantedAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional(),
    sessionCredits: z.number().int().min(0).max(100).default(0),
    creditsExpireAt: z.coerce.date().optional(),
    note: z.string().min(1).max(300),
  })
  .refine((a) => (a.scope === 'level' ? a.levelIds.length > 0 : a.unitIds.length > 0), {
    message: 'Select at least one level or unit',
  })

export type GrantEntitlementInput = z.infer<typeof grantEntitlementSchema>
