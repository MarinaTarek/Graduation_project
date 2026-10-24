import { cardiwellBatches } from '@/ui/pages/stock/mock-data'
import { createStore } from './store'

export type BatchRow = [string, string, string, string]

export const batchesStore = createStore<BatchRow[]>(
  'batches',
  cardiwellBatches.map((b) => [b[0], b[1], b[2], b[3]] as BatchRow),
)
