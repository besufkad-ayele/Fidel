import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type SimpleMarkdownProps = {
  text: string
  className?: string
  /** Tighter spacing for lesson cards vs blog articles. */
  density?: 'lesson' | 'article'
}

/**
 * Lightweight CommonMark-ish renderer for lesson/blog rich_text blocks.
 * Supports headings, lists, blockquotes, hr, paragraphs, and inline
 * bold / italic / code / links.
 */
export function SimpleMarkdown({ text, className, density = 'lesson' }: SimpleMarkdownProps) {
  const blocks = parseBlocks(text.replace(/\r\n/g, '\n'))

  return (
    <div
      className={cn(
        density === 'article'
          ? 'space-y-5 text-base leading-relaxed text-green-700'
          : 'space-y-3 text-sm leading-relaxed text-green-900',
        className,
      )}
    >
      {blocks.map((block, i) => renderBlock(block, i, density))}
    </div>
  )
}

type MdBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'blockquote'; text: string }
  | { type: 'hr' }

function parseBlocks(source: string): MdBlock[] {
  const lines = source.split('\n')
  const out: MdBlock[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i] ?? ''

    if (!line.trim()) {
      i += 1
      continue
    }

    if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
      out.push({ type: 'hr' })
      i += 1
      continue
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      out.push({
        type: 'heading',
        level: heading[1]!.length as 1 | 2 | 3,
        text: heading[2]!.trim(),
      })
      i += 1
      continue
    }

    if (/^>\s?/.test(line)) {
      const quoted: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i] ?? '')) {
        quoted.push((lines[i] ?? '').replace(/^>\s?/, ''))
        i += 1
      }
      out.push({ type: 'blockquote', text: quoted.join(' ').trim() })
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i] ?? '')) {
        items.push((lines[i] ?? '').replace(/^[-*]\s+/, '').trim())
        i += 1
      }
      out.push({ type: 'ul', items })
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i] ?? '')) {
        items.push((lines[i] ?? '').replace(/^\d+\.\s+/, '').trim())
        i += 1
      }
      out.push({ type: 'ol', items })
      continue
    }

    const para: string[] = []
    while (
      i < lines.length &&
      (lines[i] ?? '').trim() &&
      !/^(#{1,3})\s+/.test(lines[i] ?? '') &&
      !/^[-*]\s+/.test(lines[i] ?? '') &&
      !/^\d+\.\s+/.test(lines[i] ?? '') &&
      !/^>\s?/.test(lines[i] ?? '') &&
      !/^---+$/.test((lines[i] ?? '').trim()) &&
      !/^\*\*\*+$/.test((lines[i] ?? '').trim())
    ) {
      para.push((lines[i] ?? '').trim())
      i += 1
    }
    if (para.length) out.push({ type: 'paragraph', text: para.join(' ') })
  }

  return out
}

function renderBlock(block: MdBlock, key: number, density: 'lesson' | 'article') {
  const listClass =
    density === 'article' ? 'list-disc space-y-2 pl-5 text-green-700' : 'list-disc space-y-1.5 pl-5 text-green-800'
  const olClass =
    density === 'article'
      ? 'list-decimal space-y-2 pl-5 text-green-700'
      : 'list-decimal space-y-1.5 pl-5 text-green-800'

  switch (block.type) {
    case 'heading': {
      if (block.level === 1) {
        return (
          <h2
            key={key}
            className={cn(
              'font-display text-green-900',
              density === 'article' ? 'pt-2 text-3xl' : 'pt-1 text-xl',
            )}
          >
            {inline(block.text)}
          </h2>
        )
      }
      if (block.level === 2) {
        return (
          <h3
            key={key}
            className={cn(
              'font-display text-green-800',
              density === 'article' ? 'pt-2 text-2xl' : 'pt-1 text-lg',
            )}
          >
            {inline(block.text)}
          </h3>
        )
      }
      return (
        <h4
          key={key}
          className={cn(
            'font-display font-semibold text-green-800',
            density === 'article' ? 'pt-2 text-xl' : 'pt-1 text-base',
          )}
        >
          {inline(block.text)}
        </h4>
      )
    }
    case 'ul':
      return (
        <ul key={key} className={listClass}>
          {block.items.map((item, j) => (
            <li key={j}>{inline(item)}</li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol key={key} className={olClass}>
          {block.items.map((item, j) => (
            <li key={j}>{inline(item)}</li>
          ))}
        </ol>
      )
    case 'blockquote':
      return (
        <blockquote
          key={key}
          className="border-l-2 border-gold-400 pl-3 text-green-800 italic"
        >
          {inline(block.text)}
        </blockquote>
      )
    case 'hr':
      return <hr key={key} className="border-cream-300" />
    case 'paragraph':
      return <p key={key}>{inline(block.text)}</p>
  }
}

function inline(text: string): ReactNode[] {
  // Order in the alternation matters: links / code / bold before single-asterisk italic.
  const parts = text.split(
    /(\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_\s][^_]*_)/g,
  )

  return parts.filter(Boolean).map((part, i) => {
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link) {
      return (
        <a
          key={i}
          href={link[2]}
          className="font-medium text-green-800 underline decoration-gold-500 underline-offset-2 hover:text-green-900"
          target={link[2]!.startsWith('http') ? '_blank' : undefined}
          rel={link[2]!.startsWith('http') ? 'noopener noreferrer' : undefined}
        >
          {link[1]}
        </a>
      )
    }

    const code = part.match(/^`([^`]+)`$/)
    if (code) {
      return (
        <code
          key={i}
          className="rounded bg-cream-200 px-1 py-0.5 font-mono text-[0.9em] text-green-900"
        >
          {code[1]}
        </code>
      )
    }

    const bold = part.match(/^\*\*([^*]+)\*\*$/) || part.match(/^__([^_]+)__$/)
    if (bold) {
      return (
        <strong key={i} className="font-semibold text-green-900">
          {bold[1]}
        </strong>
      )
    }

    const italic = part.match(/^\*([^*]+)\*$/) || part.match(/^_([^_]+)_$/)
    if (italic) {
      return (
        <em key={i} className="italic">
          {italic[1]}
        </em>
      )
    }

    return <span key={i}>{part}</span>
  })
}
