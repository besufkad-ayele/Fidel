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
  'listen_grid',
  'audio_match',
  'voice_mcq',
  'dialogue_mcq',
  'dialogue_drag',
  'read_aloud',
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

/**
 * Goethe-style listen grid (e.g. numbers chart):
 * - write: play cell audio + write blanks (number / word / image)
 * - mark_understood: hover plays that cell’s uploaded audio only; one button confirms understanding
 */
export const listenGridBlockSchema = blockBase.extend({
  type: z.literal('listen_grid'),
  title: z.string().optional(),
  prompt: z.string().optional(),
  /** Grid columns (Goethe numbers chart uses 8) */
  columns: z.number().int().min(2).max(12).default(8),
  /**
   * Student activity:
   * - write — blanks under each cell
   * - mark_understood — hover to hear; one “I understand” button
   */
  activityMode: z.enum(['write', 'mark_understood']).default('write'),
  /**
   * What the student writes in the blank under each cell.
   * Independent of how the prompt is shown (number / word / image).
   * Only used when activityMode === 'write'.
   */
  answerFormat: z.enum(['number', 'word', 'image']).default('word'),
  /** When true, students can hear cells with uploaded audio (no TTS). */
  allowListen: z.boolean().default(true),
  /**
   * When true (and activityMode is write), show answer blanks under each cell.
   * Optional for practice — turn off for listen-only drills.
   */
  allowWrite: z.boolean().default(true),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        /** How the prompt is shown in the cell */
        display: z.enum(['number', 'word', 'image']).default('number'),
        /** Number or word text shown */
        label: z.string(),
        /** Stronger weight — e.g. multiples of ten */
        emphasize: z.boolean().default(false),
        audioUrl: optionalUrl,
        /** Optional spoken-label override for authoring notes */
        speakText: z.string().optional(),
        /** Shown when display === 'image' */
        imageUrl: optionalUrl,
        /** Optional expected answer for self-check */
        answer: z.string().optional(),
        /**
         * Listen & mark reference (teacher-provided, always visible): the reading in the
         * original language / script — e.g. the Amharic word form of a number (ሁለት).
         */
        originalReading: z.string().optional(),
        /**
         * Listen & mark reference (teacher-provided, always visible to students):
         * how the label reads — transliteration / English reading.
         */
        transcription: z.string().optional(),
        /** Listen & mark reference (teacher-provided, always visible): English meaning. */
        translation: z.string().optional(),
      }),
    )
    .min(1),
})

/**
 * Goethe-style “which numbers do you hear?”:
 * play each clip, then answer by dragging from a bank, typing, or recording voice.
 */
export const audioMatchBlockSchema = blockBase.extend({
  type: z.literal('audio_match'),
  title: z.string().optional(),
  prompt: z.string().optional(),
  maxAttempts: z.number().int().min(1).max(10).default(2),
  allowRetake: z.boolean().default(false),
  /** Drag chips from the bank into answer slots */
  allowBank: z.boolean().default(true),
  /** Type the answer into each slot */
  allowText: z.boolean().default(true),
  /** Record a short voice answer for each slot */
  allowVoice: z.boolean().default(true),
  maxVoiceSeconds: z.number().int().min(3).max(60).default(15),
  /**
   * Option bank at the top (answers + distractors).
   * Used when the student picks “bank” for a slot.
   */
  bank: z.array(z.string()).default([]),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        audioUrl: optionalUrl,
        /** TTS when no recording */
        speakText: z.string().optional(),
        /** Correct text for bank/text self-check */
        answer: z.string(),
      }),
    )
    .min(1),
})

/**
 * Goethe-style “listen and choose”: grid of audio prompts with radio options.
 */
export const voiceMcqBlockSchema = blockBase.extend({
  type: z.literal('voice_mcq'),
  title: z.string().optional(),
  prompt: z.string().optional(),
  /** Cards per row on wide screens */
  columns: z.number().int().min(1).max(4).default(2),
  maxAttempts: z.number().int().min(1).max(10).default(2),
  allowRetake: z.boolean().default(false),
  /** Optional context images above the grid (license plate, receipt, etc.) */
  contextImages: z
    .array(
      z.object({
        url: optionalUrl,
        caption: z.string().optional(),
      }),
    )
    .default([]),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        audioUrl: optionalUrl,
        /** TTS when no recording */
        speakText: z.string().optional(),
        options: z.array(z.string()).min(2),
        correctIndex: z.number().int().min(0),
      }),
    )
    .min(1),
})

/**
 * Goethe-style dialogue listen → choose:
 * scene image + one full conversation audio, then labeled MCQ groups
 * (e.g. “Ben:” / “Marie:” with phone-number options).
 */
export const dialogueMcqBlockSchema = blockBase.extend({
  type: z.literal('dialogue_mcq'),
  title: z.string().optional(),
  prompt: z.string().optional(),
  /** Scene / context photo above the player */
  imageUrl: optionalUrl,
  imageCaption: z.string().optional(),
  /** Full dialogue / conversation track */
  audioUrl: optionalUrl,
  audioLabel: z.string().optional(),
  maxAttempts: z.number().int().min(1).max(10).default(2),
  allowRetake: z.boolean().default(false),
  questions: z
    .array(
      z.object({
        id: z.string().min(1),
        /** Speaker or topic label, e.g. "Ben" or "Marie" */
        label: z.string(),
        options: z.array(z.string()).min(2),
        correctIndex: z.number().int().min(0),
      }),
    )
    .min(1),
})

/**
 * Goethe-style dialogue completion:
 * video/audio of a conversation, drag sentences from a bank into empty dialogue slots.
 */
export const dialogueDragBlockSchema = blockBase.extend({
  type: z.literal('dialogue_drag'),
  title: z.string().optional(),
  prompt: z.string().optional(),
  /** YouTube / Vimeo / direct video URL or storage path */
  videoUrl: optionalUrl,
  /** Optional conversation audio (if no video, or as alternate) */
  audioUrl: optionalUrl,
  audioLabel: z.string().optional(),
  maxAttempts: z.number().int().min(1).max(10).default(2),
  allowRetake: z.boolean().default(false),
  /** Draggable sentence bank (answers + distractors) */
  bank: z.array(z.string()).min(1),
  /**
   * Dialogue thread: fixed `prompt` lines and empty `slot` drop zones.
   * Slot answers must match bank text (normalized).
   */
  turns: z
    .array(
      z.object({
        id: z.string().min(1),
        kind: z.enum(['prompt', 'slot']),
        /** Speaker label for prompt lines (optional) */
        speaker: z.string().optional(),
        /** Shown text when kind === 'prompt' */
        text: z.string().optional(),
        /** Correct bank sentence when kind === 'slot' */
        answer: z.string().optional(),
      }),
    )
    .min(1),
})

/**
 * Read-aloud practice: show lines (numbers / words / images) for the student to
 * read, then record their pronunciation below.
 */
export const readAloudBlockSchema = blockBase.extend({
  type: z.literal('read_aloud'),
  title: z.string().optional(),
  prompt: z.string().optional(),
  instructions: z.string().optional(),
  maxSeconds: z.number().int().min(10).max(600).default(90),
  minSeconds: z.number().int().min(0).max(600).default(5),
  /** When true, students get play buttons for lines with uploaded audio (no TTS). */
  allowHoverListen: z.boolean().default(true),
  lines: z
    .array(
      z.object({
        id: z.string().min(1),
        /** How the line is shown */
        display: z.enum(['number', 'word', 'image']).default('number'),
        /** Visible text (numbers/words) */
        text: z.string(),
        /** TTS / model audio text override */
        speakText: z.string().optional(),
        audioUrl: optionalUrl,
        imageUrl: optionalUrl,
      }),
    )
    .min(1),
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
  /**
   * Student text blanks shown with the recorder
   * (Amharic word, English reading / transliteration, English translation).
   */
  showAmharic: z.boolean().default(true),
  showReading: z.boolean().default(true),
  showTranslation: z.boolean().default(true),
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
  /** Student response channels — writing only; use speaking_task / video_practice blocks for A/V */
  allowText: z.boolean().default(true),
  allowAudio: z.boolean().default(false),
  allowVideo: z.boolean().default(false),
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
  listenGridBlockSchema,
  audioMatchBlockSchema,
  voiceMcqBlockSchema,
  dialogueMcqBlockSchema,
  dialogueDragBlockSchema,
  readAloudBlockSchema,
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
      showAmharic: true,
      showReading: true,
      showTranslation: true,
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
        'Complete the worksheet (link or file below). For writing, paste a Drive link or upload a photo.',
      assignmentLink: '',
      assignmentFileUrl: '',
      assignmentFileName: '',
      allowText: true,
      allowAudio: false,
      allowVideo: false,
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
        block.type === 'read_aloud' ||
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
  /** Extra create options (e.g. table variant, listen grid activity) */
  createOptions?: {
    tableVariant?: 'static' | 'multi_row'
    activityMode?: 'write' | 'mark_understood'
  }
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
  {
    type: 'listen_grid',
    label: 'Listen & write',
    description:
      'Grid of numbers, words, or images — play cell audio and write answers below',
    parts: 'all',
    createOptions: { activityMode: 'write' },
  },
  {
    type: 'listen_grid',
    label: 'Listen & mark',
    description:
      'Grid of numbers, words, or images — hover to hear that cell’s audio, then confirm with I understand',
    parts: 'all',
    createOptions: { activityMode: 'mark_understood' },
  },
  {
    type: 'audio_match',
    label: 'Listen & match',
    description: 'Play audio slots; students answer by bank chip, typed text, or voice',
    parts: 'all',
  },
  {
    type: 'voice_mcq',
    label: 'Voice multiple choice',
    description: 'Listen to each clip and choose the matching option (radio grid)',
    parts: 'all',
  },
  {
    type: 'dialogue_mcq',
    label: 'Dialogue listen & choose',
    description:
      'Scene image + one conversation audio, then labeled multiple-choice questions (e.g. phone numbers)',
    parts: 'all',
  },
  {
    type: 'dialogue_drag',
    label: 'Dialogue drag-fill',
    description:
      'Video/audio dialogue: drag sentences from a bank into empty slots in the transcript',
    parts: 'all',
  },
  {
    type: 'read_aloud',
    label: 'Read aloud',
    description: 'Show lines to read (numbers/words/images); student records themselves',
    parts: 'all',
  },
  { type: 'multiple_choice', label: 'Multiple choice', description: 'Quiz-style question', parts: 'all' },
  { type: 'matching_cards', label: 'Matching cards', description: 'Pair matching exercise', parts: 'all' },
  { type: 'comprehension_check', label: 'Comprehension check', description: 'Quick check question', parts: 'all' },
  {
    type: 'speaking_task',
    label: 'Voice recording',
    description:
      'Write Amharic word, English reading, and English translation, then record speaking',
    parts: 'all',
  },
  { type: 'video_practice', label: 'Video recording', description: 'Student records themselves on camera (practice or homework)', parts: 'all' },
  {
    type: 'homework_prompt',
    label: 'Homework writing form',
    description:
      'Materials + Drive / photo / text answers. Add Voice or Video recording blocks for spoken work.',
    parts: 'all',
  },
  { type: 'references', label: 'References', description: 'Articles and videos', parts: 'all' },
  { type: 'dos_donts', label: "Do's & don'ts", description: 'Guidance list', parts: 'all' },
  { type: 'why_matters', label: 'Why it matters', description: 'Persona-framed framing', parts: 'all' },
]

/**
 * Number → words helpers used to auto-fill the Listen & mark numbers template.
 * Best-effort Amharic word forms + transliteration; teachers can edit any cell.
 */
const AM_ONES = ['', 'አንድ', 'ሁለት', 'ሶስት', 'አራት', 'አምስት', 'ስድስት', 'ሰባት', 'ስምንት', 'ዘጠኝ']
const TR_ONES = ['', 'and', 'hulet', 'sost', 'arat', 'amist', 'sidist', 'sebat', 'simint', 'zeteny']
const AM_TENS = ['', 'አስር', 'ሃያ', 'ሰላሳ', 'አርባ', 'ሃምሳ', 'ስድሳ', 'ሰባ', 'ሰማንያ', 'ዘጠና']
const TR_TENS = ['', 'asir', 'haya', 'selasa', 'arba', 'hamsa', 'sidsa', 'seba', 'semanya', 'zetena']

/** Amharic + transliteration for 1–99. */
function amTwo(n: number): [string, string] {
  if (n <= 0) return ['', '']
  if (n < 10) return [AM_ONES[n], TR_ONES[n]]
  if (n === 10) return ['አስር', 'asir']
  if (n < 20) {
    const u = n - 10
    return [`አስራ ${AM_ONES[u]}`, `asra ${TR_ONES[u]}`]
  }
  const tens = Math.floor(n / 10)
  const u = n % 10
  if (u === 0) return [AM_TENS[tens], TR_TENS[tens]]
  return [`${AM_TENS[tens]} ${AM_ONES[u]}`, `${TR_TENS[tens]} ${TR_ONES[u]}`]
}

/** Amharic + transliteration for 1–999. */
function amThree(n: number): [string, string] {
  const h = Math.floor(n / 100)
  const rest = n % 100
  if (h === 0) return amTwo(rest)
  const [ham, htr] = h === 1 ? ['መቶ', 'meto'] : [`${AM_ONES[h]} መቶ`, `${TR_ONES[h]} meto`]
  if (rest === 0) return [ham, htr]
  const [ram, rtr] = amTwo(rest)
  return [`${ham} ${ram}`, `${htr} ${rtr}`]
}

/** Amharic + transliteration up to millions. */
function toAmharic(n: number): [string, string] {
  if (n === 0) return ['ዜሮ', 'ziro']
  const million = Math.floor(n / 1_000_000)
  const afterMillion = n % 1_000_000
  const thousand = Math.floor(afterMillion / 1000)
  const rest = afterMillion % 1000

  const parts: string[] = []
  const trParts: string[] = []
  if (million > 0) {
    const [am, tr] = amThree(million)
    parts.push(`${am} ሚሊዮን`)
    trParts.push(`${tr} miliyon`)
  }
  if (thousand > 0) {
    if (thousand === 1) {
      parts.push('ሺ')
      trParts.push('shi')
    } else {
      const [am, tr] = amThree(thousand)
      parts.push(`${am} ሺ`)
      trParts.push(`${tr} shi`)
    }
  }
  if (rest > 0) {
    const [am, tr] = amThree(rest)
    parts.push(am)
    trParts.push(tr)
  }
  return [parts.join(' '), trParts.join(' ')]
}

const EN_ONES = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
]
const EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

function enUnderThousand(n: number): string {
  if (n < 20) return EN_ONES[n]
  if (n < 100) {
    const t = Math.floor(n / 10)
    const u = n % 10
    return u === 0 ? EN_TENS[t] : `${EN_TENS[t]}-${EN_ONES[u]}`
  }
  const h = Math.floor(n / 100)
  const rest = n % 100
  return rest === 0 ? `${EN_ONES[h]} hundred` : `${EN_ONES[h]} hundred ${enUnderThousand(rest)}`
}

/** English words up to millions. */
function toEnglishWords(n: number): string {
  if (n === 0) return 'zero'
  const million = Math.floor(n / 1_000_000)
  const afterMillion = n % 1_000_000
  const thousand = Math.floor(afterMillion / 1000)
  const rest = afterMillion % 1000

  const parts: string[] = []
  if (million > 0) parts.push(`${enUnderThousand(million)} million`)
  if (thousand > 0) parts.push(`${enUnderThousand(thousand)} thousand`)
  if (rest > 0) parts.push(enUnderThousand(rest))
  return parts.join(' ')
}

export function createBlock(
  type: ContentBlockType,
  options?: {
    tableVariant?: 'static' | 'multi_row'
    activityMode?: 'write' | 'mark_understood'
  },
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
    case 'listen_grid': {
      const numbers = [
        ...Array.from({ length: 30 }, (_, i) => i + 1),
        40, 50, 60, 70, 80, 90, 100,
        // Beyond 100 — practice larger forms
        104, 129, 999, 1000, 1100, 2500, 10_000, 25_000, 100_000, 250_000, 500_000, 1_000_000,
      ]
      const activityMode = options?.activityMode ?? 'write'
      const isMark = activityMode === 'mark_understood'
      return {
        id,
        type,
        title: 'The numbers',
        prompt: isMark
          ? 'Hover each cell to listen. When you understand, press I understand.'
          : 'Listen and repeat. Write each form in the space below.',
        columns: 8,
        activityMode,
        answerFormat: 'word',
        allowListen: true,
        allowWrite: !isMark,
        items: numbers.map((n) => {
          const [amReading, translit] = toAmharic(n)
          return {
            id: crypto.randomUUID(),
            display: 'number' as const,
            label: n >= 1000 ? n.toLocaleString('en-US') : String(n),
            emphasize: n % 10 === 0 || n >= 1000,
            audioUrl: '',
            speakText: String(n),
            imageUrl: '',
            answer: '',
            originalReading: isMark ? amReading : '',
            transcription: isMark ? translit : '',
            translation: isMark ? toEnglishWords(n) : '',
          }
        }),
      }
    }
    case 'audio_match': {
      const answers = ['6', '12', '21', '33', '50', '66', '71', '87', '91', '100']
      const distractors = ['7', '11', '13', '16', '17', '29', '30', '41', '60', '70']
      return {
        id,
        type,
        title: 'Which numbers do you hear?',
        prompt: 'What belongs together? Match each sound — by chip, text, or voice.',
        maxAttempts: 2,
        allowRetake: false,
        allowBank: true,
        allowText: true,
        allowVoice: true,
        maxVoiceSeconds: 15,
        bank: [...answers, ...distractors],
        items: answers.map((n) => ({
          id: crypto.randomUUID(),
          audioUrl: '',
          speakText: n,
          answer: n,
        })),
      }
    }
    case 'voice_mcq':
      return {
        id,
        type,
        title: 'Listen and choose',
        prompt: 'Listen carefully, then select the matching option.',
        columns: 2,
        maxAttempts: 2,
        allowRetake: false,
        contextImages: [],
        items: [
          {
            id: crypto.randomUUID(),
            audioUrl: '',
            speakText: '8136',
            options: ['RA KL 8136', 'RE KL 1836', 'RE LK 8136'],
            correctIndex: 0,
          },
          {
            id: crypto.randomUUID(),
            audioUrl: '',
            speakText: '19,15',
            options: ['19,15 €', '90,15 €', '19,50 €'],
            correctIndex: 0,
          },
          {
            id: crypto.randomUUID(),
            audioUrl: '',
            speakText: '0172 8349601',
            options: ['0172 8349601', '0172 8349061', '0172 8439601'],
            correctIndex: 0,
          },
          {
            id: crypto.randomUUID(),
            audioUrl: '',
            speakText: 'Auweg 38',
            options: ['Auweg 38', 'Auwig 83', 'Auweg 83'],
            correctIndex: 0,
          },
        ],
      }
    case 'dialogue_mcq':
      return {
        id,
        type,
        title: 'What is your phone number?',
        prompt:
          'Listen. What are the phone numbers? Choose the correct option for each person.',
        imageUrl: '',
        imageCaption: '',
        audioUrl: '',
        audioLabel: 'Listen to the conversation',
        maxAttempts: 2,
        allowRetake: false,
        questions: [
          {
            id: crypto.randomUUID(),
            label: 'Ben',
            options: ['0172/45 78 87', '0173/45 78 87', '0172/45 87 78'],
            correctIndex: 0,
          },
          {
            id: crypto.randomUUID(),
            label: 'Marie',
            options: ['0151/23 67 45', '0152/23 67 45', '0151/32 67 54'],
            correctIndex: 0,
          },
        ],
      }
    case 'dialogue_drag': {
      const bank = [
        'Guten Tag!',
        'Matteo Kraft.',
        'Meine E-Mail-Adresse lautet: matteo.kraft@umx.de.',
        'Ich wohne hier in Frankfurt. In der Bergerstraße 19.',
        'Ich spreche Deutsch und Spanisch.',
        'Meine Telefonnummer ist 0163 555 981 02.',
      ]
      return {
        id,
        type,
        title: 'In the personnel office',
        prompt:
          'What does he say? Listen and drag the sentences to the matching place in the dialogue.',
        videoUrl: '',
        audioUrl: '',
        audioLabel: 'Listen to the conversation',
        maxAttempts: 2,
        allowRetake: false,
        bank,
        turns: [
          {
            id: crypto.randomUUID(),
            kind: 'prompt' as const,
            speaker: '',
            text: 'Guten Tag!',
            answer: '',
          },
          {
            id: crypto.randomUUID(),
            kind: 'slot' as const,
            speaker: '',
            text: '',
            answer: 'Guten Tag!',
          },
          {
            id: crypto.randomUUID(),
            kind: 'prompt' as const,
            speaker: '',
            text: 'Wie heißen Sie?',
            answer: '',
          },
          {
            id: crypto.randomUUID(),
            kind: 'slot' as const,
            speaker: '',
            text: '',
            answer: 'Matteo Kraft.',
          },
          {
            id: crypto.randomUUID(),
            kind: 'prompt' as const,
            speaker: '',
            text: 'Ah, Sie sind Herr Kraft. Dann kontrolliere ich Ihre Angaben. Wo wohnen Sie, Herr Kraft?',
            answer: '',
          },
          {
            id: crypto.randomUUID(),
            kind: 'slot' as const,
            speaker: '',
            text: '',
            answer: 'Ich wohne hier in Frankfurt. In der Bergerstraße 19.',
          },
        ],
      }
    }
    case 'read_aloud':
      return {
        id,
        type,
        title: 'Read the numbers aloud',
        prompt:
          'Read each line clearly. At the end, say your phone number. Your teacher can give pronunciation feedback.',
        instructions: 'Read each line, then record yourself.',
        maxSeconds: 90,
        minSeconds: 10,
        allowHoverListen: true,
        lines: [
          {
            id: crypto.randomUUID(),
            display: 'number',
            text: '5, 15, 25, 50',
            speakText: '5, 15, 25, 50',
            audioUrl: '',
            imageUrl: '',
          },
          {
            id: crypto.randomUUID(),
            display: 'number',
            text: '1, 11, 21, 100',
            speakText: '1, 11, 21, 100',
            audioUrl: '',
            imageUrl: '',
          },
          {
            id: crypto.randomUUID(),
            display: 'number',
            text: '2, 12, 22, 62, 92',
            speakText: '2, 12, 22, 62, 92',
            audioUrl: '',
            imageUrl: '',
          },
          {
            id: crypto.randomUUID(),
            display: 'number',
            text: '6, 60, 16, 76, 66',
            speakText: '6, 60, 16, 76, 66',
            audioUrl: '',
            imageUrl: '',
          },
          {
            id: crypto.randomUUID(),
            display: 'number',
            text: '8, 18, 80, 88, 98',
            speakText: '8, 18, 80, 88, 98',
            audioUrl: '',
            imageUrl: '',
          },
          {
            id: crypto.randomUUID(),
            display: 'number',
            text: '9, 49, 59, 19, 99',
            speakText: '9, 49, 59, 19, 99',
            audioUrl: '',
            imageUrl: '',
          },
          {
            id: crypto.randomUUID(),
            display: 'word',
            text: 'My phone number',
            speakText: 'My phone number',
            audioUrl: '',
            imageUrl: '',
          },
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
        prompt: 'Write the word forms, then record yourself saying them.',
        instructions:
          'Fill in the Amharic word, English reading, and English translation. Then record yourself speaking clearly.',
        maxSeconds: 60,
        minSeconds: 5,
        showAmharic: true,
        showReading: true,
        showTranslation: true,
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
        allowAudio: false,
        allowVideo: false,
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
