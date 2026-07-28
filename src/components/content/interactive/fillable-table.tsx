'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AmharicText } from '@/components/shared/amharic-text'
import type { z } from 'zod'
import type { tableBlockSchema } from '@/lib/validation/content'
import { cn } from '@/lib/utils'

type Block = z.infer<typeof tableBlockSchema>

function emptyRow(cols: number) {
  return Array.from({ length: cols }, () => '')
}

function looksAmharic(text: string) {
  return /[ሀ-፼]/.test(text)
}

function CellText({ value }: { value: string }) {
  if (!value) return <span className="text-green-400">—</span>
  return looksAmharic(value) ? <AmharicText size="sm">{value}</AmharicText> : <>{value}</>
}

/**
 * Fillable table: admin starter rows stay fixed; students add empty rows below.
 */
export function InteractiveFillableTable({
  block,
  mode = 'student',
}: {
  block: Block
  mode?: 'student' | 'preview'
}) {
  const colCount = Math.max(block.headers.length, 1)
  const maxRows = block.maxRows ?? 20

  const fixedRows = (block.rows ?? [])
    .map((row) => {
      const next = [...row]
      while (next.length < colCount) next.push('')
      return next.slice(0, colCount)
    })
    .filter((row) => row.some((cell) => cell.trim().length > 0))

  const [extraRows, setExtraRows] = useState<string[][]>(() =>
    fixedRows.length === 0 ? [emptyRow(colCount)] : [],
  )

  const totalRows = fixedRows.length + extraRows.length
  const canAdd = totalRows < maxRows

  function updateExtraCell(ri: number, ci: number, value: string) {
    setExtraRows((prev) =>
      prev.map((row, i) => (i === ri ? row.map((cell, j) => (j === ci ? value : cell)) : row)),
    )
  }

  function addRow() {
    if (!canAdd) return
    setExtraRows((prev) => [...prev, emptyRow(colCount)])
  }

  function removeExtraRow(index: number) {
    setExtraRows((prev) => {
      if (fixedRows.length === 0 && prev.length <= 1) return prev
      return prev.filter((_, i) => i !== index)
    })
  }

  return (
    <div className="space-y-3">
      {block.title ? (
        <p className="font-display text-lg text-green-900">{block.title}</p>
      ) : (
        <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
          Fillable table
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-cream-300">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead className="bg-cream-200 text-green-800">
            <tr>
              <th className="w-10 px-2 py-2 text-center font-semibold">#</th>
              {block.headers.map((h, i) => (
                <th key={i} className="px-3 py-2 font-semibold">
                  {h || `Column ${i + 1}`}
                </th>
              ))}
              <th className="w-12 px-2 py-2">
                <span className="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {fixedRows.map((row, ri) => (
              <tr key={`fixed-${ri}`} className="border-t border-cream-300 bg-cream-50/80">
                <td className="px-2 py-2 text-center text-xs font-semibold text-green-600">
                  {ri + 1}
                </td>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-green-900">
                    <CellText value={cell} />
                  </td>
                ))}
                <td className="px-1 py-1.5 text-center">
                  <span className="text-[10px] font-medium tracking-wide text-green-500 uppercase">
                    Fixed
                  </span>
                </td>
              </tr>
            ))}
            {extraRows.map((row, ri) => {
              const displayIndex = fixedRows.length + ri + 1
              const canRemove = fixedRows.length > 0 || extraRows.length > 1
              return (
                <tr key={`extra-${ri}`} className="border-t border-cream-300">
                  <td className="px-2 py-2 text-center text-xs font-semibold text-green-600">
                    {displayIndex}
                  </td>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-2 py-1.5">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => updateExtraCell(ri, ci, e.target.value)}
                        placeholder={block.headers[ci] || `Column ${ci + 1}`}
                        className="w-full min-w-[100px] rounded-md border border-cream-300 bg-white px-2 py-1.5 text-sm text-green-900 outline-none focus:border-gold-500"
                      />
                    </td>
                  ))}
                  <td className="px-1 py-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => removeExtraRow(ri)}
                      disabled={!canRemove}
                      className="inline-flex size-7 items-center justify-center rounded-md text-green-600 hover:bg-cream-200 disabled:opacity-40"
                      aria-label={`Remove row ${displayIndex}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={addRow} disabled={!canAdd}>
          <Plus className="mr-1 size-3.5" />
          Add row
        </Button>
        <p className="text-xs text-green-600">
          {totalRows} / {maxRows} rows
          {fixedRows.length > 0 ? ` · ${fixedRows.length} fixed` : ''}
          {mode === 'preview' ? ' · Preview' : ''}
        </p>
      </div>
    </div>
  )
}

export function StaticContentTable({
  headers,
  rows,
  title,
}: {
  headers: string[]
  rows: string[][]
  title?: string
}) {
  return (
    <div className="space-y-2">
      {title ? <p className="font-display text-lg text-green-900">{title}</p> : null}
      <div className="overflow-x-auto rounded-xl border border-cream-300">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead className="bg-cream-200 text-green-800">
            <tr>
              <th className="w-10 px-2 py-2 text-center font-semibold">#</th>
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2 font-semibold">
                  {h || `Column ${i + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={ri}
                className={cn('border-t border-cream-300', ri % 2 === 1 && 'bg-cream-50/60')}
              >
                <td className="px-2 py-2 text-center text-xs font-semibold text-green-600">
                  {ri + 1}
                </td>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-green-900">
                    <CellText value={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
