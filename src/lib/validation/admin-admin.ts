import { z } from 'zod'

export const createAdminUserSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email().toLowerCase(),
  adminTitle: z.enum(['super_admin', 'content_manager', 'program_coordinator', 'support']),
  timezone: z.string().default('Africa/Addis_Ababa'),
  /** When set, admin can sign in immediately and is marked active. */
  password: z.string().min(8).max(128).optional(),
  sendInvite: z.boolean().default(true),
  confirmSuperAdmin: z.string().optional(),
})

export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>
