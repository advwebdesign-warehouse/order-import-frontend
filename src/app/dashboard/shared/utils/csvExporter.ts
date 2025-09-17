import { ColumnConfig } from '../components/ColumnSettings'

export interface ExportableItem {
  [key: string]: any
}

export interface ExportColumn extends ColumnConfig {
  exportKey?: string // Optional different key for export
  formatter?: (value: any, item: ExportableItem) => string
}

export interface CSVExportOptions {
  filename?: string
  includeHeaders?: boolean
  excludeColumns?: string[] // Column IDs to exclude from export
  customHeaders?: { [columnId: string]: string }
}

/**
 * Generic CSV exporter that works with any data type
 */
export class CSVExporter {
  private static escapeCSVField(field: any): string {
    const fieldStr = String(field ?? '')

    // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n') || fieldStr.includes('\r')) {
      return `"${fieldStr.replace(/"/g, '""')}"`
    }

    return fieldStr
  }

  private static generateFilename(prefix: string = 'export'): string {
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0] // YYYY-MM-DD format
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-') // HH-MM-SS format
    return `${prefix}-${dateStr}-${timeStr}.csv`
  }

  private static downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  /**
   * Export data to CSV
   */
  static export<T extends ExportableItem>(
    data: T[],
    columns: ExportColumn[],
    options: CSVExportOptions = {}
  ): void {
    const {
      filename,
      includeHeaders = true,
      excludeColumns = [],
      customHeaders = {}
    } = options

    // Filter out non-exportable columns
    const exportableColumns = columns.filter(col =>
      col.visible &&
      !excludeColumns.includes(col.id) &&
      col.field !== 'select' &&
      col.field !== 'actions' &&
      col.field !== 'image' // Images can't be exported to CSV
    )

    if (exportableColumns.length === 0) {
      console.warn('No exportable columns found')
      return
    }

    // Create headers
    const headers = exportableColumns.map(col =>
      customHeaders[col.id] || col.label || col.field
    )

    // Convert data to CSV rows
    const csvRows = data.map(item => {
      return exportableColumns.map(column => {
        const value = item[column.exportKey || column.field]

        // Use custom formatter if provided
        if (column.formatter) {
          return this.escapeCSVField(column.formatter(value, item))
        }

        // Default formatting
        return this.escapeCSVField(value)
      })
    })

    // Create CSV content
    const csvContent = [
      ...(includeHeaders ? [headers.join(',')] : []),
      ...csvRows.map(row => row.join(','))
    ].join('\n')

    // Generate filename
    const finalFilename = filename || this.generateFilename('export')

    // Download the file
    this.downloadCSV(csvContent, finalFilename)

    console.log(`Exported ${data.length} items with ${exportableColumns.length} columns to ${finalFilename}`)
  }

  /**
   * Create a template CSV for data import
   */
  static createTemplate<T extends ExportableItem>(
    columns: ExportColumn[],
    sampleData?: T[],
    options: CSVExportOptions = {}
  ): void {
    const {
      filename = 'import-template.csv',
      customHeaders = {}
    } = options

    // Filter to only editable/importable columns
    const templateColumns = columns.filter(col =>
      col.field !== 'select' &&
      col.field !== 'actions' &&
      col.field !== 'id' && // Usually auto-generated
      col.field !== 'createdAt' && // Usually auto-generated
      col.field !== 'updatedAt' // Usually auto-generated
    )

    // Create headers
    const headers = templateColumns.map(col =>
      customHeaders[col.id] || col.label || col.field
    )

    // Create sample rows if provided
    const sampleRows = sampleData ? sampleData.slice(0, 3).map(item => {
      return templateColumns.map(column => {
        const value = item[column.exportKey || column.field]
        return this.escapeCSVField(value || '')
      })
    }) : []

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.join(','))
    ].join('\n')

    // Download the template
    this.downloadCSV(csvContent, filename)

    console.log(`Created import template with ${templateColumns.length} columns`)
  }
}

/**
 * Convenience function for quick exports
 */
export function exportToCSV<T extends ExportableItem>(
  data: T[],
  columns: ExportColumn[],
  filename?: string
): void {
  CSVExporter.export(data, columns, { filename })
}

/**
 * Convenience function for creating import templates
 */
export function createImportTemplate<T extends ExportableItem>(
  columns: ExportColumn[],
  sampleData?: T[],
  filename?: string
): void {
  CSVExporter.createTemplate(columns, sampleData, { filename })
}
