import { Menu } from 'lucide-react'
import { MoreGrid } from './components/MoreGrid'

export interface MorePageProps {
  onSelectPage: (page: string) => void
  onAction: (actionText: string) => void
}

export default function MorePage({ onSelectPage, onAction }: MorePageProps) {
  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <Menu /> WORKSPACE
          </span>
          <h1>More</h1>
          <p className="story">The rest of your operating system, in one place.</p>
        </div>
      </div>
      <MoreGrid onSelectPage={onSelectPage} onAction={onAction} />
    </section>
  )
}
