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
  'teacher_note',
  'dos_donts',
  'why_matters',
  'table',
  'fill_blank',
  'meaning_fill',
  'sentence_build',
  'id_card',
  'dialogue_table',
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
  /** Practice category tab this block belongs to (practice parts only). */
  categoryId: z.string().optional().nullable(),
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
  variant: z.enum(['tip', 'note', 'warning', 'example', 'teacher']),
  title: z.string().optional(),
  body: z.string(),
})

/** Instructor guidance — shown in admin/preview; hidden from students by default. */
export const teacherNoteBlockSchema = blockBase.extend({
  type: z.literal('teacher_note'),
  title: z.string().optional(),
  body: z.string(),
  /** When true, students also see this note (e.g. study tips). */
  visibleToStudents: z.boolean().default(false),
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
  /** static = display only; multi_row = students edit cells and can add rows */
  variant: z.enum(['static', 'multi_row']).default('static'),
  title: z.string().optional(),
  headers: z.array(z.string()).min(1),
  rows: z.array(z.array(z.string())),
  maxRows: z.number().int().min(1).max(50).default(20),
})

export const fillBlankBlockSchema = blockBase.extend({
  type: z.literal('fill_blank'),
  title: z.string().optional(),
  prompt: z.string().optional(),
  maxAttempts: z.number().int().min(1).max(10).default(2),
  allowRetake: z.boolean().default(false),
  /** Word / phrase bank shown above the questions */
  wordBank: z.array(z.string()).default([]),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        question: z.string(),
        answer: z.string(),
      }),
    )
    .min(1),
})

/** English meaning given → pick Amharic (or target) from a word bank. */
export const meaningFillBlockSchema = blockBase.extend({
  type: z.literal('meaning_fill'),
  title: z.string().optional(),
  prompt: z.string().optional(),
  maxAttempts: z.number().int().min(1).max(10).default(2),
  allowRetake: z.boolean().default(false),
  /** Words / phrases shown at the top for students to select */
  wordBank: z.array(z.string()).default([]),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        /** English (or source) meaning, e.g. "Good morning for a male" */
        meaning: z.string(),
        /** Correct word/phrase from the bank */
        answer: z.string(),
      }),
    )
    .min(1),
})

/** Build a sentence by dragging words from a bank into order. */
export const sentenceBuildBlockSchema = blockBase.extend({
  type: z.literal('sentence_build'),
  title: z.string().optional(),
  prompt: z.string().optional(),
  maxAttempts: z.number().int().min(1).max(10).default(2),
  allowRetake: z.boolean().default(false),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        /** Optional English hint, e.g. "Good morning for a male" */
        hint: z.string().optional(),
        /** Correct words in order (space-joined = the sentence) */
        words: z.array(z.string()).min(2),
        /** Extra words mixed into the bank */
        distractors: z.array(z.string()).default([]),
      }),
    )
    .min(1),
})

/**
 * ID-card worksheet: teacher defines labeled fields (Name, Age…);
 * students fill the blank answer spaces.
 */
export const idCardBlockSchema = blockBase.extend({
  type: z.literal('id_card'),
  title: z.string().default('Identity card'),
  subtitle: z.string().optional(),
  prompt: z.string().optional(),
  /** Show a photo / stamp slot on the card */
  showPhotoSlot: z.boolean().default(true),
  /** Admin-uploaded photo shown in the slot (storage path or URL) */
  photoUrl: optionalUrl,
  fields: z
    .array(
      z.object({
        id: z.string().min(1),
        /** Field label shown on the card, e.g. "Name" / "ስም" */
        label: z.string(),
        /** Optional placeholder hint inside the blank */
        hint: z.string().optional(),
        /** Blank height: 1 = single line, 2–3 for longer answers */
        lines: z.number().int().min(1).max(4).default(1),
      }),
    )
    .min(1),
})

/**
 * Goethe-style exam task: read (and optionally listen to) short introductions /
 * a dialogue, then fill a worksheet table with extracted info.
 */
export const dialogueTableBlockSchema = blockBase.extend({
  type: z.literal('dialogue_table'),
  title: z.string().default('ሰላም፣ እኔ…'),
  prompt: z.string().optional(),
  /** Full-track audio for the whole dialogue (optional listen). */
  audioUrl: optionalUrl,
  audioLabel: z.string().optional(),
  /** When false, hide written lines until after listening (exam mode). */
  showText: z.boolean().default(true),
  lines: z
    .array(
      z.object({
        id: z.string().min(1).default(() => crypto.randomUUID()),
        /** Speaker / profile label shown above the text, e.g. "A" or "Sara" */
        speaker: z.string(),
        /** Chat bubble side — same as lesson dialogue */
        alignment: z.enum(['left', 'right']).default('left'),
        /** Optional column key matching a table header (e.g. "A") */
        columnKey: z.string().optional(),
        imageUrl: optionalUrl,
        amharic: z.string(),
        transliteration: z.string().optional(),
        english: z.string().optional(),
        audioUrl: z.string().default(''),
      }),
    )
    .min(1),
  /** People / answer columns, e.g. A | B | C | እኔ */
  columnHeaders: z.array(z.string()).min(1),
  /** Info rows, e.g. First name | Country | City | Languages */
  rowLabels: z.array(z.string()).min(1),
  /**
   * Prefill grid [row][col]. Non-empty = locked hint shown to the student;
   * empty = student fills in.
   */
  cells: z.array(z.array(z.string())).default([]),
})

export const practiceCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
})

export type PracticeCategory = z.infer<typeof practiceCategorySchema>

export const referencesBlockSchema = blockBase.extend({
  type: z.literal('references'),
  items: z.array(
    z.object({
      title: z.string(),
      kind: z.enum(['article', 'video', 'audio', 'other']),
      url: optionalUrl,
      imageUrl: optionalUrl,
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
  /** Optional external link (video, Drive, transcript, etc.) */
  url: optionalUrl,
  lines: z.array(
    z.object({
      id: z.string().min(1).default(() => crypto.randomUUID()),
      speaker: z.string(),
      alignment: z.enum(['left', 'right']).default('left'),
      imageUrl: optionalUrl,
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
  maxAttempts: z.number().int().min(1).max(10).default(2),
  allowRetake: z.boolean().default(false),
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
  maxAttempts: z.number().int().min(1).max(10).default(2),
  allowRetake: z.boolean().default(false),
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
  /** Teacher materials: external link and/or uploaded worksheet file. */
  assignmentLink: z.string().default(''),
  assignmentFileUrl: z.string().default(''),
  assignmentFileName: z.string().default(''),
  /** Student response channels */
  allowText: z.boolean().default(true),
  allowAudio: z.boolean().default(true),
  allowVideo: z.boolean().default(true),
  /** Writing: paste a Google Drive link */
  allowDriveLink: z.boolean().default(true),
  /** Writing: upload a single image (see maxImageBytes) */
  allowImage: z.boolean().default(true),
  /** Optional PDF worksheet upload from the student */
  allowFiles: z.boolean().default(false),
  maxAudioSeconds: z.number().int().min(5).max(600).optional(),
  maxVideoSeconds: z.number().int().min(5).max(600).optional(),
  /** Default 1MB for writing image answers */
  maxImageBytes: z.number().int().min(50_000).max(5_000_000).default(1_048_576),
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
  teacherNoteBlockSchema,
  dosDontsBlockSchema,
  whyMattersBlockSchema,
  tableBlockSchema,
  fillBlankBlockSchema,
  meaningFillBlockSchema,
  sentenceBuildBlockSchema,
  idCardBlockSchema,
  dialogueTableBlockSchema,
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
  categories: z.array(practiceCategorySchema).default([]),
})

export const practiceSchema = partBase.extend({
  part: z.literal('practice'),
  categories: z.array(practiceCategorySchema).default([]),
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

/** Drop blank category names and clear dangling block categoryIds. */
export function sanitizePracticeContent<T extends LessonPartContent>(doc: T): T {
  if (doc.part !== 'practice' && doc.part !== 'language_lesson') return doc
  const categories = (doc.categories ?? [])
    .map((c) => ({ ...c, name: c.name.trim() }))
    .filter((c) => c.name.length > 0)
  const ids = new Set(categories.map((c) => c.id))
  return {
    ...doc,
    categories,
    blocks: doc.blocks.map((b) =>
      b.categoryId && !ids.has(b.categoryId) ? { ...b, categoryId: null } : b,
    ),
  }
}

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
      url: '',
      lines: [
        {
          id: 'dialogue-line-1',
          speaker: 'A',
          alignment: 'left',
          imageUrl: '',
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
      variant: 'static',
      headers: ['Amharic', 'Meaning', 'Notes'],
      rows: [['እንዴት ነህ?', 'How are you? (m)', 'Informal masculine']],
      maxRows: 20,
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
      id: 'dialogue-table',
      type: 'dialogue_table',
      title: 'ሰላም፣ እኔ…',
      prompt:
        'Read the texts. Optionally listen to the audio. Write the information in the table. Also add your own details.',
      audioUrl: '',
      audioLabel: 'Listen to the dialogue',
      showText: true,
      lines: [
        {
          id: 'dt-a',
          speaker: 'A',
          alignment: 'left',
          columnKey: 'A',
          imageUrl: '',
          amharic:
            'ሰላም! ስሜ ሳራ ነው። ከአሜሪካ ነኝ። አሁን አዲስ አበባ እኖራለሁ። እንግሊዘኛ እና አማርኛ እናገራለሁ።',
          transliteration:
            'Selam! Sime Sara new. Ke America negn. Ahun Addis Ababa enoralehu. Inglizigna ina Amarigna enageralehu.',
          english:
            'Hello! My name is Sara. I am from America. I live in Addis Ababa now. I speak English and Amharic.',
          audioUrl: '',
        },
        {
          id: 'dt-b',
          speaker: 'B',
          alignment: 'right',
          columnKey: 'B',
          imageUrl: '',
          amharic:
            'ሰላም፣ እኔ ዳዊት ነኝ። ከኢትዮጵያ፣ ከባሕር ዳር ነኝ። በአዲስ አበባ እኖራለሁ። አማርኛ እና እንግሊዘኛ እናገራለሁ። ቻይንኛ እማራለሁ።',
          transliteration:
            'Selam, ene Dawit negn. Ke Ethiopia, ke Bahir Dar negn. Be Addis Ababa enoralehu. Amarigna ina Inglizigna enageralehu. Chaynigna emaralehu.',
          english:
            'Hello, I am Dawit. I am from Ethiopia, from Bahir Dar. I live in Addis Ababa. I speak Amharic and English. I am learning Chinese.',
          audioUrl: '',
        },
        {
          id: 'dt-c',
          speaker: 'C',
          alignment: 'left',
          columnKey: 'C',
          imageUrl: '',
          amharic:
            'ሰላም። ስሜ ዩኪ ነው። ከጃፓን፣ ከቶኪዮ ነኝ። በበርሊን እኖራለሁ። እንግሊዘኛ እና ጃፓንኛ እናገራለሁ። አማርኛ እማራለሁ።',
          transliteration:
            'Selam. Sime Yuki new. Ke Japan, ke Tokyo negn. Be Berlin enoralehu. Inglizigna ina Japanigna enageralehu. Amarigna emaralehu.',
          english:
            'Hello. My name is Yuki. I am from Japan, from Tokyo. I live in Berlin. I speak English and Japanese. I am learning Amharic.',
          audioUrl: '',
        },
      ],
      columnHeaders: ['A', 'B', 'C', 'እኔ'],
      rowLabels: ['First name', 'Country', 'City', 'Languages'],
      cells: [
        ['', '', '', ''],
        ['', '', '', ''],
        ['', '', '', ''],
        ['', '', '', ''],
      ],
    },
    {
      id: 'mcq',
      type: 'multiple_choice',
      prompt: 'What does ሰላም mean?',
      maxAttempts: 2,
      allowRetake: false,
      options: [
        { id: 'a', text: 'Hello / peace', correct: true },
        { id: 'b', text: 'Goodbye', correct: false },
        { id: 'c', text: 'Thank you', correct: false },
      ],
      explanation: 'ሰላም is the everyday greeting and also means “peace”.',
    },
    {
      id: 'fill',
      type: 'fill_blank',
      title: 'Fill in the blank',
      prompt: 'Use a word from the list.',
      maxAttempts: 2,
      allowRetake: false,
      wordBank: ['ሰላም', 'ደህና ነኝ', 'አመሰግናለሁ'],
      items: [
        { id: 'f1', question: 'How do you say hello?', answer: 'ሰላም' },
        { id: 'f2', question: 'How do you say “I am fine”?', answer: 'ደህና ነኝ' },
      ],
    },
    {
      id: 'meaning',
      type: 'meaning_fill',
      title: 'Match the English meaning',
      prompt: 'Pick the Amharic phrase that matches each meaning.',
      maxAttempts: 2,
      allowRetake: false,
      wordBank: ['እንደምን አደርክ', 'እንደምን አደርሽ', 'ደህና ነኝ'],
      items: [
        { id: 'm1', meaning: 'Good morning for a male', answer: 'እንደምን አደርክ' },
        { id: 'm2', meaning: 'Good morning for a female', answer: 'እንደምን አደርሽ' },
      ],
    },
    {
      id: 'sentence',
      type: 'sentence_build',
      title: 'Build the sentence',
      prompt: 'Drag the words into the correct order.',
      maxAttempts: 2,
      allowRetake: false,
      items: [
        {
          id: 's1',
          hint: 'How are you? (to a male)',
          words: ['እንዴት', 'ነህ'],
          distractors: ['ነሽ', 'ነዎት'],
        },
      ],
    },
    {
      id: 'matching',
      type: 'matching_cards',
      prompt: 'Match the Amharic with English',
      maxAttempts: 2,
      allowRetake: false,
      pairs: [
        { left: 'ሰላም', right: 'Hello' },
        { left: 'ደህና ነኝ', right: 'I am fine' },
      ],
    },
    {
      id: 'speaking',
      type: 'speaking_task',
      prompt: 'Record yourself greeting a colleague.',
      instructions: 'Speak clearly. You may re-record and try again.',
      maxSeconds: 60,
      minSeconds: 5,
    },
    {
      id: 'video',
      type: 'video_practice',
      prompt: 'Record a short video of yourself greeting someone.',
      instructions: 'Face the camera and speak clearly. You may re-record.',
      maxSeconds: 60,
      required: true,
    },
    {
      id: 'homework',
      type: 'homework_prompt',
      title: 'Unit homework',
      instructions:
        'Complete the worksheet (link or file below). For writing, paste a Drive link or upload a photo (max 1MB). You may also upload or record audio/video.',
      assignmentLink: '',
      assignmentFileUrl: '',
      assignmentFileName: '',
      allowText: true,
      allowAudio: true,
      allowVideo: true,
      allowDriveLink: true,
      allowImage: true,
      allowFiles: false,
      maxAudioSeconds: 60,
      maxVideoSeconds: 90,
      maxImageBytes: 1_048_576,
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

  if (part === 'practice') {
    const writingId = crypto.randomUUID()
    const speakingId = crypto.randomUUID()
    // First blocks stay before category tabs (intro); later ones go into tabs.
    const categorized = blocks.map((block) => {
      if (block.type === 'flashcard_revision' || block.type === 'heading' || block.type === 'rich_text') {
        return { ...block, categoryId: null }
      }
      if (
        block.type === 'speaking_task' ||
        block.type === 'video_practice' ||
        block.type === 'homework_prompt'
      ) {
        return { ...block, categoryId: speakingId }
      }
      return { ...block, categoryId: writingId }
    })
    return {
      part,
      version: 1,
      title: 'Practice',
      categories: [
        { id: writingId, name: 'Writing' },
        { id: speakingId, name: 'Speaking' },
      ],
      blocks: categorized,
    }
  }

  return {
    part,
    version: 1,
    title: 'Language lesson',
    categories: [],
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
  /** Extra create options (e.g. table variant) */
  createOptions?: { tableVariant?: 'static' | 'multi_row' }
}[] = [
  { type: 'heading', label: 'Heading', description: 'Section title', parts: 'all' },
  { type: 'rich_text', label: 'Text', description: 'Markdown paragraph or essay', parts: 'all' },
  {
    type: 'rich_text',
    label: 'Custom markdown',
    description: 'Free markdown custom content',
    parts: 'all',
  },
  { type: 'image', label: 'Image', description: 'Inline image with caption', parts: 'all' },
  { type: 'video', label: 'Video', description: 'Embedded or uploaded video', parts: 'all' },
  { type: 'audio', label: 'Audio', description: 'Voice clip or narration', parts: 'all' },
  { type: 'callout', label: 'Callout', description: 'Tip, note, warning, example, or teacher tip', parts: 'all' },
  {
    type: 'teacher_note',
    label: 'Teacher note',
    description: 'Teaching guidance — hidden from students unless you opt in',
    parts: 'all',
  },
  {
    type: 'table',
    label: 'Static table',
    description: 'Numbered read-only table — add columns and rows visually',
    parts: 'all',
    createOptions: { tableVariant: 'static' },
  },
  {
    type: 'table',
    label: 'Fillable table',
    description: 'Named columns, fixed starters, students add rows',
    parts: 'all',
    createOptions: { tableVariant: 'multi_row' },
  },
  { type: 'divider', label: 'Divider', description: 'Visual break', parts: 'all' },
  { type: 'objectives', label: 'Objectives', description: 'Lesson / practice goals', parts: 'all' },
  { type: 'dialogue', label: 'Dialogue', description: 'Multi-line conversation', parts: 'all' },
  { type: 'vocabulary_set', label: 'Vocabulary set', description: 'Linked flashcard words', parts: 'all' },
  { type: 'flashcard_revision', label: 'Flashcards', description: 'Revision deck', parts: 'all' },
  { type: 'listening_practice', label: 'Listening practice', description: 'Hear audio and choose the meaning', parts: 'all' },
  { type: 'fill_blank', label: 'Fill in the blank', description: 'Drag words to blanks then submit/check', parts: 'all' },
  {
    type: 'meaning_fill',
    label: 'English meaning → word bank',
    description: 'Show English meaning; student picks the Amharic from a word list and checks',
    parts: 'all',
  },
  {
    type: 'sentence_build',
    label: 'Build a sentence',
    description: 'Drag words from a list into order to form a sentence, then check',
    parts: 'all',
  },
  {
    type: 'id_card',
    label: 'ID card form',
    description: 'Labeled fields (Name, Age…) with blank space for the student to fill',
    parts: 'all',
  },
  {
    type: 'dialogue_table',
    label: 'Dialogue → table',
    description: 'Read/listen to introductions, then fill a worksheet table (exam-style)',
    parts: 'all',
  },
  { type: 'multiple_choice', label: 'Multiple choice', description: 'Quiz-style question', parts: 'all' },
  { type: 'matching_cards', label: 'Matching cards', description: 'Pair matching exercise', parts: 'all' },
  { type: 'comprehension_check', label: 'Comprehension check', description: 'Quick check question', parts: 'all' },
  { type: 'speaking_task', label: 'Voice recording', description: 'Student records themselves speaking (practice or homework)', parts: 'all' },
  { type: 'video_practice', label: 'Video recording', description: 'Student records themselves on camera (practice or homework)', parts: 'all' },
  {
    type: 'homework_prompt',
    label: 'Homework',
    description: 'Assign via link/file · students reply with audio/video, Drive link, or image ≤1MB',
    parts: 'all',
  },
  { type: 'references', label: 'References', description: 'Articles and videos', parts: 'all' },
  { type: 'dos_donts', label: "Do's & don'ts", description: 'Guidance list', parts: 'all' },
  { type: 'why_matters', label: 'Why it matters', description: 'Persona-framed framing', parts: 'all' },
]

export function createBlock(
  type: ContentBlockType,
  options?: { tableVariant?: 'static' | 'multi_row' },
): ContentBlock {
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
    case 'teacher_note':
      return {
        id,
        type,
        title: 'Teaching note',
        body: '',
        visibleToStudents: false,
      }
    case 'dos_donts':
      return { id, type, dos: [''], donts: [''] }
    case 'why_matters':
      return { id, type, items: [{ persona: 'default', text: '' }] }
    case 'table': {
      const variant = options?.tableVariant ?? 'static'
      return {
        id,
        type,
        variant,
        title: variant === 'multi_row' ? 'Complete the table' : undefined,
        headers: ['', ''],
        rows: variant === 'multi_row' ? [] : [['', '']],
        maxRows: 20,
      }
    }
    case 'fill_blank':
      return {
        id,
        type,
        title: 'Fill in the blank',
        prompt: 'Choose from the list above.',
        maxAttempts: 2,
        allowRetake: false,
        wordBank: ['', ''],
        items: [
          { id: crypto.randomUUID(), question: '', answer: '' },
        ],
      }
    case 'meaning_fill':
      return {
        id,
        type,
        title: 'Match the meaning',
        prompt: 'Read the English meaning, then pick the matching word from the list.',
        maxAttempts: 2,
        allowRetake: false,
        wordBank: ['እንደምን አደርክ', 'እንደምን አደርሽ', 'ሰላም'],
        items: [
          {
            id: crypto.randomUUID(),
            meaning: 'Good morning for a male',
            answer: 'እንደምን አደርክ',
          },
        ],
      }
    case 'sentence_build':
      return {
        id,
        type,
        title: 'Build the sentence',
        prompt: 'Drag the words into the correct order.',
        maxAttempts: 2,
        allowRetake: false,
        items: [
          {
            id: crypto.randomUUID(),
            hint: 'How are you? (to a male)',
            words: ['እንዴት', 'ነህ'],
            distractors: ['ነሽ'],
          },
        ],
      }
    case 'id_card':
      return {
        id,
        type,
        title: 'Identity card',
        subtitle: 'Fill in your details',
        prompt: 'Write your answers in the blank spaces.',
        showPhotoSlot: true,
        photoUrl: '',
        fields: [
          { id: crypto.randomUUID(), label: 'Name', hint: '', lines: 1 },
          { id: crypto.randomUUID(), label: 'Father’s name', hint: '', lines: 1 },
          { id: crypto.randomUUID(), label: 'Age', hint: '', lines: 1 },
          { id: crypto.randomUUID(), label: 'City', hint: '', lines: 1 },
        ],
      }
    case 'dialogue_table':
      return {
        id,
        type,
        title: 'ሰላም፣ እኔ…',
        prompt:
          'Read the texts. Optionally listen to the audio. Write the information in the table. Also add your own details.',
        audioUrl: '',
        audioLabel: 'Listen to the dialogue',
        showText: true,
        lines: [
          {
            id: crypto.randomUUID(),
            speaker: 'A',
            alignment: 'left',
            columnKey: 'A',
            imageUrl: '',
            amharic:
              'ሰላም! ስሜ ሳራ ነው። ከአሜሪካ ነኝ። አሁን አዲስ አበባ እኖራለሁ። እንግሊዘኛ እና አማርኛ እናገራለሁ።',
            transliteration:
              'Selam! Sime Sara new. Ke America negn. Ahun Addis Ababa enoralehu. Inglizigna ina Amarigna enageralehu.',
            english:
              'Hello! My name is Sara. I am from America. I live in Addis Ababa now. I speak English and Amharic.',
            audioUrl: '',
          },
          {
            id: crypto.randomUUID(),
            speaker: 'B',
            alignment: 'right',
            columnKey: 'B',
            imageUrl: '',
            amharic:
              'ሰላም፣ እኔ ዳዊት ነኝ። ከኢትዮጵያ፣ ከባሕር ዳር ነኝ። በአዲስ አበባ እኖራለሁ። አማርኛ እና እንግሊዘኛ እናገራለሁ። ቻይንኛ እማራለሁ።',
            transliteration:
              'Selam, ene Dawit negn. Ke Ethiopia, ke Bahir Dar negn. Be Addis Ababa enoralehu. Amarigna ina Inglizigna enageralehu. Chaynigna emaralehu.',
            english:
              'Hello, I am Dawit. I am from Ethiopia, from Bahir Dar. I live in Addis Ababa. I speak Amharic and English. I am learning Chinese.',
            audioUrl: '',
          },
          {
            id: crypto.randomUUID(),
            speaker: 'C',
            alignment: 'left',
            columnKey: 'C',
            imageUrl: '',
            amharic:
              'ሰላም። ስሜ ዩኪ ነው። ከጃፓን፣ ከቶኪዮ ነኝ። በበርሊን እኖራለሁ። እንግሊዘኛ እና ጃፓንኛ እናገራለሁ። አማርኛ እማራለሁ።',
            transliteration:
              'Selam. Sime Yuki new. Ke Japan, ke Tokyo negn. Be Berlin enoralehu. Inglizigna ina Japanigna enageralehu. Amarigna emaralehu.',
            english:
              'Hello. My name is Yuki. I am from Japan, from Tokyo. I live in Berlin. I speak English and Japanese. I am learning Amharic.',
            audioUrl: '',
          },
        ],
        columnHeaders: ['A', 'B', 'C', 'እኔ'],
        rowLabels: ['First name', 'Country', 'City', 'Languages'],
        cells: [
          ['', '', '', ''],
          ['', '', '', ''],
          ['', '', '', ''],
          ['', '', '', ''],
        ],
      }
    case 'references':
      return { id, type, items: [{ title: '', kind: 'article', url: '', imageUrl: '' }] }
    case 'objectives':
      return { id, type, items: [''] }
    case 'dialogue':
      return {
        id,
        type,
        title: 'Dialogue',
        url: '',
        lines: [
          {
            id: crypto.randomUUID(),
            speaker: 'A',
            alignment: 'left',
            imageUrl: '',
            amharic: '',
            transliteration: '',
            english: '',
            audioUrl: '',
          },
        ],
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
      return {
        id,
        type,
        prompt: '',
        maxAttempts: 2,
        allowRetake: false,
        pairs: [{ left: '', right: '' }],
      }
    case 'multiple_choice':
      return {
        id,
        type,
        prompt: '',
        maxAttempts: 2,
        allowRetake: false,
        options: [
          { id: crypto.randomUUID(), text: '', correct: true },
          { id: crypto.randomUUID(), text: '', correct: false },
        ],
      }
    case 'speaking_task':
      return {
        id,
        type,
        prompt: 'Record yourself speaking.',
        instructions: 'Speak clearly. You may re-record before submitting.',
        maxSeconds: 60,
        minSeconds: 5,
      }
    case 'video_practice':
      return {
        id,
        type,
        prompt: 'Record a short video of yourself.',
        instructions: 'Face the camera and speak clearly. You may re-record before submitting.',
        maxSeconds: 60,
        required: true,
      }
    case 'homework_prompt':
      return {
        id,
        type,
        title: 'Homework',
        instructions: '',
        assignmentLink: '',
        assignmentFileUrl: '',
        assignmentFileName: '',
        allowText: true,
        allowAudio: true,
        allowVideo: true,
        allowDriveLink: true,
        allowImage: true,
        allowFiles: false,
        maxAudioSeconds: 60,
        maxVideoSeconds: 90,
        maxImageBytes: 1_048_576,
      }
    case 'divider':
      return { id, type }
  }
}
