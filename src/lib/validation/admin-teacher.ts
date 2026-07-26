import { z } from 'zod'

export const createTeacherSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email().toLowerCase(),
  phone: z.string().optional().or(z.literal('')),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password is too long'),
  timezone: z.string().default('Africa/Addis_Ababa'),
  headline: z.string().max(160).optional().or(z.literal('')),
  bio: z.string().max(4000).optional().or(z.literal('')),
  yearsExperience: z.number().int().min(0).max(60).optional(),
  languages: z.array(z.string()).default(['am', 'en']),
  qualifications: z.array(z.string()).default([]),
  specializations: z.array(z.string()).default([]),
  isAcceptingStudents: z.boolean().default(true),
  hourlyRateCents: z.number().int().min(0).optional(),
  currency: z.enum(['ETB', 'USD', 'EUR', 'GBP']).default('ETB'),
  isPublic: z.boolean().default(false),
})

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>
