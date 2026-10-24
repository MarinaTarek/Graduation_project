export interface MockNotice {
  id: string
  title: string
  time: string
  unread?: boolean
  dotClass?: string
}

export const mockNotificationsList: MockNotice[] = [
  { id: 'n-1', title: 'Invoice approval requested', time: '1 hour ago', unread: true, dotClass: 'n-0' },
  { id: 'n-2', title: 'Bevato is low in North warehouse', time: '2 hours ago', unread: true, dotClass: 'n-1' },
  { id: 'n-3', title: 'Batch CW-2401 expires in 12 days', time: '3 hours ago', unread: true, dotClass: 'n-2' },
]

export const earlierNotificationsList: MockNotice[] = [
  { id: 'n-4', title: 'Invoice INV-1042 was rejected', time: 'Yesterday', unread: false, dotClass: 'n-2' },
]

export function addMockNotification(title: string): void {
  mockNotificationsList.unshift({
    id: `n-${Date.now()}`,
    title,
    time: 'Just now',
    unread: true,
    dotClass: 'n-0',
  })
}
