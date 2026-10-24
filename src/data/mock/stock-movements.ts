import { createStore } from './store'

export interface StockMovement {
  id: string
  productName: string
  batchNumber?: string
  quantity: number
  type: string
  updated_at?: string
}

export const stockMovementsStore = createStore<StockMovement[]>('stock_movements', [])

const now = () => new Date().toISOString()

export function addStockMovement(data: Omit<StockMovement, 'id' | 'updated_at'> & { id?: string }) {
  const movement: StockMovement = {
    ...data,
    id: data.id ?? `SM-${Date.now()}`,
    updated_at: now(),
  }
  stockMovementsStore.update((list) => [movement, ...list])
  return movement
}
