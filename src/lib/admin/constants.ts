export const LEVEL_OPTIONS = [
  { id: 'ha', fidel: 'ሀ', label: 'ሀ — Foundations', cefr: 'A1' },
  { id: 'le', fidel: 'ለ', label: 'ለ — Everyday life', cefr: 'A2' },
  { id: 'hha', fidel: 'ሐ', label: 'ሐ — Work & community', cefr: 'B1' },
  { id: 'me', fidel: 'መ', label: 'መ — Narrative', cefr: 'B1+' },
  { id: 'sse', fidel: 'ሠ', label: 'ሠ — Professional', cefr: 'B2' },
  { id: 're', fidel: 'ረ', label: 'ረ — Fluency', cefr: 'C1' },
] as const

export const PERSONAS = [
  { id: 'diplomat', label: 'Diplomat' },
  { id: 'ngo', label: 'NGO / Humanitarian' },
  { id: 'tourist', label: 'Tourist / Visitor' },
  { id: 'missionary', label: 'Missionary' },
  { id: 'researcher', label: 'Researcher / Academic' },
  { id: 'diaspora', label: 'Diaspora' },
  { id: 'other', label: 'Other' },
] as const

export const ORG_TYPES = [
  { id: 'embassy', label: 'Embassy / Diplomatic Mission' },
  { id: 'ngo', label: 'NGO / Humanitarian' },
  { id: 'government', label: 'Government Agency' },
  { id: 'university', label: 'University / Research' },
  { id: 'company', label: 'Private Company' },
  { id: 'religious', label: 'Religious Organization' },
  { id: 'individual', label: 'Individual' },
  { id: 'other', label: 'Other' },
] as const

export const ADMIN_TITLES = [
  { id: 'super_admin', label: 'Super Admin' },
  { id: 'content_manager', label: 'Content Manager' },
  { id: 'program_coordinator', label: 'Program Coordinator' },
  { id: 'support', label: 'Support' },
] as const

export const PAYMENT_PROVIDERS = [
  { id: 'manual_bank', label: 'Bank transfer' },
  { id: 'manual_cash', label: 'Cash' },
  { id: 'manual_cheque', label: 'Cheque' },
  { id: 'manual_invoice', label: 'Invoice (unpaid)' },
  { id: 'mobile_money', label: 'Mobile money' },
  { id: 'other', label: 'Other' },
] as const

export const TIMEZONES = [
  'Africa/Addis_Ababa',
  'Africa/Nairobi',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Dubai',
  'Asia/Singapore',
  'Australia/Sydney',
] as const

export function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
