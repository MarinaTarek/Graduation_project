import '@/data/mock'
import { resetDemoData } from '@/data/mock/store'
import { Button } from '@/ui/design-system/components/Button'
import { adminSettingsMockData } from '../mock-data'

export function SettingsForm() {
  return (
    <>
    <div className="panel" style={{ maxWidth: '640px' }}>
      <div className="form-grid">
        <label>
          Organization Name
          <input defaultValue={adminSettingsMockData.organizationName} />
        </label>
        <label>
          Currency
          <input defaultValue={adminSettingsMockData.currency} />
        </label>
        <label>
          Timezone
          <input defaultValue={adminSettingsMockData.timezone} />
        </label>
        <label>
          Data Sync Pacing
          <input defaultValue={adminSettingsMockData.dataSyncInterval} />
        </label>
      </div>
    </div>
    <div className="panel" style={{ maxWidth: '640px', marginTop: '16px' }}>
      <strong>Demo data</strong>
      <p style={{ margin: '8px 0 12px', color: 'var(--muted-text)', fontSize: '13px' }}>
        Data is stored in this browser only
      </p>
      <Button
        variant="secondary"
        type="button"
        onClick={() => {
          if (window.confirm('Reset demo data? This restores the original seed in this browser.')) {
            resetDemoData()
          }
        }}
      >
        Reset demo data
      </Button>
    </div>
    </>
  )
}
