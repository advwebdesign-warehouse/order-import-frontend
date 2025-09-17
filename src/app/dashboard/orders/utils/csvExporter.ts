import { Order, ColumnConfig } from './orderTypes'
import { formatCurrency, formatDate } from './orderUtils'

export function exportOrdersToCSV(orders: Order[], columns: ColumnConfig[]) {
  // Filter out non-exportable columns
  const exportableColumns = columns.filter(col =>
    col.visible &&
    col.field !== 'select' &&
    col.field !== 'actions'
  )

  // Create CSV headers
  const headers = exportableColumns.map(col => col.label || col.field)

  // Convert orders to CSV data
  const csvData = orders.map(order => {
    return exportableColumns.map(column => {
      switch (column.field) {
        case 'orderNumber':
          return order.orderNumber
        case 'customerName':
          return order.customerName
        case 'customerEmail':
          return order.customerEmail
        case 'status':
          return order.status
        case 'fulfillmentStatus':
          return order.fulfillmentStatus.replace('_', ' ')
        case 'totalAmount':
          return formatCurrency(order.totalAmount, order.currency)
        case 'currency':
          return order.currency
        case 'itemCount':
          return order.itemCount.toString()
        case 'platform':
          return order.platform
        case 'country':
          return order.country
        case 'countryName':
          return order.country
        case 'countryCode':
          return order.countryCode
        case 'orderDate':
          return formatDate(order.orderDate)
        case 'shippingFirstName':
          return order.shippingFirstName
        case 'shippingLastName':
          return order.shippingLastName
        case 'shippingFullName':
          return `${order.shippingFirstName} ${order.shippingLastName}`
        case 'requestedShipping':
          return order.requestedShipping
        case 'orderTime':
          return new Date(order.orderDate).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        case 'orderDay':
          return new Date(order.orderDate).toLocaleDateString('en-US', {
            weekday: 'long'
          })
        case 'orderMonth':
          return new Date(order.orderDate).toLocaleDateString('en-US', {
            month: 'long'
          })
        case 'orderYear':
          return new Date(order.orderDate).getFullYear().toString()
        default:
          return ''
      }
    })
  })

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...csvData.map(row =>
      row.map(cell => {
        // Escape commas and quotes in cell content
        const cellStr = String(cell)
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`
        }
        return cellStr
      }).join(',')
    )
  ].join('\n')

  // Create and download the file
  downloadCSV(csvContent, generateFilename())

  console.log(`Exported ${orders.length} orders with ${exportableColumns.length} columns`)
}

function downloadCSV(content: string, filename: string) {
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

function generateFilename(): string {
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0] // YYYY-MM-DD format
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-') // HH-MM-SS format
  return `orders-export-${dateStr}-${timeStr}.csv`
}
