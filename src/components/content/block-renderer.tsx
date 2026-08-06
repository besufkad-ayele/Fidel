'use client'

import { useMemo, useState } from 'react'
import { AmharicText } from '@/components/shared/amharic-text'
import { AudioPlaybackProvider, AudioPlayer } from '@/components/shared/audio-player'
import { lessonMediaPublicUrl, vocabAudioPublicUrl } from '@/lib/media/urls'
import { toVideoEmbedUrl } from '@/lib/media/embed'
import type { ContentBlock, LessonPartContent } from '@/lib/validation/content'
import { cn } from '@/lib/utils'
import { InteractiveMultipleChoice } from '@/components/content/interactive/multiple-choice'
import { InteractiveMatching } from '@/components/content/interactive/matching'
import { InteractiveFlashcards } from '@/components/content/interactive/flashcards'
import { ListeningPractice } from '@/components/content/interactive/listening-practice'
import { RecordingAssignment } from '@/components/content/interactive/recording-assignment'
import { ComprehensionCheck } from '@/components/content/interactive/comprehension-check'
import { InteractiveFillBlank } from '@/components/content/interactive/fill-blank'
import { InteractiveMeaningFill } from '@/components/content/interactive/meaning-fill'
import { InteractiveSentenceBuild } from '@/components/content/interactive/sentence-build'
import { InteractiveIdCard } from '@/components/content/interactive/id-card'
import { InteractiveListenGrid } from '@/components/content/interactive/listen-grid'
import { InteractiveAudioMatch } from '@/components/content/interactive/audio-match'
import { InteractiveVoiceMcq } from '@/components/content/interactive/voice-mcq'
import { InteractiveDialogueMcq } from '@/components/content/interactive/dialogue-mcq'
import { InteractiveDialogueDrag } from '@/components/content/interactive/dialogue-drag'
import { InteractiveReadAloud } from '@/components/content/interactive/read-aloud'
import { InteractiveDialogueTable } from '@/components/content/interactive/dialogue-table'
import {
  InteractiveFillableTable,
  StaticContentTable,
} from '@/components/content/interactive/fillable-table'
import { HomeworkSubmission } from '@/components/content/interactive/homework-submission'
import { PracticeCategoryTabs } from '@/components/features/learn/practice-category-tabs'
import { SimpleMarkdown } from '@/components/shared/simple-markdown'

export type VocabLookup = Record<
  string,
  {
    id: string
    amharic: string
    english: string
    transliteration: string | null
    exampleAmharic?: string | null
    exampleEnglish?: string | null
    audioSlow?: string | null
    audioNormal?: string | null
    audioNatural?: string | null
  }
>

type BlockRendererProps = {
  content: LessonPartContent
  vocabulary?: VocabLookup
  mode?: 'student' | 'preview'
  className?: string
  /** When set, homework_prompt blocks can save a real submission. */
  assignmentId?: string
  alreadySubmitted?: boolean
}

function vocabAudio(w: VocabLookup[string]) {
  return {
    slow: vocabAudioPublicUrl(w.audioSlow),
    normal: vocabAudioPublicUrl(w.audioNormal),
    natural: vocabAudioPublicUrl(w.audioNatural),
  }
}

function renderBlock(
  block: ContentBlock,
  vocabulary: VocabLookup,
  mode: 'student' | 'preview',
  opts?: { assignmentId?: string; alreadySubmitted?: boolean },
) {
  switch (block.type) {
    case 'heading': {
      const Tag = block.level === 2 ? 'h2' : 'h3'
      return (
        <Tag
          className={cn(
            'font-display text-green-900',
            block.level === 2 ? 'text-xl' : 'text-lg',
          )}
        >
          {block.text || 'Untitled'}
        </Tag>
      )
    }
    case 'rich_text':
      return <SimpleMarkdown text={block.markdown || ''} />
    case 'image': {
      const src = lessonMediaPublicUrl(block.url) || block.url
      return src ? (
        <figure className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={block.alt || block.caption || ''}
            className="w-full rounded-xl border border-cream-300 object-cover"
          />
          {block.caption ? (
            <figcaption className="text-center text-xs text-green-600">{block.caption}</figcaption>
          ) : null}
        </figure>
      ) : (
        <div className="rounded-xl border border-dashed border-cream-400 bg-cream-100 px-4 py-8 text-center text-sm text-green-600">
          Image placeholder
        </div>
      )
    }
    case 'video': {
      const embed = block.url ? toVideoEmbedUrl(block.url) : null
      return embed ? (
        <figure className="space-y-2">
          <div className="aspect-video overflow-hidden rounded-xl border border-cream-300 bg-green-950">
            <iframe
              src={embed}
              title={block.caption || 'Video'}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {block.caption ? (
            <figcaption className="text-center text-xs text-green-600">{block.caption}</figcaption>
          ) : null}
        </figure>
      ) : (
        <div className="rounded-xl border border-dashed border-cream-400 bg-cream-100 px-4 py-8 text-center text-sm text-green-600">
          Video placeholder
        </div>
      )
    }
    case 'audio':
      return (
        <AudioPlayer
          variant="full"
          label={block.label || 'Listen'}
          showSpeed
          sources={{ url: lessonMediaPublicUrl(block.url) || block.url || null }}
        />
      )
    case 'callout': {
      const tones = {
        tip: 'border-gold-300 bg-gold-50 text-green-900',
        note: 'border-cream-400 bg-cream-100 text-green-900',
        warning: 'border-danger-300 bg-danger-50 text-green-950',
        example: 'border-blue-300 bg-blue-50 text-green-950',
        teacher: 'border-green-700/30 bg-green-50 text-green-950',
      }
      return (
        <aside className={cn('rounded-xl border p-4', tones[block.variant])}>
          {block.title ? <p className="mb-1 text-sm font-semibold">{block.title}</p> : null}
          <p className="text-sm leading-relaxed">{block.body}</p>
        </aside>
      )
    }
    case 'teacher_note': {
      if (mode === 'student' && !block.visibleToStudents) return null
      return (
        <aside className="rounded-xl border border-dashed border-green-700/40 bg-green-50/80 p-4">
          <p className="mb-1 text-[11px] font-semibold tracking-[0.14em] text-green-700 uppercase">
            {mode === 'student' ? 'Study tip' : 'Teacher note'}
          </p>
          {block.title ? <p className="mb-1 text-sm font-semibold text-green-900">{block.title}</p> : null}
          <p className="text-sm leading-relaxed text-green-900">{block.body}</p>
        </aside>
      )
    }
    case 'dos_donts':
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="mb-2 text-xs font-semibold tracking-wide text-green-800 uppercase">Do</p>
            <ul className="space-y-1.5 text-sm text-green-900">
              {block.dos.filter(Boolean).map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-danger-200 bg-danger-50 p-4">
            <p className="mb-2 text-xs font-semibold tracking-wide text-danger-700 uppercase">
              Don&apos;t
            </p>
            <ul className="space-y-1.5 text-sm text-green-900">
              {block.donts.filter(Boolean).map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      )
    case 'why_matters':
      return (
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
            Why this matters
          </p>
          {block.items.map((item, i) => (
            <div key={i} className="rounded-xl border border-cream-300 bg-cream-50 p-4">
              <p className="mb-1 text-[11px] font-semibold tracking-wide text-green-600 uppercase">
                {item.persona === 'default' ? 'All learners' : item.persona}
              </p>
              <p className="text-sm text-green-900">{item.text}</p>
            </div>
          ))}
        </div>
      )
    case 'table':
      if (block.variant === 'multi_row') {
        return <InteractiveFillableTable block={block} mode={mode} />
      }
      return (
        <StaticContentTable
          title={block.title}
          headers={block.headers}
          rows={block.rows}
        />
      )
    case 'fill_blank':
      return <InteractiveFillBlank block={block} mode={mode} />
    case 'meaning_fill':
      return <InteractiveMeaningFill block={block} mode={mode} />
    case 'sentence_build':
      return <InteractiveSentenceBuild block={block} mode={mode} />
    case 'id_card':
      return <InteractiveIdCard block={block} mode={mode} />
    case 'listen_grid':
      return <InteractiveListenGrid block={block} mode={mode} />
    case 'audio_match':
      return <InteractiveAudioMatch block={block} mode={mode} />
    case 'voice_mcq':
      return <InteractiveVoiceMcq block={block} mode={mode} />
    case 'dialogue_mcq':
      return <InteractiveDialogueMcq block={block} mode={mode} />
    case 'dialogue_drag':
      return <InteractiveDialogueDrag block={block} mode={mode} />
    case 'read_aloud':
      return (
        <InteractiveReadAloud
          block={block}
          mode={mode}
          assignmentId={opts?.assignmentId}
          alreadySubmitted={opts?.alreadySubmitted}
        />
      )
    case 'dialogue_table':
      return <InteractiveDialogueTable block={block} mode={mode} />
    case 'references':
      return (
        <div className="space-y-4">
          <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
            References
          </p>
          <div className="space-y-4">
            {block.items.map((item, i) => {
              const embed =
                item.kind === 'video' && item.url ? toVideoEmbedUrl(item.url) : null

              if (item.kind === 'video' && embed) {
                return (
                  <figure
                    key={i}
                    className="space-y-2 overflow-hidden rounded-xl border border-cream-300 bg-cream-50 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-cream-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
                        Video
                      </span>
                      <p className="text-sm font-medium text-green-900">
                        {item.title || 'Video'}
                      </p>
                    </div>
                    <div className="aspect-video overflow-hidden rounded-lg bg-green-950">
                      <iframe
                        src={embed}
                        title={item.title || 'Reference video'}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    {item.note ? (
                      <figcaption className="text-xs text-green-600">{item.note}</figcaption>
                    ) : null}
                  </figure>
                )
              }

              if (item.kind === 'article') {
                const articleImage =
                  lessonMediaPublicUrl(item.imageUrl) || item.imageUrl || null
                return (
                  <article
                    key={i}
                    className="overflow-hidden rounded-xl border border-cream-300 bg-cream-50"
                  >
                    {articleImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={articleImage}
                        alt={item.title || 'Article'}
                        className="h-40 w-full object-cover"
                      />
                    ) : null}
                    <div className="space-y-2 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-cream-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
                          Article
                        </span>
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-display text-lg text-green-900 underline-offset-2 hover:underline"
                          >
                            {item.title || item.url}
                          </a>
                        ) : (
                          <h3 className="font-display text-lg text-green-900">
                            {item.title || 'Untitled article'}
                          </h3>
                        )}
                      </div>
                      {item.note ? (
                        <p className="text-sm leading-relaxed text-green-800">{item.note}</p>
                      ) : null}
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex text-sm font-medium text-gold-700 underline-offset-2 hover:underline"
                        >
                          Open article →
                        </a>
                      ) : null}
                    </div>
                  </article>
                )
              }

              return (
                <div
                  key={i}
                  className="rounded-lg border border-cream-300 bg-cream-50 px-3 py-2 text-sm"
                >
                  <span className="mr-2 rounded bg-cream-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
                    {item.kind}
                  </span>
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-green-900 underline-offset-2 hover:underline"
                    >
                      {item.title || item.url}
                    </a>
                  ) : (
                    <span className="font-medium text-green-900">{item.title || 'Untitled'}</span>
                  )}
                  {item.note ? <p className="mt-1 text-xs text-green-600">{item.note}</p> : null}
                </div>
              )
            })}
          </div>
        </div>
      )
    case 'objectives':
      return (
        <div className="rounded-xl border border-cream-300 bg-cream-50 p-4">
          <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
            Objectives
          </p>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-green-900">
            {block.items.filter(Boolean).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </div>
      )
    case 'dialogue':
      return (
        <div className="space-y-3 rounded-xl border border-cream-300 bg-cream-50 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-display text-lg text-green-900">{block.title || 'Dialogue'}</p>
            {block.url ? (
              <a
                href={block.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-gold-700 underline-offset-2 hover:underline"
              >
                Open dialogue link →
              </a>
            ) : null}
          </div>
          <div className="space-y-3">
            {block.lines.map((line, i) => {
              const alignment = line.alignment ?? (i % 2 === 0 ? 'left' : 'right')
              const isRight = alignment === 'right'
              const initial = (line.speaker || '?').slice(0, 1).toUpperCase()
              const tone = i % 2 === 0 ? 'bg-green-700' : 'bg-gold-600'
              const avatarSrc =
                lessonMediaPublicUrl(line.imageUrl) || line.imageUrl || null
              return (
                <div
                  key={i}
                  className={cn(
                    'flex gap-3 rounded-lg bg-white/70 p-3 ring-1 ring-cream-300',
                    isRight && 'flex-row-reverse',
                  )}
                >
                  {avatarSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarSrc}
                      alt={line.speaker || 'Speaker'}
                      className="size-8 shrink-0 rounded-full object-cover ring-1 ring-cream-300"
                    />
                  ) : (
                    <div
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-cream-50',
                        tone,
                      )}
                    >
                      {initial}
                    </div>
                  )}
                  <div className={cn('min-w-0 flex-1', isRight && 'text-right')}>
                    <div
                      className={cn(
                        'mb-1 flex items-center justify-between gap-2',
                        isRight && 'flex-row-reverse',
                      )}
                    >
                      <p className="text-[11px] font-semibold tracking-wide text-gold-700 uppercase">
                        {line.speaker}
                      </p>
                      <AudioPlayer
                        variant="icon"
                        sources={{ url: lessonMediaPublicUrl(line.audioUrl) || line.audioUrl || null }}
                        speakText={line.amharic || undefined}
                        label={`Play line by ${line.speaker}`}
                      />
                    </div>
                    <AmharicText size="lg" className="block text-green-950">
                      {line.amharic}
                    </AmharicText>
                    {line.transliteration ? (
                      <p className="mt-0.5 text-sm italic text-green-600">{line.transliteration}</p>
                    ) : null}
                    {line.english ? (
                      <p className="mt-1 text-sm text-green-800">{line.english}</p>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    case 'vocabulary_set': {
      const words = block.vocabularyIds.map((id) => vocabulary[id]).filter(Boolean)
      return (
        <div className="space-y-4">
          <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
            {block.title || 'Vocabulary'}
          </p>
          {words.length === 0 ? (
            <p className="text-sm text-green-600">No vocabulary linked yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {words.map((w) => (
                <div
                  key={w.id}
                  className="rounded-xl border border-cream-300 bg-cream-50 p-4 shadow-card transition hover:shadow-card-hover"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <AmharicText size="xl" className="block text-gold-700">
                        {w.amharic}
                      </AmharicText>
                      {w.transliteration ? (
                        <p className="mt-0.5 text-sm italic text-green-600">{w.transliteration}</p>
                      ) : null}
                    </div>
                    <AudioPlayer
                      variant="icon"
                      showSpeed
                      sources={vocabAudio(w)}
                      speakText={w.amharic}
                      label={`Listen to ${w.transliteration || w.amharic}`}
                    />
                  </div>
                  <div className="my-3 border-t border-cream-200" />
                  <p className="text-sm font-semibold text-green-900">{w.english}</p>
                  {w.exampleAmharic ? (
                    <div className="mt-2 rounded-lg bg-white/70 px-2.5 py-2 text-xs ring-1 ring-cream-300">
                      <AmharicText size="sm" className="block">
                        {w.exampleAmharic}
                      </AmharicText>
                      {w.exampleEnglish ? (
                        <p className="mt-0.5 text-green-600">{w.exampleEnglish}</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
          {block.showFlashcards && words.length > 0 ? (
            <InteractiveFlashcards
              title="Study these words"
              cards={words.map((w) => ({
                id: w.id,
                front: w.amharic,
                back: w.english,
                transliteration: w.transliteration ?? undefined,
                english: w.english,
                exampleAm: w.exampleAmharic ?? undefined,
                exampleEn: w.exampleEnglish ?? undefined,
                audio: vocabAudio(w),
              }))}
              mode={mode}
            />
          ) : null}
        </div>
      )
    }
    case 'comprehension_check':
      return <ComprehensionCheck block={block} mode={mode} />
    case 'flashcard_revision': {
      const fromVocab = block.vocabularyIds
        .map((id) => vocabulary[id])
        .filter(Boolean)
        .map((w) => ({
          id: w.id,
          front: w.amharic,
          back: w.english,
          transliteration: w.transliteration ?? undefined,
          english: w.english,
          exampleAm: w.exampleAmharic ?? undefined,
          exampleEn: w.exampleEnglish ?? undefined,
          audio: vocabAudio(w),
        }))
      const custom = block.cards
        .filter((c) => c.front || c.back)
        .map((c, i) => ({
          id: `custom-${i}`,
          front: c.front,
          back: c.hint ? `${c.back} (${c.hint})` : c.back,
          english: c.back,
          audio: c.audioUrl
            ? { url: lessonMediaPublicUrl(c.audioUrl) || c.audioUrl }
            : undefined,
        }))
      return (
        <InteractiveFlashcards
          title={block.title}
          cards={[...fromVocab, ...custom]}
          mode={mode}
        />
      )
    }
    case 'listening_practice': {
      const fromVocab = block.vocabularyIds
        .map((id) => vocabulary[id])
        .filter(Boolean)
        .map((w, i, arr) => {
          const distractors = arr
            .filter((x) => x.id !== w.id)
            .slice(0, 2)
            .map((x) => x.english)
          while (distractors.length < 2) distractors.push(`Option ${distractors.length + 2}`)
          const options = [w.english, ...distractors]
          return {
            id: w.id,
            audio: vocabAudio(w),
            speakText: w.amharic,
            options,
            correctIndex: 0,
            revealAmharic: w.amharic,
            revealEnglish: w.english,
          }
        })
      const custom = block.items
        .filter((item) => item.options.length >= 2)
        .map((item, i) => ({
          id: `listen-${i}`,
          audio: { url: lessonMediaPublicUrl(item.audioUrl) || item.audioUrl || null },
          speakText: item.speakText,
          options: item.options,
          correctIndex: item.correctIndex,
          revealAmharic: item.revealAmharic,
          revealEnglish: item.revealEnglish,
        }))
      return (
        <ListeningPractice
          title={block.title}
          items={[
            ...fromVocab.map((item) => ({
              ...item,
              prompt: block.prompt,
            })),
            ...custom.map((item) => ({
              ...item,
              prompt: block.prompt,
            })),
          ]}
          mode={mode}
        />
      )
    }
    case 'matching_cards':
      return <InteractiveMatching block={block} mode={mode} />
    case 'multiple_choice':
      return <InteractiveMultipleChoice block={block} mode={mode} />
    case 'speaking_task':
      return (
        <RecordingAssignment
          kind="audio"
          prompt={block.prompt}
          instructions={block.instructions}
          maxSeconds={block.maxSeconds}
          minSeconds={block.minSeconds}
          mode={mode}
          assignmentId={opts?.assignmentId}
          alreadySubmitted={opts?.alreadySubmitted}
        />
      )
    case 'video_practice':
      return (
        <RecordingAssignment
          kind="video"
          prompt={block.prompt}
          instructions={block.instructions}
          maxSeconds={block.maxSeconds}
          required={block.required}
          mode={mode}
          assignmentId={opts?.assignmentId}
          alreadySubmitted={opts?.alreadySubmitted}
        />
      )
    case 'homework_prompt':
      return (
        <HomeworkSubmission
          block={block}
          mode={mode}
          assignmentId={opts?.assignmentId}
          alreadySubmitted={opts?.alreadySubmitted}
        />
      )
    case 'divider':
      return <hr className="border-cream-300" />
    default:
      return null
  }
}

export function BlockRenderer({
  content,
  vocabulary = {},
  mode = 'student',
  className,
  assignmentId,
  alreadySubmitted,
}: BlockRendererProps) {
  const categories =
    content.part === 'practice' || content.part === 'language_lesson'
      ? content.categories ?? []
      : []
  const categoryIds = useMemo(() => new Set(categories.map((c) => c.id)), [categories])
  const [activeCategory, setActiveCategory] = useState(() => categories[0]?.id ?? '')

  const resolvedActive = useMemo(() => {
    if (categories.length === 0) return ''
    if (categories.some((c) => c.id === activeCategory)) return activeCategory
    return categories[0]?.id ?? ''
  }, [activeCategory, categories])

  /** Intro / details shown above tabs when no category is assigned. */
  const beforeBlocks = useMemo(() => {
    if (categories.length === 0) return content.blocks
    return content.blocks.filter((b) => !b.categoryId || !categoryIds.has(b.categoryId))
  }, [categories.length, categoryIds, content.blocks])

  const categoryBlocks = useMemo(() => {
    if (categories.length === 0) return []
    if (!resolvedActive) return []
    return content.blocks.filter((b) => b.categoryId === resolvedActive)
  }, [resolvedActive, categories.length, content.blocks])

  const blockOpts = { assignmentId, alreadySubmitted }

  return (
    <AudioPlaybackProvider>
      <article className={cn('space-y-6', className)}>
        {content.title ? (
          <header>
            <span className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
              {content.part === 'cultural_insight'
                ? 'Cultural Insight'
                : content.part === 'language_lesson'
                  ? 'Language Lesson'
                  : 'Practice'}
            </span>
            <h1 className="mt-1 font-display text-3xl text-green-900">{content.title}</h1>
          </header>
        ) : null}

        {content.part === 'cultural_insight' && content.hookQuestion ? (
          <div className="rounded-xl border border-gold-300 bg-gold-50 p-4">
            <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
              Think about this
            </p>
            <p className="mt-1 font-display text-lg text-green-900">{content.hookQuestion}</p>
          </div>
        ) : null}

        {beforeBlocks.map((block) => (
          <div key={block.id}>{renderBlock(block, vocabulary, mode, blockOpts)}</div>
        ))}

        {categories.length > 0 ? (
          <div className="space-y-6">
            <PracticeCategoryTabs
              categories={categories}
              activeId={resolvedActive}
              onChange={setActiveCategory}
            />
            {categoryBlocks.length === 0 ? (
              <p className="text-sm text-green-600">No exercises in this category yet.</p>
            ) : (
              categoryBlocks.map((block) => (
                <div key={block.id}>{renderBlock(block, vocabulary, mode, blockOpts)}</div>
              ))
            )}
          </div>
        ) : null}
      </article>
    </AudioPlaybackProvider>
  )
}
