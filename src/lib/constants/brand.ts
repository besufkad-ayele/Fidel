export const BRAND = {
  name: 'Fidel',
  amharic: 'ፊደል',
  tagline: 'Learn Amharic the way Ethiopia is actually spoken.',
  description:
    'Six levels of Amharic for diplomats, NGO staff, researchers, and returning diaspora.',
} as const

export const LEVELS = [
  { id: 'ha', fidel: 'ሀ', cefr: 'A1', title: 'Foundations', comingSoon: false },
  { id: 'le', fidel: 'ለ', cefr: 'A2', title: 'Elementary', comingSoon: true },
  { id: 'hha', fidel: 'ሐ', cefr: 'B1', title: 'Intermediate', comingSoon: true },
  { id: 'me', fidel: 'መ', cefr: 'B2', title: 'Upper Intermediate', comingSoon: true },
  { id: 'sse', fidel: 'ሠ', cefr: 'C1', title: 'Advanced', comingSoon: true },
  { id: 're', fidel: 'ረ', cefr: 'C2', title: 'Mastery', comingSoon: true },
] as const

export type LevelId = (typeof LEVELS)[number]['id']
