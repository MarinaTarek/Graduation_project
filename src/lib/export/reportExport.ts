/**
 * reportExport.ts
 *
 * Client-Side Authoritative Report Export Service (SpreadsheetML 2003 XML)
 * Enforces role authorization and permission checks (canExport).
 * Strictly exports authorized, scoped data rows only.
 */

import type { User, UserRole } from '@/lib/auth/types'
import { isReportAuthorizedForRole } from '@/ui/pages/reports/reportCatalog'

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
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1B3554"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#1B3554" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Title">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="14" ss:Color="#1B3554" ss:Bold="1"/>
  </Style>
  <Style ss:ID="SubTitle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="10" ss:Color="#64748B"/>
  </Style>
  <Style ss:ID="DataCell">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="10" ss:Color="#1E293B"/>
  </Style>
  <Style ss:ID="CurrencyCell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="10" ss:Color="#1E293B"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="NumberCell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="10" ss:Color="#1E293B"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <Style ss:ID="PercentCell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="10" ss:Color="#1E293B"/>
   <NumberFormat ss:Format="0.0%"/>
  </Style>
  <Style ss:ID="SummaryTotal">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#1B3554"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1B3554"/>
   </Borders>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="11" ss:Color="#1B3554" ss:Bold="1"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
 </Styles>`

export interface ExportColumn {
  key: string
  label: string
  type?: 'string' | 'number' | 'currency' | 'percent'
  width?: number
}

export interface ExportReportOptions {
  reportId: string
  reportTitle: string
  columns: ExportColumn[]
  data: Record<string, any>[]
  user: {
    id?: string
    name?: string
    role?: UserRole | string
    businessUnit?: string
    permissions?: { canExport?: boolean }
  }
}

export function validateExportPermission(
  user: ExportReportOptions['user'],
  reportId?: string
): {
  allowed: boolean
  error?: string
} {
  const role = (user.role || 'rep') as UserRole

  // Report-level authorization check
  if (reportId && !isReportAuthorizedForRole(reportId, role)) {
    return {
      allowed: false,
      error: `Permission Denied: Role "${role}" is not authorized to access or export report "${reportId}".`,
    }
  }

  // Explicit permission check
  if (user.permissions && user.permissions.canExport === false) {
    return {
      allowed: false,
      error: 'Permission Denied: Your account role does not permit exporting operational or financial reports.',
    }
  }

  // Representative default policy check
  if (role === 'rep' && (!user.permissions || !user.permissions.canExport)) {
    return {
      allowed: false,
      error: 'Permission Denied: Medical Representatives are not permitted to export data.',
    }
  }

  // Marketing Manager policy check
  if (role === 'marketing_manager' && reportId && reportId !== 'sell-in-vs-sell-out' && reportId !== 'stock-expiry') {
    return {
      allowed: false,
      error: 'Permission Denied: Marketing Managers cannot export field, rep, or customer commercial data.',
    }
  }

  return { allowed: true }
}

export function exportReportToExcel(options: ExportReportOptions): { success: boolean; error?: string } {
  const auth = validateExportPermission(options.user, options.reportId)
  if (!auth.allowed) {
    return { success: false, error: auth.error }
  }

  const { reportId, reportTitle, columns, data, user } = options
  const timestamp = getTimestampString()
  const filename = `Navigen_${reportId}_${timestamp}.xls`

  let xml = `${EXCEL_XML_HEADER}\n`
  xml += ` <Worksheet ss:Name="${escapeXml(reportTitle.slice(0, 30))}">\n`
  xml += '  <Table>\n'

  // Columns definition
  columns.forEach((col) => {
    xml += `   <Column ss:Width="${col.width || 120}"/>\n`
  })

  // Title rows
  xml += '   <Row ss:Height="24">\n'
  xml += `    <Cell ss:StyleID="Title" ss:MergeAcross="${columns.length - 1}"><Data ss:Type="String">${escapeXml(reportTitle)}</Data></Cell>\n`
  xml += '   </Row>\n'

  xml += '   <Row ss:Height="18">\n'
  xml += `    <Cell ss:StyleID="SubTitle" ss:MergeAcross="${columns.length - 1}"><Data ss:Type="String">Exported by: ${escapeXml(user.name || 'User')} (${escapeXml(user.role || '')}) • Date: ${escapeXml(new Date().toISOString().replace('T', ' ').slice(0, 19))}</Data></Cell>\n`
  xml += '   </Row>\n'

  xml += '   <Row ss:Height="10"/>\n'

  // Header row
  xml += '   <Row ss:Height="24">\n'
  columns.forEach((col) => {
    xml += `    <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(col.label)}</Data></Cell>\n`
  })
  xml += '   </Row>\n'

  // Data rows
  data.forEach((row) => {
    xml += '   <Row ss:Height="20">\n'
    columns.forEach((col) => {
      const val = row[col.key]
      const type = col.type || 'string'

      if (type === 'currency' || type === 'number') {
        const num = typeof val === 'number' ? val : parseFloat(val) || 0
        const style = type === 'currency' ? 'CurrencyCell' : 'NumberCell'
        xml += `    <Cell ss:StyleID="${style}"><Data ss:Type="Number">${num}</Data></Cell>\n`
      } else if (type === 'percent') {
        const num = typeof val === 'number' ? val / 100 : parseFloat(val) / 100 || 0
        xml += `    <Cell ss:StyleID="PercentCell"><Data ss:Type="Number">${num}</Data></Cell>\n`
      } else {
        xml += `    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(val ?? '')}</Data></Cell>\n`
      }
    })
    xml += '   </Row>\n'
  })

  xml += '  </Table>\n'
  xml += ' </Worksheet>\n'
  xml += '</Workbook>'

  triggerDownload(xml, filename)
  return { success: true }
}
