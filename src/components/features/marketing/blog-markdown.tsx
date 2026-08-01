import { SimpleMarkdown } from '@/components/shared/simple-markdown'

type BlogMarkdownProps = {
  text: string
  className?: string
}

/** Lightweight markdown for public blog posts (headings, lists, paragraphs, links). */
export function BlogMarkdown({ text, className }: BlogMarkdownProps) {
  return <SimpleMarkdown text={text} className={className} density="article" />
}
