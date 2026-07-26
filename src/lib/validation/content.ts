import { z } from 'zod'

const personaEnum = z.enum([
  'default',
  'diplomat',
  'ngo',
  'tourist',
  'missionary',
  'researcher',
  'diaspora',
  'other',
])

export const contentBlockTypeSchema = z.enum([
  'heading',
  'rich_text',
  'image',
  'video',
  'audio',
  'callout',
  'dos_donts',
  'why_matters',
  'table',
  'references',
  'objectives',
  'dialogue',
  'vocabulary_set',
  'comprehension_check',
  'flashcard_revision',
  'listening_practice',
  'matching_cards',
  'multiple_choice',
  'speaking_task',
  'video_practice',
  'homework_prompt',
  'divider',
])

export type ContentBlockType = z.infer<typeof contentBlockTypeSchema>

const blockBase = z.object({
  id: z.string().min(1),
})

export const headingBlockSchema = blockBase.extend({
  type: z.literal('heading'),
  level: z.union([z.literal(2), z.literal(3)]),
  text: z.string(),
})

export const richTextBlockSchema = blockBase.extend({
  type: z.literal('rich_text'),
  markdown: z.string(),
})

const optionalUrl = z.string().default('')

export const imageBlockSchema = blockBase.extend({
  type: z.literal('image'),
  mediaAssetId: z.string().uuid().optional().nullable(),
  url: optionalUrl,
  caption: z.string().optional(),
  alt: z.string().optional(),
})

export const videoBlockSchema = blockBase.extend({
  type: z.literal('video'),
  mediaAssetId: z.string().uuid().optional().nullable(),
  url: optionalUrl,
  caption: z.string().optional(),
})

export const audioBlockSchema = blockBase.extend({
  type: z.literal('audio'),
  mediaAssetId: z.string().uuid().optional().nullable(),
  url: optionalUrl,
  label: z.string().optional(),
})

export const calloutBlockSchema = blockBase.extend({
  type: z.literal('callout'),
  variant: z.enum(['tip', 'note', 'warning']),
  title: z.string().optional(),
  body: z.string(),
})

export const dosDontsBlockSchema = blockBase.extend({
  type: z.literal('dos_donts'),
  dos: z.array(z.string()),
  donts: z.array(z.string()),
})

export const whyMattersBlockSchema = blockBase.extend({
  type: z.literal('why_matters'),
  items: z.array(
    z.object({
      persona: personaEnum,
      text: z.string(),
    }),
  ),
})

export const tableBlockSchema = blockBase.extend({
  type: z.literal('table'),
  headers: z.array(z.string()).min(1),
  rows: z.array(z.array(z.string())),
})

export const referencesBlockSchema = blockBase.extend({
  type: z.literal('references'),
  items: z.array(
    z.object({
      title: z.string(),
      kind: z.enum(['article', 'video', 'audio', 'other']),
      url: optionalUrl,
      mediaAssetId: z.string().uuid().optional().nullable(),
      note: z.string().optional(),
    }),
  ),
})

export const objectivesBlockSchema = blockBase.extend({
  type: z.literal('objectives'),
  items: z.array(z.string()),
})

export const dialogueBlockSchema = blockBase.extend({
  type: z.literal('dialogue'),
  title: z.string(),
  lines: z.array(
    z.object({
      speaker: z.string(),
      amharic: z.string(),
      transliteration: z.string().optional(),
      english: z.string().optional(),
      audioUrl: z.string().default(''),
    }),
  ),
})

export const vocabularySetBlockSchema = blockBase.extend({
  type: z.literal('vocabulary_set'),
  title: z.string().optional(),
  vocabularyIds: z.array(z.string().uuid()),
  showFlashcards: z.boolean().default(true),
})

export const comprehensionCheckBlockSchema = blockBase.extend({
  type: z.literal('comprehension_check'),
  question: z.string(),
  options: z.array(z.string()).min(2),
  correctIndex: z.number().int().min(0),
  explanation: z.string().optional(),
})

export const flashcardRevisionBlockSchema = blockBase.extend({
  type: z.literal('flashcard_revision'),
  title: z.string().optional(),
  vocabularyIds: z.array(z.string().uuid()).default([]),
  cards: z
    .array(
      z.object({
        front: z.string(),
        back: z.string(),
        hint: z.string().optional(),
        audioUrl: optionalUrl,
      }),
    )
    .default([]),
})

export const listeningPracticeBlockSchema = blockBase.extend({
  type: z.literal('listening_practice'),
  title: z.string().optional(),
  prompt: z.string().optional(),
  /** Prefer linking vocabulary that has recordings; custom items fill gaps. */
  vocabularyIds: z.array(z.string().uuid()).default([]),
  items: z
    .array(
      z.object({
        audioUrl: optionalUrl,
        speakText: z.string().optional(),
        options: z.array(z.string()).min(2),
        correctIndex: z.number().int().min(0),
        revealAmharic: z.string().optional(),
        revealEnglish: z.string().optional(),
      }),
    )
    .default([]),
})

export const matchingCardsBlockSchema = blockBase.extend({
  type: z.literal('matching_cards'),
  prompt: z.string().optional(),
  pairs: z.array(
    z.object({
      left: z.string(),
      right: z.string(),
    }),
  ),
})

export const multipleChoiceBlockSchema = blockBase.extend({
  type: z.literal('multiple_choice'),
  prompt: z.string(),
  options: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      correct: z.boolean().default(false),
    }),
  ),
  explanation: z.string().optional(),
})

export const speakingTaskBlockSchema = blockBase.extend({
  type: z.literal('speaking_task'),
  prompt: z.string(),
  instructions: z.string().optional(),
  maxSeconds: z.number().int().min(5).max(600).default(60),
  minSeconds: z.number().int().min(0).max(600).default(0),
})

export const videoPracticeBlockSchema = blockBase.extend({
  type: z.literal('video_practice'),
  prompt: z.string(),
  instructions: z.string().optional(),
  maxSeconds: z.number().int().min(5).max(600).default(60),
  required: z.boolean().default(true),
})

export const homeworkPromptBlockSchema = blockBase.extend({
  type: z.literal('homework_prompt'),
  title: z.string(),
  instructions: z.string(),
  allowText: z.boolean().default(true),
  allowAudio: z.boolean().default(true),
  allowVideo: z.boolean().default(false),
  allowFiles: z.boolean().default(false),
  maxAudioSeconds: z.number().int().min(5).max(600).optional(),
  maxVideoSeconds: z.number().int().min(5).max(600).optional(),
})

export const dividerBlockSchema = blockBase.extend({
  type: z.literal('divider'),
})

export const contentBlockSchema = z.discriminatedUnion('type', [
  headingBlockSchema,
  richTextBlockSchema,
  imageBlockSchema,
  videoBlockSchema,
  audioBlockSchema,
  calloutBlockSchema,
  dosDontsBlockSchema,
  whyMattersBlockSchema,
  tableBlockSchema,
  referencesBlockSchema,
  objectivesBlockSchema,
  dialogueBlockSchema,
  vocabularySetBlockSchema,
  comprehensionCheckBlockSchema,
  flashcardRevisionBlockSchema,
  listeningPracticeBlockSchema,
  matchingCardsBlockSchema,
  multipleChoiceBlockSchema,
  speakingTaskBlockSchema,
  videoPracticeBlockSchema,
  homeworkPromptBlockSchema,
  dividerBlockSchema,
])

export type ContentBlock = z.infer<typeof contentBlockSchema>

const partBase = z.object({
  version: z.literal(1),
  title: z.string().optional(),
  blocks: z.array(contentBlockSchema),
})

export const culturalInsightSchema = partBase.extend({
  part: z.literal('cultural_insight'),
  hookQuestion: z.string().optional(),
})

export const languageLessonSchema = partBase.extend({
  part: z.literal('language_lesson'),
})

export const practiceSchema = partBase.extend({
  part: z.literal('practice'),
})

export const lessonPartContentSchema = z.discriminatedUnion('part', [
  culturalInsightSchema,
  languageLessonSchema,
  practiceSchema,
])

export type LessonPartContent = z.infer<typeof lessonPartContentSchema>
export type CulturalInsightContent = z.infer<typeof culturalInsightSchema>
export type LanguageLessonContent = z.infer<typeof languageLessonSchema>
export type PracticeContent = z.infer<typeof practiceSchema>

export type LessonPartKey = LessonPartContent['part']

const STARTER_BLOCKS: Record<LessonPartKey, ContentBlock[]> = {
  cultural_insight: [
    {
      id: 'hook',
      type: 'heading',
      level: 2,
      text: 'Before you begin',
    },
    {
      id: 'body',
      type: 'rich_text',
      markdown:
        'Write the cultural essay here. You can add images, videos, and reference links between paragraphs.',
    },
    {
      id: 'why',
      type: 'why_matters',
      items: [{ persona: 'default', text: 'Why this matters for learners…' }],
    },
    {
      id: 'dos',
      type: 'dos_donts',
      dos: ['Do greet elders first'],
      donts: ["Don't use overly casual forms with strangers"],
    },
  ],
  language_lesson: [
    {
      id: 'objectives',
      type: 'objectives',
      items: ['Greet someone appropriately', 'Respond to እንዴት ነህ/ነሽ'],
    },
    {
      id: 'vocab',
      type: 'vocabulary_set',
      title: 'Core vocabulary',
      vocabularyIds: [],
      showFlashcards: true,
    },
    {
      id: 'dialogue',
      type: 'dialogue',
      title: 'Sample dialogue',
      lines: [
        {
          speaker: 'A',
          amharic: 'ሰላም',
          transliteration: 'selam',
          english: 'Hello',
          audioUrl: '',
        },
      ],
    },
    {
      id: 'grammar',
      type: 'table',
      headers: ['Amharic', 'Meaning', 'Notes'],
      rows: [['እንዴት ነህ?', 'How are you? (m)', 'Informal masculine']],
    },
  ],
  practice: [
    {
      id: 'flashcards',
      type: 'flashcard_revision',
      title: 'Quick revision',
      vocabularyIds: [],
      cards: [],
    },
    {
      id: 'mcq',
      type: 'multiple_choice',
      prompt: 'What does ሰላም mean?',
      options: [
        { id: 'a', text: 'Hello / peace', correct: true },
        { id: 'b', text: 'Goodbye', correct: false },
        { id: 'c', text: 'Thank you', correct: false },
      ],
      explanation: 'ሰላም is the everyday greeting and also means “peace”.',
    },
    {
      id: 'matching',
      type: 'matching_cards',
      prompt: 'Match the Amharic with English',
      pairs: [
        { left: 'ሰላም', right: 'Hello' },
        { left: 'ደህና ነኝ', right: 'I am fine' },
      ],
    },
    {
      id: 'speaking',
      type: 'speaking_task',
      prompt: 'Record yourself greeting a colleague.',
      instructions: 'Speak clearly. You may re-record before submitting.',
      maxSeconds: 60,
      minSeconds: 5,
    },
    {
      id: 'homework',
      type: 'homework_prompt',
      title: 'Unit homework',
      instructions: 'Practice the greetings with a partner and submit a short voice note.',
      allowText: true,
      allowAudio: true,
      allowVideo: false,
      allowFiles: false,
      maxAudioSeconds: 60,
    },
  ],
}

export function createEmptyPartContent(part: LessonPartKey): LessonPartContent {
  const blocks = STARTER_BLOCKS[part].map((block) => ({
    ...block,
    id: crypto.randomUUID(),
  }))

  if (part === 'cultural_insight') {
    return {
      part,
      version: 1,
      hookQuestion: 'How do Ethiopians typically greet each other?',
      title: 'Cultural insight',
      blocks,
    }
  }

  return {
    part,
    version: 1,
    title: part === 'language_lesson' ? 'Language lesson' : 'Practice',
    blocks,
  }
}

/** Normalize legacy / empty payloads into the block document. */
export function normalizePartContent(
  part: LessonPartKey,
  raw: unknown,
): LessonPartContent {
  const parsed = lessonPartContentSchema.safeParse(raw)
  if (parsed.success) return parsed.data

  if (raw && typeof raw === 'object' && Array.isArray((raw as { blocks?: unknown }).blocks)) {
    const loose = lessonPartContentSchema.safeParse({
      ...(raw as object),
      part,
      version: 1,
    })
    if (loose.success) return loose.data
  }

  return createEmptyPartContent(part)
}

export function parsePartContent(raw: unknown): LessonPartContent | null {
  const parsed = lessonPartContentSchema.safeParse(raw)
  return parsed.success ? parsed.data : null
}

export const BLOCK_CATALOG: {
  type: ContentBlockType
  label: string
  description: string
  parts: LessonPartKey[] | 'all'
}[] = [
  { type: 'heading', label: 'Heading', description: 'Section title', parts: 'all' },
  { type: 'rich_text', label: 'Text', description: 'Markdown paragraph or essay', parts: 'all' },
  { type: 'image', label: 'Image', description: 'Inline image with caption', parts: 'all' },
  { type: 'video', label: 'Video', description: 'Embedded or uploaded video', parts: 'all' },
  { type: 'audio', label: 'Audio', description: 'Voice clip or narration', parts: 'all' },
  { type: 'callout', label: 'Callout', description: 'Tip, note, or warning', parts: 'all' },
  { type: 'table', label: 'Table', description: 'Grammar or comparison table', parts: 'all' },
  { type: 'divider', label: 'Divider', description: 'Visual break', parts: 'all' },
  { type: 'references', label: 'References', description: 'Articles and videos', parts: ['cultural_insight'] },
  { type: 'dos_donts', label: "Do's & don'ts", description: 'Cultural guidance list', parts: ['cultural_insight'] },
  { type: 'why_matters', label: 'Why it matters', description: 'Persona-framed framing', parts: ['cultural_insight'] },
  { type: 'comprehension_check', label: 'Comprehension check', description: 'Quick check question', parts: ['cultural_insight'] },
  { type: 'objectives', label: 'Objectives', description: 'Lesson goals', parts: ['language_lesson'] },
  { type: 'dialogue', label: 'Dialogue', description: 'Multi-line conversation', parts: ['language_lesson'] },
  { type: 'vocabulary_set', label: 'Vocabulary set', description: 'Linked flashcard words', parts: ['language_lesson', 'practice'] },
  { type: 'flashcard_revision', label: 'Flashcards', description: 'Revision deck', parts: ['practice', 'language_lesson'] },
  { type: 'listening_practice', label: 'Listening practice', description: 'Hear audio and choose the meaning', parts: ['language_lesson', 'practice'] },
  { type: 'multiple_choice', label: 'Multiple choice', description: 'Quiz-style question', parts: ['practice'] },
  { type: 'matching_cards', label: 'Matching cards', description: 'Pair matching exercise', parts: ['practice'] },
  { type: 'speaking_task', label: 'Speaking task', description: 'Timed voice recording', parts: ['practice'] },
  { type: 'video_practice', label: 'Video practice', description: 'Student video submission', parts: ['practice'] },
  { type: 'homework_prompt', label: 'Homework', description: 'Assignment students submit', parts: ['practice'] },
]

export function createBlock(type: ContentBlockType): ContentBlock {
  const id = crypto.randomUUID()
  switch (type) {
    case 'heading':
      return { id, type, level: 2, text: 'New section' }
    case 'rich_text':
      return { id, type, markdown: '' }
    case 'image':
      return { id, type, url: '', caption: '', alt: '' }
    case 'video':
      return { id, type, url: '', caption: '' }
    case 'audio':
      return { id, type, url: '', label: 'Listen' }
    case 'callout':
      return { id, type, variant: 'tip', title: 'Tip', body: '' }
    case 'dos_donts':
      return { id, type, dos: [''], donts: [''] }
    case 'why_matters':
      return { id, type, items: [{ persona: 'default', text: '' }] }
    case 'table':
      return { id, type, headers: ['Column 1', 'Column 2'], rows: [['', '']] }
    case 'references':
      return { id, type, items: [{ title: '', kind: 'article', url: '' }] }
    case 'objectives':
      return { id, type, items: [''] }
    case 'dialogue':
      return {
        id,
        type,
        title: 'Dialogue',
        lines: [{ speaker: 'A', amharic: '', transliteration: '', english: '', audioUrl: '' }],
      }
    case 'vocabulary_set':
      return { id, type, title: 'Vocabulary', vocabularyIds: [], showFlashcards: true }
    case 'comprehension_check':
      return {
        id,
        type,
        question: '',
        options: ['', ''],
        correctIndex: 0,
      }
    case 'flashcard_revision':
      return { id, type, title: 'Flashcards', vocabularyIds: [], cards: [{ front: '', back: '', audioUrl: '' }] }
    case 'listening_practice':
      return {
        id,
        type,
        title: 'Listening practice',
        prompt: 'Listen carefully, then choose what you heard.',
        vocabularyIds: [],
        items: [
          {
            audioUrl: '',
            speakText: 'ሰላም',
            options: ['Hello', 'Goodbye', 'Thank you'],
            correctIndex: 0,
            revealAmharic: 'ሰላም',
            revealEnglish: 'Hello / peace',
          },
        ],
      }
    case 'matching_cards':
      return { id, type, prompt: '', pairs: [{ left: '', right: '' }] }
    case 'multiple_choice':
      return {
        id,
        type,
        prompt: '',
        options: [
          { id: crypto.randomUUID(), text: '', correct: true },
          { id: crypto.randomUUID(), text: '', correct: false },
        ],
      }
    case 'speaking_task':
      return {
        id,
        type,
        prompt: '',
        instructions: '',
        maxSeconds: 60,
        minSeconds: 0,
      }
    case 'video_practice':
      return {
        id,
        type,
        prompt: '',
        instructions: '',
        maxSeconds: 60,
        required: true,
      }
    case 'homework_prompt':
      return {
        id,
        type,
        title: 'Homework',
        instructions: '',
        allowText: true,
        allowAudio: true,
        allowVideo: false,
        allowFiles: false,
        maxAudioSeconds: 60,
      }
    case 'divider':
      return { id, type }
  }
}
