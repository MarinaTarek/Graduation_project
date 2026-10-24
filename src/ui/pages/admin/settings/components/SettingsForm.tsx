import { adminSettingsMockData } from '../mock-data'

export function SettingsForm() {
  return (
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
  )
}
