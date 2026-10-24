import { adminProductsMockData, type CatalogProduct } from '@/ui/pages/admin/products/mock-data'
import { stockProductsMockData } from '@/ui/pages/stock/mock-data'
import { sharedProducts } from '@/data/mock-data'
import { adminAuditLogMockData } from '@/ui/pages/admin/audit-log/mock-data'
import { formatCurrency } from './format'

export interface UpdatePriceParams {
  productIdOrCode: string
  newPrice: number
  role: string
  userName: string
}

export function updateProductPrice({
  productIdOrCode,
  newPrice,
  role,
  userName,
}: UpdatePriceParams): { product: CatalogProduct; oldPrice: number; newPrice: number } {
  // Enforce role authorization
  if (role !== 'admin') {
    throw new Error('Not allowed')
  }

  // Validate price
  if (typeof newPrice !== 'number' || isNaN(newPrice) || newPrice < 0) {
    throw new Error('Price must be a valid number greater than or equal to 0')
  }

  // Find product in admin catalog
  const catalogProd = adminProductsMockData.find(
    (p) => p.code === productIdOrCode || p.name.toLowerCase() === productIdOrCode.toLowerCase()
  )
  if (!catalogProd) {
    throw new Error(`Product not found: ${productIdOrCode}`)
  }

  const oldPrice = catalogProd.price ?? 0
  const updatedAt = new Date().toISOString()

  // Update catalog record
  catalogProd.price = newPrice
  catalogProd.updated_at = updatedAt

  // Sync stock product records
  const stockProd = stockProductsMockData.find(
    (p) => p.name.toLowerCase() === catalogProd.name.toLowerCase()
  )
  if (stockProd) {
    stockProd.price = newPrice
    stockProd.updated_at = updatedAt
  }

  // Sync shared product records
  const sharedProd = sharedProducts.find(
    (p) => p.name.toLowerCase() === catalogProd.name.toLowerCase()
  )
  if (sharedProd) {
    sharedProd.price = newPrice
    sharedProd.updated_at = updatedAt
  }

  // Add audit log entry
  const newLogId = `LOG-${adminAuditLogMockData.length + 410}`
  adminAuditLogMockData.unshift({
    id: newLogId,
    action: 'Price Updated',
    actor: userName || 'Admin',
    time: 'Just now',
    details: `Price changed: ${catalogProd.name} ${oldPrice} -> ${newPrice} by ${userName || 'Admin'}`,
  })

  return { product: catalogProd, oldPrice, newPrice }
}

export interface AddProductParams {
  name: string
  category: string
  standardPack: string
  price: number
  role: string
  userName: string
}

export function addProduct({
  name,
  category,
  standardPack,
  price,
  role,
  userName,
}: AddProductParams): CatalogProduct {
  if (role !== 'admin') {
    throw new Error('Not allowed')
  }

  if (typeof price !== 'number' || isNaN(price) || price < 0) {
    throw new Error('Price must be a valid number greater than or equal to 0')
  }

  const code = `PRD-0${adminProductsMockData.length + 1}`
  const updatedAt = new Date().toISOString()
  const newProd: CatalogProduct = {
    code,
    name,
    category,
    standardPack,
    status: 'Active',
    price,
    updated_at: updatedAt,
  }

  adminProductsMockData.unshift(newProd)

  stockProductsMockData.unshift({
    name,
    category,
    left: '0',
    qty: '0',
    meta: `0 units left`,
    status: 'Healthy',
    location: 'Warehouse',
    price,
    updated_at: updatedAt,
  })

  const newLogId = `LOG-${adminAuditLogMockData.length + 410}`
  adminAuditLogMockData.unshift({
    id: newLogId,
    action: 'Product Added',
    actor: userName || 'Admin',
    time: 'Just now',
    details: `Added product ${name} with price ${formatCurrency(price)} by ${userName || 'Admin'}`,
  })

  return newProd
}
