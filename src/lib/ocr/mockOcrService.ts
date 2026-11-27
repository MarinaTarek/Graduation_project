/**
 * Navigen Distribution Suite — Mock OCR Extraction Service
 *
 * Isolated frontend service providing typed invoice data extraction simulation.
 * Decoupled from future OCR backend / computer-vision model APIs.
 */

import { productsStore } from '@/data/mock/products'
import { customersStore } from '@/data/mock/customers'

export interface ExtractedInvoiceItem {
  id: string
  productCode: string
  productName: string
  quantity: number
  unit: string
  unitPrice: number
  discount: number
  tax: number
  lineTotal: number
  confidence: number // 0 to 100
  isUncertain?: boolean
}

export interface ExtractedInvoiceData {
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  supplierName: string
  customerName: string
  customerId?: string
  currency: string
  paymentTerms: string
  items: ExtractedInvoiceItem[]
  subtotal: number
  totalDiscount: number
  totalTax: number
  grandTotal: number
  confidenceMap: Record<string, number> // 0 to 100 confidence score per field
  uncertainFields: string[] // field keys flagged for visual user review
  rawImageUrl?: string
  imageFileName?: string
  isSimulation?: boolean
}

/**
 * Recalculates all line totals and aggregate invoice totals.
 * Formula per item: (quantity * unitPrice) - discount + tax
 * Subtotal: sum(quantity * unitPrice)
 * Total Discount: sum(discount)
 * Total Tax: sum(tax)
 * Grand Total: Subtotal - Total Discount + Total Tax
 */
export function recalculateInvoiceTotals(items: ExtractedInvoiceItem[]): {
  recalculatedItems: ExtractedInvoiceItem[]
  subtotal: number
  totalDiscount: number
  totalTax: number
  grandTotal: number
} {
  let subtotal = 0
  let totalDiscount = 0
  let totalTax = 0

  const recalculatedItems = items.map((item) => {
    const rawLine = Number((item.quantity * item.unitPrice).toFixed(2))
    const disc = Number((Math.max(0, item.discount || 0)).toFixed(2))
    const tx = Number((Math.max(0, item.tax || 0)).toFixed(2))
    const lineTotal = Number(Math.max(0, rawLine - disc + tx).toFixed(2))

    subtotal += rawLine
    totalDiscount += disc
    totalTax += tx

    return {
      ...item,
      discount: disc,
      tax: tx,
      lineTotal,
    }
  })

  subtotal = Number(subtotal.toFixed(2))
  totalDiscount = Number(totalDiscount.toFixed(2))
  totalTax = Number(totalTax.toFixed(2))
  const grandTotal = Number((subtotal - totalDiscount + totalTax).toFixed(2))

  return {
    recalculatedItems,
    subtotal,
    totalDiscount,
    totalTax,
    grandTotal,
  }
}

/**
 * Creates an empty invoice item row with safe defaults
 */
export function createEmptyInvoiceItem(): ExtractedInvoiceItem {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    productCode: '',
    productName: '',
    quantity: 1,
    unit: 'Box',
    unitPrice: 0,
    discount: 0,
    tax: 0,
    lineTotal: 0,
    confidence: 100, // User-added rows have full confidence
    isUncertain: false,
  }
}

/**
 * Simulates OCR extraction from an uploaded invoice image.
 * Uses real catalog products and customers to generate a plausible extraction result
 * with varying confidence scores and marked uncertain fields.
 */
export async function extractInvoiceDataFromImage(fileInfo: {
  name: string
  size?: string
  dataUrl?: string
}): Promise<ExtractedInvoiceData> {
  // Simulate asynchronous OCR processing latency
  await new Promise((resolve) => setTimeout(resolve, 850))

  const customers = customersStore.get().filter((c) => !c.deleted_at && c.active !== false)
  const products = productsStore.get()

  // Select customer or fallback
  const targetCustomer = customers.length > 0 ? customers[0] : null
  const customerName = targetCustomer?.name || 'Giza Wholesale Warehouse'
  const customerId = targetCustomer?.id || 'wh-gz-01'

  // Current dates
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const dueDateObj = new Date(today)
  dueDateObj.setDate(dueDateObj.getDate() + 30)
  const dueDateStr = dueDateObj.toISOString().split('T')[0]

  // Unique invoice number candidate
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
  const invoiceNumber = `INV-${randomSuffix}`

  // Pick up to 2-3 sample products
  const p1 = products[0]?.name || 'Bevato 10mg'
  const p2 = products[1]?.name || 'Naviro D3 50,000 IU'

  const rawItems: ExtractedInvoiceItem[] = [
    {
      id: `item-ocr-1`,
      productCode: 'BEV-10MG',
      productName: p1,
      quantity: 50,
      unit: 'Box',
      unitPrice: 120.0,
      discount: 100.0,
      tax: 826.0,
      lineTotal: 6726.0,
      confidence: 96,
      isUncertain: false,
    },
    {
      id: `item-ocr-2`,
      productCode: 'NAV-50K',
      productName: p2,
      quantity: 25,
      unit: 'Vial',
      unitPrice: 240.0,
      discount: 0.0,
      tax: 840.0,
      lineTotal: 6840.0,
      confidence: 78,
      isUncertain: true, // Marked for review
    },
  ]

  const { recalculatedItems, subtotal, totalDiscount, totalTax, grandTotal } =
    recalculateInvoiceTotals(rawItems)

  const confidenceMap: Record<string, number> = {
    invoiceNumber: 99,
    invoiceDate: 95,
    dueDate: 72, // Below 80 threshold -> uncertain
    supplierName: 98,
    customerName: 94,
    currency: 99,
    paymentTerms: 65, // Below 80 threshold -> uncertain
    subtotal: 96,
    grandTotal: 96,
  }

  const uncertainFields = Object.keys(confidenceMap).filter((k) => confidenceMap[k] < 80)

  return {
    invoiceNumber,
    invoiceDate: todayStr,
    dueDate: dueDateStr,
    supplierName: 'Navigen Pharmaceuticals Egypt S.A.E.',
    customerName,
    customerId,
    currency: 'EGP',
    paymentTerms: 'Net 30 Days',
    items: recalculatedItems,
    subtotal,
    totalDiscount,
    totalTax,
    grandTotal,
    confidenceMap,
    uncertainFields,
    rawImageUrl: fileInfo.dataUrl,
    imageFileName: fileInfo.name,
    isSimulation: true,
  }
}
