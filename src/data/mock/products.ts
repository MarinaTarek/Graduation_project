import { sharedProducts } from '@/data/mock-data'
import type { Product } from '@/data/types'
import { adminProductsMockData, type CatalogProduct } from '@/ui/pages/admin/products/mock-data'
import { stockProductsMockData, type StockProductRecord } from '@/ui/pages/stock/mock-data'
import { addAuditLog } from './audit'
import { createStore } from './store'

export const productsStore = createStore<CatalogProduct[]>('products', adminProductsMockData)
export const stockProductsStore = createStore<StockProductRecord[]>('stock_products', stockProductsMockData)
const sharedProductsStore = createStore<Product[]>('shared_products', sharedProducts)

const now = () => new Date().toISOString()

export function addProductRecord(product: CatalogProduct, actor: string) {
  const updatedAt = now()
  const catalog: CatalogProduct = { ...product, updated_at: updatedAt }
  productsStore.update((list) => [catalog, ...list])
  stockProductsStore.update((list) => [
    {
      name: catalog.name,
      name_ar: catalog.name_ar,
      category: catalog.category,
      left: '0',
      qty: '0',
      meta: '0 units left',
      status: 'Healthy',
      location: 'Warehouse',
      price: catalog.price,
      updated_at: updatedAt,
    },
    ...list,
  ])
  addAuditLog({
    action: 'Product Added',
    actor,
    time: 'Just now',
    details: `Added product ${catalog.name} with price ${catalog.price ?? 0} by ${actor}`,
  })
  return catalog
}

export function updateProduct(code: string, patch: Partial<CatalogProduct>, actor?: string) {
  const updatedAt = now()
  const current = productsStore.get().find((p) => p.code === code)
  const oldPrice = current?.price ?? 0
  let next: CatalogProduct | undefined
  productsStore.update((list) =>
    list.map((p) => {
      if (p.code !== code) return p
      next = { ...p, ...patch, updated_at: updatedAt }
      return next
    }),
  )
  if (next?.name) {
    const name = next.name
    const price = next.price
    stockProductsStore.update((list) =>
      list.map((p) =>
        p.name.toLowerCase() === name.toLowerCase()
          ? { ...p, price, updated_at: updatedAt }
          : p,
      ),
    )
    sharedProductsStore.update((list) =>
      list.map((p) =>
        p.name.toLowerCase() === name.toLowerCase()
          ? { ...p, price, updated_at: updatedAt }
          : p,
      ),
    )
    if (actor && patch.price !== undefined) {
      addAuditLog({
        action: 'Price Updated',
        actor,
        time: 'Just now',
        details: `Price changed: ${name} ${oldPrice} -> ${patch.price} by ${actor}`,
      })
    }
  }
  return next
}
