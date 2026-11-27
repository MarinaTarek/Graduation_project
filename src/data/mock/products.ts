import { sharedProducts } from '@/data/mock-data'
import type { Product } from '@/data/types'
import { adminProductsMockData, type CatalogProduct } from '@/ui/pages/admin/products/mock-data'
import { stockProductsMockData, type StockProductRecord } from '@/ui/pages/stock/mock-data'
import { addAuditLog } from './audit'
import { createStore } from './store'
import { batchesStore, stockMovementsStore } from './stockDerived'
import { salesOrdersStore } from './sales-orders'
import { findAuthoritativeUser } from '@/lib/approval/approvalEngine'

export const productsStore = createStore<CatalogProduct[]>('products', adminProductsMockData)
export const stockProductsStore = createStore<StockProductRecord[]>('stock_products', stockProductsMockData)
const sharedProductsStore = createStore<Product[]>('shared_products', sharedProducts)

const now = () => new Date().toISOString()

function assertAdminProductActor(actor?: string): void {
  if (!actor || actor === 'Admin') return
  const authUser = findAuthoritativeUser(actor)
  if (authUser && authUser.role !== 'admin') {
    throw new Error(`Unauthorized: User "${actor}" (${authUser.role}) cannot perform product management operations.`)
  }
}

export function addProductRecord(product: CatalogProduct, actor: string) {
  assertAdminProductActor(actor)
  const updatedAt = now()
  const catalog: CatalogProduct = { ...product, status: product.status || 'Active', updated_at: updatedAt }
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

export function getCanonicalProduct(identifier: string): CatalogProduct | undefined {
  if (!identifier) return undefined
  const clean = identifier.trim().toLowerCase()
  return productsStore.get().find(
    (p) => p.code.toLowerCase() === clean || p.name.toLowerCase() === clean
  )
}

export function resolveCanonicalProductCode(identifier: string): string {
  const prod = getCanonicalProduct(identifier)
  return prod ? prod.code : identifier.trim()
}

export function updateProduct(code: string, patch: Partial<CatalogProduct>, actor?: string) {
  assertAdminProductActor(actor)
  const updatedAt = now()
  const current = productsStore.get().find((p) => p.code === code)
  if (!current) throw new Error(`Product ${code} not found.`)

  const oldName = current.name
  const oldPrice = current.price ?? 0
  let next: CatalogProduct | undefined

  productsStore.update((list) =>
    list.map((p) => {
      if (p.code !== code) return p
      next = { ...p, ...patch, updated_at: updatedAt }
      return next
    }),
  )

  if (next) {
    const newName = next.name || oldName
    const price = next.price

    // Phase 2 - 3.2: Historical movements must NOT be rewritten when a product is renamed.
    // product_id remains the stable foreign identifier, while productName in movements
    // preserves the historical snapshot recorded when the transaction occurred.
    // Only batchesStore is updated with the current name and product_id so active batch lots stay aligned.
    if (patch.name && patch.name.trim() && patch.name.trim().toLowerCase() !== oldName.toLowerCase()) {
      batchesStore.update((bList) =>
        bList.map((b) =>
          b.product_id === code || b.productName.toLowerCase() === oldName.toLowerCase()
            ? { ...b, product_id: code, productName: newName, updated_at: updatedAt }
            : b
        )
      )

      // Ensure historical movements possess the stable product_id without altering their recorded snapshot productName
      stockMovementsStore.update((mList) =>
        mList.map((m) =>
          (m.product_id === code || m.productName.toLowerCase() === oldName.toLowerCase()) && !m.product_id
            ? { ...m, product_id: code }
            : m
        )
      )
    }

    // Synchronize projection stores
    stockProductsStore.update((list) =>
      list.map((p) =>
        p.name.toLowerCase() === oldName.toLowerCase() || p.name.toLowerCase() === newName.toLowerCase()
          ? { ...p, name: newName, price, updated_at: updatedAt }
          : p,
      ),
    )
    sharedProductsStore.update((list) =>
      list.map((p) =>
        p.name.toLowerCase() === oldName.toLowerCase() || p.name.toLowerCase() === newName.toLowerCase()
          ? { ...p, name: newName, price, updated_at: updatedAt }
          : p,
      ),
    )

    if (actor && patch.price !== undefined && patch.price !== oldPrice) {
      addAuditLog({
        action: 'Price Updated',
        actor,
        time: 'Just now',
        details: `Price changed: ${newName} ${oldPrice} -> ${patch.price} by ${actor}`,
      })
    }

    if (actor && patch.name !== undefined && patch.name !== oldName) {
      addAuditLog({
        action: 'Product Renamed',
        actor,
        time: 'Just now',
        details: `Product renamed: ${oldName} -> ${patch.name} (${code}) by ${actor}`,
      })
    }
  }

  return next
}

export function archiveProduct(code: string, actor: string = 'Admin') {
  assertAdminProductActor(actor)
  const prod = productsStore.get().find((p) => p.code === code)
  if (!prod) throw new Error(`Product not found: ${code}`)

  updateProduct(code, { status: 'Archived' }, actor)
  addAuditLog({
    action: 'Product Archived',
    actor,
    time: 'Just now',
    details: `Archived product ${prod.name} (${code})`,
  })
}

export function deactivateProduct(code: string, actor: string = 'Admin') {
  assertAdminProductActor(actor)
  const prod = productsStore.get().find((p) => p.code === code)
  if (!prod) throw new Error(`Product not found: ${code}`)

  updateProduct(code, { status: 'Inactive' }, actor)
  addAuditLog({
    action: 'Product Deactivated',
    actor,
    time: 'Just now',
    details: `Deactivated product ${prod.name} (${code})`,
  })
}

export function deleteProduct(code: string, actor: string = 'Admin') {
  assertAdminProductActor(actor)
  const prod = productsStore.get().find((p) => p.code === code)
  if (!prod) throw new Error(`Product not found: ${code}`)

  // Referential check
  const pName = prod.name.toLowerCase()
  const batches = batchesStore.get().filter((b) => b.product_id === code || b.productName.toLowerCase() === pName)
  const orders = salesOrdersStore.get().filter((o) =>
    o.items.some((i) => i.productCode === code || i.productName.toLowerCase() === pName)
  )

  if (batches.length > 0 || orders.length > 0) {
    throw new Error(
      `Cannot delete product ${prod.name} (${code}): referenced in ${batches.length} batches and ${orders.length} orders. Archive it instead.`
    )
  }

  productsStore.update((list) => list.filter((p) => p.code !== code))
  stockProductsStore.update((list) => list.filter((p) => p.name.toLowerCase() !== pName))
  sharedProductsStore.update((list) => list.filter((p) => p.name.toLowerCase() !== pName))

  addAuditLog({
    action: 'Product Deleted',
    actor,
    time: 'Just now',
    details: `Deleted product ${prod.name} (${code})`,
  })
}
