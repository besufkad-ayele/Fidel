'use client'

import { useState } from 'react'
import { CheckCircle2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const QUESTION = {
  prompt: "How do you ask a male friend 'How are you?' in Amharic?",
  options: [
    { id: 'a', text: 'ሰላም (Selam)' },
    { id: 'b', text: 'እንዴት ነህ? (Endet neh?)', correct: true },
    { id: 'c', text: 'እንዴት ነሽ? (Endet nesh?)' },
    { id: 'd', text: 'ደህና ነኝ (Dehna negn)' },
  ],
  explanation:
    "'Endet neh?' is used when speaking to a male. 'Endet nesh?' is used when speaking to a female.",
}

export function PracticeQuiz() {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="space-y-5 rounded-xl border border-cream-300 bg-cream-50 p-6 shadow-card">
      <div className="flex items-center justify-between border-b border-cream-200 pb-3">
        <span className="text-xs font-semibold tracking-[0.14em] text-gold-600 uppercase">
          Part 3 · Practice quiz
        </span>
        <span className="text-xs font-semibold text-green-600">Question 1 of 5</span>
      </div>

      <h3 className="text-lg font-bold text-green-900">{QUESTION.prompt}</h3>

      <div className="space-y-2.5">
        {QUESTION.options.map((opt) => {
          let style =
            'border-cream-300 bg-cream-100/50 text-green-800 hover:bg-cream-200/60'
          if (selected === opt.id) {
            style = 'border-gold-500 bg-gold-50 font-semibold text-green-950 ring-1 ring-gold-500'
          }
          if (submitted) {
            if (opt.correct) style = 'border-success-500 bg-success-50 font-bold text-success-500'
            else if (selected === opt.id) style = 'border-danger-500 bg-danger-50 text-danger-500'
          }

          return (
            <button
              key={opt.id}
              type="button"
              disabled={submitted}
              onClick={() => setSelected(opt.id)}
              className={cn(
                'flex w-full items-center justify-between rounded-xl border p-4 text-left text-sm transition-all',
                style,
              )}
            >
              <span>{opt.text}</span>
              {submitted && opt.correct ? (
                <CheckCircle2 className="size-5 text-success-500" />
              ) : null}
            </button>
          )
        })}
      </div>

      {!submitted ? (
        <Button
          disabled={!selected}
          onClick={() => setSubmitted(true)}
          className="w-full bg-gold-500 text-green-950 hover:bg-gold-600 disabled:bg-cream-200 disabled:text-green-400"
        >
          Submit answer
        </Button>
      ) : (
        <div className="space-y-2 rounded-xl border border-gold-300 bg-gold-50 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-gold-800">
            <Sparkles className="size-4 text-gold-600" />
            Explanation
          </div>
          <p className="text-xs text-green-800">{QUESTION.explanation}</p>
        </div>
      )}
    </div>
  )
}
