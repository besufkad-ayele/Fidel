import { cn } from '@/lib/utils'

type BlogMarkdownProps = {
  text: string
  className?: string
}

/** Lightweight markdown for public blog posts (headings, lists, paragraphs, links). */
export function BlogMarkdown({ text, className }: BlogMarkdownProps) {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/).filter(Boolean)

  return (
    <div className={cn('space-y-5 text-base leading-relaxed text-green-700', className)}>
      {blocks.map((block, i) => {
        if (block.startsWith('### ')) {
          return (
            <h3 key={i} className="font-display pt-2 text-xl text-green-800">
              {inline(block.slice(4))}
            </h3>
          )
        }
        if (block.startsWith('## ')) {
          return (
            <h2 key={i} className="font-display pt-2 text-2xl text-green-800">
              {inline(block.slice(3))}
            </h2>
          )
        }
        if (block.startsWith('# ')) {
          return (
            <h2 key={i} className="font-display pt-2 text-3xl text-green-900">
              {inline(block.slice(2))}
            </h2>
          )
        }
        if (block.split('\n').every((line) => line.startsWith('- ') || line.startsWith('* '))) {
          const items = block.split('\n').filter((line) => /^[-*]\s/.test(line))
          return (
            <ul key={i} className="list-disc space-y-2 pl-5 text-green-700">
              {items.map((item, j) => (
                <li key={j}>{inline(item.replace(/^[-*]\s/, ''))}</li>
              ))}
            </ul>
          )
        }
        return <p key={i}>{inline(block.replace(/\n/g, ' '))}</p>
      })}
    </div>
  )
}

function inline(text: string) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link) {
      return (
        <a
          key={i}
          href={link[2]}
          className="font-medium text-green-800 underline decoration-gold-500 underline-offset-2 hover:text-green-900"
          target={link[2].startsWith('http') ? '_blank' : undefined}
          rel={link[2].startsWith('http') ? 'noopener noreferrer' : undefined}
        >
          {link[1]}
        </a>
      )
    }
    const bold = part.match(/^\*\*([^*]+)\*\*$/)
    if (bold) {
      return (
        <strong key={i} className="font-semibold text-green-800">
          {bold[1]}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}
