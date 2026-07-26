import { z } from 'zod'

export const createStudentSchema = z
  .object({
    fullName: z
      .string()
      .min(2)
      .max(120)
      .regex(/^[\p{L}\s'-]+$/u, 'Use letters, spaces, hyphens, or apostrophes'),
    preferredName: z.string().max(60).optional().or(z.literal('')),
    email: z.string().email().toLowerCase(),
    phone: z
      .string()
      .regex(/^\+[1-9]\d{7,14}$/, 'Use E.164 format, e.g. +251911234567')
      .optional()
      .or(z.literal('')),
    isActive: z.enum(['active', 'pending', 'suspended']).default('active'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password is too long'),
    adminNotes: z.string().max(2000).optional().or(z.literal('')),

    persona: z.enum([
      'diplomat',
      'ngo',
      'tourist',
      'missionary',
      'researcher',
      'diaspora',
      'other',
    ]),
    studyIntent: z.enum(['casual', 'steady', 'intensive']).default('steady'),
    learningGoal: z.string().max(500).optional().or(z.literal('')),
    priorExperience: z
      .enum(['none', 'few_words', 'speaks_some', 'reads_fidel', 'conversational'])
      .default('none'),
    nativeLanguage: z.string().max(8).optional().or(z.literal('')),
    otherLanguages: z.array(z.string()).max(10).default([]),
    startingLevelId: z.enum(['ha', 'le', 'hha', 'me', 'sse', 're']).default('ha'),

    organization: z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().max(160),
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
        billingContactName: z.string().max(120).optional().or(z.literal('')),
        billingContactEmail: z.string().email().optional().or(z.literal('')),
      })
      .optional(),
    jobTitle: z.string().max(120).optional().or(z.literal('')),
    department: z.string().max(120).optional().or(z.literal('')),
    cohortId: z.string().uuid().optional().or(z.literal('')),

    timezone: z.string().min(3).default('Africa/Addis_Ababa'),
    country: z.string().max(2).optional().or(z.literal('')),
    locale: z.literal('en').default('en'),
    preferredDays: z.array(z.number().int().min(0).max(6)).default([]),
    preferredTimes: z.array(z.enum(['morning', 'afternoon', 'evening'])).default([]),

    access: z
      .object({
        scope: z.enum(['level', 'unit']),
        levelIds: z.array(z.string()).default([]),
        unitIds: z.array(z.string()).default([]),
        source: z.enum(['purchase', 'trial', 'promo', 'admin_grant']),
        grantedAt: z.coerce.date().optional(),
        expiresAt: z.coerce.date().optional(),
        sessionCredits: z.number().int().min(0).max(100).default(0),
        creditsExpireAt: z.coerce.date().optional(),
        note: z.string().min(1).max(300),
      })
      .refine((a) => (a.scope === 'level' ? a.levelIds.length > 0 : a.unitIds.length > 0), {
        message: 'Select at least one level or unit',
        path: ['levelIds'],
      })
      .optional(),

    payment: z
      .object({
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
      .optional(),

    teacherIds: z.array(z.string().uuid()).default([]),
    primaryTeacherId: z.string().uuid().optional().or(z.literal('')),
  })
  .refine((v) => v.access?.source !== 'purchase' || !!v.payment, {
    message: 'A payment record is required when the access source is Paid',
    path: ['payment'],
  })
  .refine((v) => v.teacherIds.length === 0 || !!v.primaryTeacherId, {
    message: 'Choose which teacher is primary',
    path: ['primaryTeacherId'],
  })

export type CreateStudentInput = z.infer<typeof createStudentSchema>
