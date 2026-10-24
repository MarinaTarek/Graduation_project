import { Activity } from 'lucide-react'
import { homeQuote } from '../mock-data'

export function QuoteCard() {
  return (
    <section className="quote-card">
      <div className="quote-mark">“</div>
      <div>
        <p>{homeQuote.quote}</p>
        <span>{homeQuote.attribution}</span>
      </div>
      <Activity />
    </section>
  )
}
