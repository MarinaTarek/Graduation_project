/**
 * Navigen Distribution Suite — Excel Export Service
 *
 * Implements Microsoft Excel XML Spreadsheet 2003 format (SpreadsheetML).
 * Zero-dependency, client-side, multi-sheet workbook generation.
 * Opens seamlessly in Microsoft Excel (all versions), LibreOffice Calc, and Google Sheets
 * without XML syntax errors or file format warnings.
 */

import type { StoredInvoice } from '@/data/mock/invoices'
import type { ExtractedInvoiceData } from '@/lib/ocr/mockOcrService'

function escapeXml(unsafe: string | number | null | undefined): string {
  if (unsafe === null || unsafe === undefined) return ''
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function getTimestampString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

function triggerDownload(content: string, filename: string) {
  if (typeof window === 'undefined') return
  const blob = new Blob([content], { type: 'application/xml;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const EXCEL_XML_HEADER = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Navigen Distribution Suite</Author>
  <Company>Navigen Pharmaceuticals</Company>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="10" ss:Color="#1B3554"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="HeaderStyle">
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#1B3554" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0B1A2C"/>
   </Borders>
  </Style>
  <Style ss:ID="SubHeaderStyle">
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="10" ss:Color="#1B3554" ss:Bold="1"/>
   <Interior ss:Color="#EBF3FA" ss:Pattern="Solid"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="TitleStyle">
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="14" ss:Color="#1B3554" ss:Bold="1"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="CurrencyCell">
   <NumberFormat ss:Format="#,##0.00"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="NumberCell">
   <NumberFormat ss:Format="#,##0"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="DateCell">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="BoldCurrencyCell">
   <Font ss:FontName="Segoe UI" ss:Bold="1" ss:Color="#1B3554"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Interior ss:Color="#F0F9FF" ss:Pattern="Solid"/>
  </Style>
 </Styles>`

/**
 * Exports a single confirmed or reviewed invoice as a 2-sheet Excel Workbook.
 * Sheet 1: Invoice Header & Summary Details
 * Sheet 2: Itemized Line Items Table
 */
export function exportSingleInvoiceToExcel(
  invoice: StoredInvoice | ExtractedInvoiceData | Record<string, any>
): void {
  const inv = invoice as any
  const invNumber = inv.invoiceNumber || inv.id || 'INV-EXPORT'
  const custName = inv.customerName || 'Customer'
  const issueDate = inv.issueDate || inv.invoiceDate || 'N/A'
  const dueDate = inv.dueDate || 'N/A'
  const currency = inv.currency || 'EGP'
  const supplier = inv.supplierName || 'Navigen Pharmaceuticals'
  const status = inv.status || 'Confirmed'
  const repName = inv.repName || 'Sales Representative'

  // Determine line items
  const items = Array.isArray(inv.items) ? inv.items : []
  const subtotal = typeof inv.subtotal === 'number'
    ? inv.subtotal
    : items.reduce((s: number, it: any) => s + (it.total || it.quantity * it.unitPrice || 0), 0)
  const discount = typeof inv.totalDiscount === 'number'
    ? inv.totalDiscount
    : (inv.discountAmount || 0)
  const tax = typeof inv.totalTax === 'number' ? inv.totalTax : 0
  const grandTotal = typeof inv.grandTotal === 'number'
    ? inv.grandTotal
    : (inv.originalAmount || subtotal - discount + tax)

  const xmlContent = `${EXCEL_XML_HEADER}
 <Worksheet ss:Name="Invoice Summary">
  <Table ss:DefaultColumnWidth="140">
   <Column ss:Width="160"/>
   <Column ss:Width="240"/>
   <Row ss:Height="26">
    <Cell ss:MergeAcross="1" ss:StyleID="TitleStyle">
     <Data ss:Type="String">Navigen Distribution Suite — Invoice ${escapeXml(invNumber)}</Data>
    </Cell>
   </Row>
   <Row ss:Height="8"/>
   <Row ss:Height="20">
    <Cell ss:StyleID="SubHeaderStyle"><Data ss:Type="String">Invoice Number</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(invNumber)}</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:StyleID="SubHeaderStyle"><Data ss:Type="String">Supplier</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(supplier)}</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:StyleID="SubHeaderStyle"><Data ss:Type="String">Customer Name</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(custName)}</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:StyleID="SubHeaderStyle"><Data ss:Type="String">Issue Date</Data></Cell>
    <Cell ss:StyleID="DateCell"><Data ss:Type="String">${escapeXml(issueDate)}</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:StyleID="SubHeaderStyle"><Data ss:Type="String">Due Date</Data></Cell>
    <Cell ss:StyleID="DateCell"><Data ss:Type="String">${escapeXml(dueDate)}</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:StyleID="SubHeaderStyle"><Data ss:Type="String">Currency</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(currency)}</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:StyleID="SubHeaderStyle"><Data ss:Type="String">Status</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(status)}</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:StyleID="SubHeaderStyle"><Data ss:Type="String">Sales Representative</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(repName)}</Data></Cell>
   </Row>
   <Row ss:Height="12"/>
   <Row ss:Height="20">
    <Cell ss:StyleID="SubHeaderStyle"><Data ss:Type="String">Subtotal</Data></Cell>
    <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${subtotal}</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:StyleID="SubHeaderStyle"><Data ss:Type="String">Total Discount</Data></Cell>
    <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${discount}</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:StyleID="SubHeaderStyle"><Data ss:Type="String">Total Tax</Data></Cell>
    <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${tax}</Data></Cell>
   </Row>
   <Row ss:Height="24">
    <Cell ss:StyleID="SubHeaderStyle"><Data ss:Type="String">Grand Total (${escapeXml(currency)})</Data></Cell>
    <Cell ss:StyleID="BoldCurrencyCell"><Data ss:Type="Number">${grandTotal}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
 <Worksheet ss:Name="Line Items">
  <Table ss:DefaultColumnWidth="110">
   <Column ss:Width="100"/>
   <Column ss:Width="220"/>
   <Column ss:Width="80"/>
   <Column ss:Width="70"/>
   <Column ss:Width="100"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="110"/>
   <Row ss:Height="24">
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Product Code</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Product Name</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Quantity</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Unit</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Unit Price (${escapeXml(currency)})</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Discount</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Tax</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Line Total (${escapeXml(currency)})</Data></Cell>
   </Row>
   ${items.length === 0
     ? `<Row ss:Height="20"><Cell ss:MergeAcross="7"><Data ss:Type="String">No itemized line items recorded.</Data></Cell></Row>`
     : items.map((it: any) => `
   <Row ss:Height="20">
    <Cell><Data ss:Type="String">${escapeXml(it.productCode || 'N/A')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(it.productName || 'Unspecified Product')}</Data></Cell>
    <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${it.quantity || 1}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(it.unit || 'Box')}</Data></Cell>
    <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${it.unitPrice || 0}</Data></Cell>
    <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${it.discount || 0}</Data></Cell>
    <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${it.tax || 0}</Data></Cell>
    <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${it.lineTotal || it.total || (it.quantity * it.unitPrice)}</Data></Cell>
   </Row>`).join('')}
  </Table>
 </Worksheet>
</Workbook>`

  const cleanNum = invNumber.replace(/[^a-zA-Z0-9_-]/g, '_')
  const filename = `Navigen_Invoice_${cleanNum}_${getTimestampString()}.xml`
  triggerDownload(xmlContent, filename)
}

/**
 * Exports all confirmed/approved invoices in the system as a multi-sheet Excel XML Workbook.
 * Sheet 1: Confirmed Invoices Master Register
 * Sheet 2: Consolidated Itemized Line Items
 *
 * Returns { exported: false, count: 0 } without generating a file if no confirmed invoices exist.
 */
export function exportAllConfirmedInvoicesToExcel(invoices: StoredInvoice[]): { exported: boolean; count: number } {
  // Confirmed invoices: Approved, Paid, Partially Paid, or explicitly Confirmed
  const confirmed = invoices.filter(
    (inv) => inv.status === 'Approved' || inv.status === 'Paid' || inv.status === 'Partially Paid' || inv.status === 'Confirmed'
  )

  if (confirmed.length === 0) {
    return { exported: false, count: 0 }
  }

  const targetList = confirmed

  // Extract all line items with invoice number reference
  const allLineItems: Array<{
    invoiceNumber: string
    customerName: string
    productCode: string
    productName: string
    quantity: number
    unitPrice: number
    lineTotal: number
  }> = []

  targetList.forEach((inv) => {
    if (inv.items && inv.items.length > 0) {
      inv.items.forEach((it) => {
        allLineItems.push({
          invoiceNumber: inv.invoiceNumber || inv.id || 'N/A',
          customerName: inv.customerName || 'N/A',
          productCode: it.productCode || 'N/A',
          productName: it.productName || 'N/A',
          quantity: it.quantity || 1,
          unitPrice: it.unitPrice || 0,
          lineTotal: it.total || it.quantity * it.unitPrice || 0,
        })
      })
    }
  })

  const xmlContent = `${EXCEL_XML_HEADER}
 <Worksheet ss:Name="Confirmed Invoices">
  <Table ss:DefaultColumnWidth="120">
   <Column ss:Width="110"/>
   <Column ss:Width="220"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="70"/>
   <Column ss:Width="110"/>
   <Column ss:Width="100"/>
   <Column ss:Width="140"/>
   <Column ss:Width="100"/>
   <Row ss:Height="24">
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Invoice No</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Customer Name</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Issue Date</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Due Date</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Currency</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Original Amount</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Status</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Representative</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Source</Data></Cell>
   </Row>
   ${targetList.map((inv) => `
   <Row ss:Height="20">
    <Cell><Data ss:Type="String">${escapeXml(inv.invoiceNumber || inv.id)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(inv.customerName || inv.name)}</Data></Cell>
    <Cell ss:StyleID="DateCell"><Data ss:Type="String">${escapeXml(inv.issueDate || 'N/A')}</Data></Cell>
    <Cell ss:StyleID="DateCell"><Data ss:Type="String">${escapeXml(inv.dueDate || 'N/A')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(inv.currency || 'EGP')}</Data></Cell>
    <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${inv.originalAmount || 0}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(inv.status)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(inv.repName || 'N/A')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(inv.source || 'N/A')}</Data></Cell>
   </Row>`).join('')}
  </Table>
 </Worksheet>
 <Worksheet ss:Name="All Line Items">
  <Table ss:DefaultColumnWidth="120">
   <Column ss:Width="110"/>
   <Column ss:Width="200"/>
   <Column ss:Width="100"/>
   <Column ss:Width="220"/>
   <Column ss:Width="80"/>
   <Column ss:Width="100"/>
   <Column ss:Width="110"/>
   <Row ss:Height="24">
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Invoice No</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Customer Name</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Product Code</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Product Name</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Quantity</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Unit Price (EGP)</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Line Total (EGP)</Data></Cell>
   </Row>
   ${allLineItems.length === 0
     ? `<Row ss:Height="20"><Cell ss:MergeAcross="6"><Data ss:Type="String">No itemized lines recorded across selected invoices.</Data></Cell></Row>`
     : allLineItems.map((it) => `
   <Row ss:Height="20">
    <Cell><Data ss:Type="String">${escapeXml(it.invoiceNumber)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(it.customerName)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(it.productCode)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(it.productName)}</Data></Cell>
    <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${it.quantity}</Data></Cell>
    <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${it.unitPrice}</Data></Cell>
    <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${it.lineTotal}</Data></Cell>
   </Row>`).join('')}
  </Table>
 </Worksheet>
</Workbook>`

  const filename = `Navigen_Confirmed_Invoices_${getTimestampString()}.xml`
  triggerDownload(xmlContent, filename)
  return { exported: true, count: targetList.length }
}
