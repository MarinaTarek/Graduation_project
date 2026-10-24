import { StatusPill } from '@/ui/design-system/components/StatusPill'
import { adminUsersMockData } from '../mock-data'

export function UserListTable() {
  return (
    <div className="collection-list">
      {adminUsersMockData.map((user) => (
        <div key={user.name} className="collection-item">
          <div>
            <strong>{user.name}</strong>
            <span>{user.role} · {user.region}</span>
          </div>
          <StatusPill status={user.status} />
        </div>
      ))}
    </div>
  )
}
