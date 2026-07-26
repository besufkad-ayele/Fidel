export const HA_UNITS = [
  {
    id: 'greetings',
    number: '፩',
    title: 'Greetings & Basic Civilities',
    amharic: 'ሰላምታ',
    description: 'Say hello, ask how someone is, introduce yourself politely, say goodbye',
    locked: false,
  },
  {
    id: 'introductions',
    number: '፪',
    title: 'Self Introduction & Origins',
    amharic: null,
    description: 'State your name, profession, country, and language background',
    locked: true,
  },
] as const

export const UNIT_PARTS = [
  {
    id: 'culture',
    part: 'Part 1',
    title: 'Cultural Insight',
    body: 'Discover body language, greeting etiquette, and values behind Ethiopian hospitality.',
    cta: 'Explore cultural context',
    href: '/levels/ha/culture',
  },
  {
    id: 'lesson',
    part: 'Part 2',
    title: 'Language Lesson',
    body: 'Master greetings by gender, time of day, audio pronunciation, and grammar endings.',
    cta: 'Study Amharic rules',
    href: '/levels/ha/lesson',
  },
  {
    id: 'practice',
    part: 'Part 3',
    title: 'Practice & Drill',
    body: 'Flashcard deck, interactive quizzes, dialogue playback, and speaking recorder drill.',
    cta: 'Start exercises',
    href: '/levels/ha/practice',
  },
] as const
