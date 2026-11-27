import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  extractInvoiceDataFromImage,
  recalculateInvoiceTotals,
  createEmptyInvoiceItem,
  type ExtractedInvoiceItem,
} from '../src/lib/ocr/mockOcrService'
import {
  exportSingleInvoiceToExcel,
  exportAllConfirmedInvoicesToExcel,
} from '../src/lib/export/excelInvoiceExport'
import { invoicesStore, addInvoice, type StoredInvoice } from '../src/data/mock/invoices'
import { visitsStore, addVisit, type StoredVisit } from '../src/data/mock/visits'
import { recordVisitLocally } from '../src/data/mock/locations'

describe('Enhancement 1: Invoice OCR Review & Excel Export', () => {
  it('1.1 Mock OCR Extraction: Simulates realistic invoice extraction with confidence scoring', async () => {
    const mockFile = {
      name: 'invoice_test_scan.png',
      size: '1.2 MB',
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    }

    const extracted = await extractInvoiceDataFromImage(mockFile)

    assert.ok(extracted.invoiceNumber.startsWith('INV-'), 'Should generate valid invoice number')
    assert.ok(extracted.customerName.length > 0, 'Should extract customer name')
    assert.strictEqual(extracted.currency, 'EGP', 'Currency should default to EGP')
    assert.ok(extracted.items.length >= 2, 'Should extract dynamic line items')
    assert.ok(extracted.grandTotal > 0, 'Grand total should be positive')
    assert.ok(extracted.confidenceMap.invoiceNumber >= 90, 'Invoice number should have high confidence')
    assert.ok(extracted.uncertainFields.length > 0, 'Should mark uncertain fields (<80% confidence) for user review')
  })

  it('1.2 Dynamic Table Recalculation: Accurately computes subtotal, discounts, taxes, and grand totals', () => {
    const items: ExtractedInvoiceItem[] = [
      {
        id: 'row-1',
        productCode: 'BEV-10',
        productName: 'Bevato 10mg',
        quantity: 10,
        unit: 'Box',
        unitPrice: 100,
        discount: 50,
        tax: 20,
        lineTotal: 970, // 10*100 - 50 + 20 = 970
        confidence: 95,
      },
      {
        id: 'row-2',
        productCode: 'NAV-50',
        productName: 'Naviro D3',
        quantity: 5,
        unit: 'Vial',
        unitPrice: 200,
        discount: 0,
        tax: 40,
        lineTotal: 1040, // 5*200 - 0 + 40 = 1040
        confidence: 90,
      },
    ]

    const result = recalculateInvoiceTotals(items)

    assert.strictEqual(result.subtotal, 2000, 'Subtotal should be 10*100 + 5*200 = 2000')
    assert.strictEqual(result.totalDiscount, 50, 'Total discount should be 50')
    assert.strictEqual(result.totalTax, 60, 'Total tax should be 20 + 40 = 60')
    assert.strictEqual(result.grandTotal, 2010, 'Grand total should be 2000 - 50 + 60 = 2010')
  })

  it('1.3 Empty row helper: Creates editable item row with standard defaults', () => {
    const emptyRow = createEmptyInvoiceItem()
    assert.ok(emptyRow.id.startsWith('item-'), 'Item should have unique id')
    assert.strictEqual(emptyRow.quantity, 1)
    assert.strictEqual(emptyRow.unitPrice, 0)
    assert.strictEqual(emptyRow.confidence, 100, 'User created item should have full confidence')
  })

  it('1.4 Excel Export: Bulk export strictly excludes unconfirmed invoices and returns { exported: false } when empty', () => {
    const confirmedInvoice: StoredInvoice = {
      id: 'INV-TEST-01',
      invoiceNumber: 'INV-TEST-01',
      name: 'INV-TEST-01 · Cairo Medical',
      meta: '2 items · EGP 5,000',
      status: 'Approved',
      source: 'Web upload',
      dateRange: 'Today',
      repName: 'Alex Morgan',
      customerId: 'c-1',
      customerName: 'Cairo Medical',
      originalAmount: 5000,
      currency: 'EGP',
      issueDate: '2026-11-27',
      dueDate: '2026-12-27',
      items: [
        {
          productCode: 'BEV-10',
          productName: 'Bevato 10mg',
          quantity: 20,
          unitPrice: 250,
          total: 5000,
        },
      ],
    }

    const pendingInvoice: StoredInvoice = { ...confirmedInvoice, id: 'INV-PEND-01', invoiceNumber: 'INV-PEND-01', status: 'Pending' }
    const rejectedInvoice: StoredInvoice = { ...confirmedInvoice, id: 'INV-REJ-01', invoiceNumber: 'INV-REJ-01', status: 'Rejected' }

    // Single export does not throw in Node
    assert.doesNotThrow(() => {
      exportSingleInvoiceToExcel(confirmedInvoice)
    })

    // Bulk export with ONLY pending/rejected returns exported: false, count: 0
    const emptyRes = exportAllConfirmedInvoicesToExcel([pendingInvoice, rejectedInvoice])
    assert.deepStrictEqual(emptyRes, { exported: false, count: 0 })

    // Bulk export with 0 invoices returns exported: false, count: 0
    assert.deepStrictEqual(exportAllConfirmedInvoicesToExcel([]), { exported: false, count: 0 })

    // Bulk export with mixed statuses exports ONLY confirmed (count: 1)
    const mixedRes = exportAllConfirmedInvoicesToExcel([confirmedInvoice, pendingInvoice, rejectedInvoice])
    assert.deepStrictEqual(mixedRes, { exported: true, count: 1 })
  })
})

describe('Enhancement 2: Sidebar, RTL Alignment & Right-Side Drawers Outside-Click Behavior', () => {
  it('2.1 Navigation drawer remains open when clicking outside and aligns properly in RTL', async () => {
    const fs = await import('node:fs')
    const drawerCode = fs.readFileSync('src/ui/layout/TabletNavigationDrawer.tsx', 'utf8')
    assert.ok(!drawerCode.includes('className="modal-backdrop"\n      onClick={onClose}'), 'Backdrop must not dismiss drawer on outside click')
    assert.ok(drawerCode.includes('aria-label="Close navigation"'), 'Drawer must have explicit close button')
    assert.ok(!drawerCode.includes("lang === 'ar' ? 'flex-end' : 'flex-start'"), 'Must use logical flex-start so RTL aligns to right edge')
  })

  it('2.2 Right-side drawers never close on outside backdrop click', async () => {
    const fs = await import('node:fs')
    const drawerFiles = [
      'src/ui/design-system/components/Drawer.tsx',
      'src/ui/design-system/components/RecordFormDrawer.tsx',
      'src/ui/pages/clients/components/EditCustomerDrawer.tsx',
      'src/ui/pages/home/components/PharmaSections.tsx',
      'src/ui/pages/sell-in/components/CreateSalesOrderDrawer.tsx',
      'src/ui/pages/stock/components/StockActionModal.tsx',
    ]
    for (const file of drawerFiles) {
      const code = fs.readFileSync(file, 'utf8')
      assert.ok(!/className="modal-backdrop"\s+onClick=/.test(code), `${file} must not attach onClick to modal-backdrop`)
    }
  })
})

describe('Enhancement 3: Mandatory Presentation Image in New Visit', () => {
  it('3.1 Visits Store accepts and stores doctor presentation image metadata', () => {
    const visitData = {
      clientName: 'Dr. Tamer Hosny',
      repName: 'Alex Morgan',
      date: 'Nov 27, 2026',
      time: '11:00 AM',
      detail: 'Bevato scientific presentation',
      status: 'Completed',
      productsPresented: ['Bevato'],
      samplesQuantity: 5,
      reactionEmoji: '👍',
      reactionLabel: 'Interested',
      notes: 'Reviewed clinical trials data with Dr. Tamer.',
      nextVisitDate: 'Dec 11, 2026',
      gpsVerified: true,
      presentationImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
      presentationImageName: 'doctor_detailing_slides.jpg',
    }

    const recorded = recordVisitLocally(visitData, false)
    assert.ok(recorded.id, 'Should generate visit id')
    assert.strictEqual(recorded.presentationImage, visitData.presentationImage)
    assert.strictEqual(recorded.presentationImageName, 'doctor_detailing_slides.jpg')

    const inStore = visitsStore.get().find((v) => v.id === recorded.id)
    assert.ok(inStore, 'Visit should be stored in visitsStore')
    assert.strictEqual(inStore?.presentationImage, visitData.presentationImage)
  })

  it('3.2 Wizard code enforces GPS even offline and persists images in IndexedDB', async () => {
    const fs = await import('node:fs')
    const wizardCode = fs.readFileSync('src/ui/pages/visits/components/NewVisitWizard.tsx', 'utf8')

    assert.ok(wizardCode.includes('if (!presentationImage)'), 'Wizard must check presentationImage before saving')
    assert.ok(wizardCode.includes('if (!capturedCoords)'), 'Wizard must enforce GPS capture even when offline')
    assert.ok(!wizardCode.includes('if (!isOfflineMode && !gpsVerified)'), 'Offline mode must NOT bypass GPS validation')
    assert.ok(wizardCode.includes('saveVisitImage('), 'Wizard must persist presentation image in IndexedDB')
    assert.ok(wizardCode.includes('Doctor Presentation Image — Required'), 'Wizard must contain mandatory presentation image section')
  })
})
