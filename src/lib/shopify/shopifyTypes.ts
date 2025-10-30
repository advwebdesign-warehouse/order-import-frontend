//file path: src/lib/shopify/shopifyTypes.ts

import { OrderItem } from '@/app/dashboard/orders/utils/orderTypes'

/**
 * Shopify GraphQL Order Response Types
 */
export interface ShopifyGraphQLOrder {
  id: string
  name: string
  createdAt: string
  totalPriceSet: {
    shopMoney: {
      amount: string
      currencyCode: string
    }
  }
  customer?: {
    firstName?: string
    lastName?: string
    email?: string
  }
  displayFulfillmentStatus: string
  displayFinancialStatus: string
  shippingAddress?: {
    firstName?: string
    lastName?: string
    address1?: string
    address2?: string
    city?: string
    province?: string
    zip?: string
    country?: string
    countryCode?: string
    phone?: string
  }
  lineItems: {
    edges: Array<{
      node: {
        id: string
        title: string
        quantity: number
        variant?: {
          sku?: string
          weight?: number
          weightUnit?: string
        }
      }
    }>
  }
}

/**
 * Simplified type for line item weight calculations
 * This extends the existing OrderItem type from orderTypes.ts
 */
export type LineItemWithWeight = Pick<OrderItem, 'weight' | 'quantity'>

/**
 * Shopify OAuth Access Token Response
 */
export interface ShopifyAccessTokenResponse {
  access_token: string
  scope: string
}
