import { BarChart2 } from 'lucide-react'
import { EmptyState } from '@/ui/design-system/components/EmptyState'

export default function ReportsPage() {
  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <BarChart2 /> ANALYTICS & INSIGHTS
          </span>
          <h1>Reports</h1>
          <p className="story">
            Sales aggregation, prescription velocity, and territory performance summaries.
          </p>
        </div>
      </div>

      <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'center' }}>
        <div
          className="panel"
          style={{
            maxWidth: '520px',
            width: '100%',
            padding: '48px 32px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'var(--blue-tint)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ocean)',
            }}
          >
            <BarChart2 style={{ width: '28px', height: '28px' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', color: 'var(--heading-text)', margin: '0 0 8px' }}>
              Reports are coming soon
            </h2>
            <p style={{ color: 'var(--muted-text)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              Automated monthly rollups, rep KPI attribution, and pharmacy dispense trends will be available here.
            </p>
          </div>
          <EmptyState message="Reports module scheduled for release in Q4" />
        </div>
      </div>
    </section>
  )
}
