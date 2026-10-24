import { addProductRecord, productsStore, updateProduct } from '@/data/mock/products'
import type { CatalogProduct } from '@/ui/pages/admin/products/mock-data'

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

  const catalogProd = productsStore.get().find(
    (p) => p.code === productIdOrCode || p.name.toLowerCase() === productIdOrCode.toLowerCase()
  )
  if (!catalogProd) {
    throw new Error(`Product not found: ${productIdOrCode}`)
  }

  const oldPrice = catalogProd.price ?? 0
  const product = updateProduct(catalogProd.code, { price: newPrice }, userName || 'Admin')
  if (!product) {
    throw new Error(`Product not found: ${productIdOrCode}`)
  }

  return { product, oldPrice, newPrice }
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

  const code = `PRD-0${productsStore.get().length + 1}`
  return addProductRecord(
    {
      code,
      name,
      category,
      standardPack,
      status: 'Active',
      price,
    },
    userName || 'Admin',
  )
}
