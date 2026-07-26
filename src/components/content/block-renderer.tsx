'use client'

import { AmharicText } from '@/components/shared/amharic-text'
import { AudioPlaybackProvider, AudioPlayer } from '@/components/shared/audio-player'
import type { ContentBlock, LessonPartContent } from '@/lib/validation/content'
import { cn } from '@/lib/utils'
import { InteractiveMultipleChoice } from '@/components/content/interactive/multiple-choice'
import { InteractiveMatching } from '@/components/content/interactive/matching'
import { InteractiveFlashcards } from '@/components/content/interactive/flashcards'
import { ListeningPractice } from '@/components/content/interactive/listening-practice'
import { TimedRecorder } from '@/components/content/interactive/timed-recorder'
import { ComprehensionCheck } from '@/components/content/interactive/comprehension-check'

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
}

function MarkdownBody({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/).filter(Boolean)
  return (
    <div className="space-y-3 text-sm leading-relaxed text-green-900">
      {paragraphs.map((p, i) => {
        if (p.startsWith('## ')) {
          return (
            <h3 key={i} className="pt-2 font-display text-lg text-green-800">
              {p.slice(3)}
            </h3>
          )
        }
        if (p.startsWith('# ')) {
          return (
            <h2 key={i} className="pt-2 font-display text-xl text-green-900">
              {p.slice(2)}
            </h2>
          )
        }
        if (p.startsWith('- ')) {
          const items = p.split('\n').filter((l) => l.startsWith('- '))
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-5 text-green-800">
              {items.map((item, j) => (
                <li key={j}>{item.slice(2)}</li>
              ))}
            </ul>
          )
        }
        return <p key={i}>{p}</p>
      })}
    </div>
  )
}

function vocabAudio(w: VocabLookup[string]) {
  return {
    slow: w.audioSlow,
    normal: w.audioNormal,
    natural: w.audioNatural,
  }
}

function renderBlock(
  block: ContentBlock,
  vocabulary: VocabLookup,
  mode: 'student' | 'preview',
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
      return <MarkdownBody text={block.markdown || ''} />
    case 'image':
      return block.url ? (
        <figure className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.url}
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
    case 'video':
      return block.url ? (
        <figure className="space-y-2">
          <div className="aspect-video overflow-hidden rounded-xl border border-cream-300 bg-green-950">
            <iframe
              src={block.url.includes('youtube.com/watch')
                ? block.url.replace('watch?v=', 'embed/')
                : block.url}
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
    case 'audio':
      return (
        <AudioPlayer
          variant="full"
          label={block.label || 'Listen'}
          showSpeed
          sources={{ url: block.url || null }}
        />
      )
    case 'callout': {
      const tones = {
        tip: 'border-gold-300 bg-gold-50 text-green-900',
        note: 'border-cream-400 bg-cream-100 text-green-900',
        warning: 'border-danger-300 bg-danger-50 text-green-950',
      }
      return (
        <aside className={cn('rounded-xl border p-4', tones[block.variant])}>
          {block.title ? <p className="mb-1 text-sm font-semibold">{block.title}</p> : null}
          <p className="text-sm leading-relaxed">{block.body}</p>
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
      return (
        <div className="overflow-x-auto rounded-xl border border-cream-300">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead className="bg-cream-200 text-green-800">
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} className="px-3 py-2 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className="border-t border-cream-300">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-green-900">
                      {/[ሀ-፼]/.test(cell) ? <AmharicText size="sm">{cell}</AmharicText> : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'references':
      return (
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
            References
          </p>
          <ul className="space-y-2">
            {block.items.map((item, i) => (
              <li
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
              </li>
            ))}
          </ul>
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
          <p className="font-display text-lg text-green-900">{block.title || 'Dialogue'}</p>
          <div className="space-y-3">
            {block.lines.map((line, i) => {
              const initial = (line.speaker || '?').slice(0, 1).toUpperCase()
              const tone = i % 2 === 0 ? 'bg-green-700' : 'bg-gold-600'
              return (
                <div
                  key={i}
                  className="flex gap-3 rounded-lg bg-white/70 p-3 ring-1 ring-cream-300"
                >
                  <div
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-cream-50',
                      tone,
                    )}
                  >
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold tracking-wide text-gold-700 uppercase">
                        {line.speaker}
                      </p>
                      <AudioPlayer
                        variant="icon"
                        sources={{ url: line.audioUrl || null }}
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
          audio: c.audioUrl ? { url: c.audioUrl } : undefined,
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
          audio: { url: item.audioUrl || null },
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
        <TimedRecorder
          kind="audio"
          prompt={block.prompt}
          instructions={block.instructions}
          maxSeconds={block.maxSeconds}
          minSeconds={block.minSeconds}
          mode={mode}
        />
      )
    case 'video_practice':
      return (
        <TimedRecorder
          kind="video"
          prompt={block.prompt}
          instructions={block.instructions}
          maxSeconds={block.maxSeconds}
          required={block.required}
          mode={mode}
        />
      )
    case 'homework_prompt':
      return (
        <div className="space-y-3 rounded-xl border border-gold-300 bg-gold-50 p-5">
          <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">Homework</p>
          <h3 className="font-display text-xl text-green-900">{block.title}</h3>
          <p className="text-sm leading-relaxed text-green-800">{block.instructions}</p>
          <div className="flex flex-wrap gap-2 text-[11px] font-medium text-green-700">
            {block.allowText ? <span className="rounded-full bg-white/70 px-2 py-1">Text</span> : null}
            {block.allowAudio ? (
              <span className="rounded-full bg-white/70 px-2 py-1">
                Audio{block.maxAudioSeconds ? ` ≤ ${block.maxAudioSeconds}s` : ''}
              </span>
            ) : null}
            {block.allowVideo ? (
              <span className="rounded-full bg-white/70 px-2 py-1">
                Video{block.maxVideoSeconds ? ` ≤ ${block.maxVideoSeconds}s` : ''}
              </span>
            ) : null}
            {block.allowFiles ? <span className="rounded-full bg-white/70 px-2 py-1">Files</span> : null}
          </div>
          {block.allowAudio ? (
            <TimedRecorder
              kind="audio"
              prompt="Record your homework response"
              maxSeconds={block.maxAudioSeconds ?? 60}
              mode={mode}
            />
          ) : null}
          {block.allowVideo ? (
            <TimedRecorder
              kind="video"
              prompt="Record your video practice"
              maxSeconds={block.maxVideoSeconds ?? 60}
              mode={mode}
            />
          ) : null}
        </div>
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
}: BlockRendererProps) {
  return (
    <AudioPlaybackProvider>
      <article className={cn('space-y-6', className)}>
        {content.part === 'cultural_insight' && content.hookQuestion ? (
          <div className="rounded-xl border border-gold-300 bg-gold-50 p-4">
            <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
              Think about this
            </p>
            <p className="mt-1 font-display text-lg text-green-900">{content.hookQuestion}</p>
          </div>
        ) : null}

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

        {content.blocks.map((block) => (
          <div key={block.id}>{renderBlock(block, vocabulary, mode)}</div>
        ))}
      </article>
    </AudioPlaybackProvider>
  )
}
