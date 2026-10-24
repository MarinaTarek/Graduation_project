import '@/data/mock'
import { resetDemoData } from '@/data/mock/store'
import { Button } from '@/ui/design-system/components/Button'
import { useT } from '@/lib/i18n'
import { adminSettingsMockData } from '../mock-data'

export function SettingsForm() {
  const { t } = useT()

  return (
    <>
    <div className="panel" style={{ maxWidth: '640px' }}>
      <div className="form-grid">
        <label>
          {t('admin.settings.orgName')}
          <input defaultValue={adminSettingsMockData.organizationName} />
        </label>
        <label>
          {t('admin.settings.currency')}
          <input defaultValue={adminSettingsMockData.currency} />
        </label>
        <label>
          {t('admin.settings.timezone')}
          <input defaultValue={adminSettingsMockData.timezone} />
        </label>
        <label>
          {t('admin.settings.syncPacing')}
          <input defaultValue={adminSettingsMockData.dataSyncInterval} />
        </label>
      </div>
    </div>
    <div className="panel" style={{ maxWidth: '640px', marginTop: '16px' }}>
      <strong>{t('admin.settings.demoDataTitle')}</strong>
      <p style={{ margin: '8px 0 12px', color: 'var(--muted-text)', fontSize: '13px' }}>
        {t('admin.settings.demoDataDesc')}
      </p>
      <Button
        variant="secondary"
        type="button"
        onClick={() => {
          if (window.confirm(t('admin.settings.confirmResetDemo'))) {
            resetDemoData()
          }
        }}
      >
        {t('admin.settings.resetDemoButton')}
      </Button>
    </div>
    </>
  )
}
