//file path: lib/shopify/shopifyStorage.ts

import { Order } from '@/app/dashboard/orders/utils/orderTypes';
import { Product } from '@/app/dashboard/products/utils/productTypes';

/**
 * Shopify-specific helper functions for working with centralized storage
 * Note: For saving data, use saveOrdersToStorage() and saveProductsToStorage() from centralized storage
 */

// ============================================================================
// ORDER HELPERS
// ============================================================================

/**
 * Get all Shopify orders for an account
 */
export function getShopifyOrders(accountId: string): Order[] {
  if (typeof window === 'undefined') return [];

  try {
    const ordersKey = `orderSync_orders_${accountId}`;
    const orders = JSON.parse(
      localStorage.getItem(ordersKey) || '[]'
    ) as Order[];

    // Filter only Shopify orders (platform is 'Shopify')
    return orders.filter(order => order.platform === 'Shopify');
  } catch (error) {
    console.error('Error getting Shopify orders:', error);
    return [];
  }
}

/**
 * ✅ NEW: Get the most recent updatedAt timestamp from Shopify orders
 * This is used for incremental sync to only fetch orders modified after this date
 */
export function getLastShopifyOrderUpdateDate(accountId: string, storeId: string): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const ordersKey = `orderSync_orders_${accountId}`;
    const orders = JSON.parse(
      localStorage.getItem(ordersKey) || '[]'
    ) as Order[];

    // Filter Shopify orders for this specific store
    const shopifyOrders = orders.filter(
      order => order.platform === 'Shopify' && order.storeId === storeId
    );

    if (shopifyOrders.length === 0) {
      return null;
    }

    // Find the most recent updatedAt date
    const dates = shopifyOrders
      .map(order => order.updatedAt)
      .filter(Boolean) as string[];

    if (dates.length === 0) {
      return null;
    }

    // Return the most recent date
    const mostRecentDate = dates.reduce((latest, current) => {
      return new Date(current) > new Date(latest) ? current : latest;
    });

    return mostRecentDate;
  } catch (error) {
    console.error('Error getting last Shopify order update date:', error);
    return null;
  }
}

/**
 * Update order status (for webhook processing)
 */
export async function updateOrderStatus(
  orderId: string,
  status: Order['status'],
  accountId: string
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const ordersKey = `orderSync_orders_${accountId}`;
    const orders = JSON.parse(
      localStorage.getItem(ordersKey) || '[]'
    ) as Order[];

    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex >= 0) {
      orders[orderIndex] = {
        ...orders[orderIndex],
        status,
      };
      localStorage.setItem(ordersKey, JSON.stringify(orders));
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

/**
 * Update order fulfillment info (for webhook processing)
 */
export async function updateOrderFulfillment(
  orderId: string,
  fulfillment: {
    fulfillmentId: string;
    trackingNumber?: string;
    trackingCompany?: string;
    status: string;
  },
  accountId: string
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const ordersKey = `orderSync_orders_${accountId}`;
    const orders = JSON.parse(
      localStorage.getItem(ordersKey) || '[]'
    ) as Order[];

    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex >= 0) {
      orders[orderIndex] = {
        ...orders[orderIndex],
        fulfillmentStatus: fulfillment.status,
        trackingNumber: fulfillment.trackingNumber || orders[orderIndex].trackingNumber,
        status: fulfillment.status === 'success' ? 'shipped' : orders[orderIndex].status,
      };
      localStorage.setItem(ordersKey, JSON.stringify(orders));
    }
  } catch (error) {
    console.error('Error updating order fulfillment:', error);
    throw error;
  }
}

// ============================================================================
// PRODUCT HELPERS
// ============================================================================

/**
 * Get all Shopify products for an account
 */
export function getShopifyProducts(accountId: string): Product[] {
  if (typeof window === 'undefined') return [];

  try {
    const productsKey = `products_${accountId}`;
    const products = JSON.parse(
      localStorage.getItem(productsKey) || '[]'
    ) as Product[];

    // Filter only products with Shopify ID prefix
    return products.filter(product => product.id.startsWith('shopify-'));
  } catch (error) {
    console.error('Error getting Shopify products:', error);
    return [];
  }
}

// ============================================================================
// SYNC STATISTICS
// ============================================================================

/**
 * Get sync statistics for Shopify integration
 */
export function getShopifySyncStats(accountId: string): {
  totalOrders: number;
  totalProducts: number;
  lastSyncDate?: Date;
} {
  if (typeof window === 'undefined') {
    return {
      totalOrders: 0,
      totalProducts: 0,
      lastSyncDate: undefined
    };
  }

  try {
    // Read from centralized storage keys
    const ordersKey = `orderSync_orders_${accountId}`;
    const productsKey = `orderSync_products_${accountId}`;

    const orders = JSON.parse(localStorage.getItem(ordersKey) || '[]') as Order[];
    const products = JSON.parse(localStorage.getItem(productsKey) || '[]') as Product[];

    // Filter only Shopify data
    const shopifyOrders = orders.filter(order => order.platform === 'Shopify');
    const shopifyProducts = products.filter(product => product.id.startsWith('shopify-'));

    // Find most recent orderDate from orders (they all have orderDate)
    const orderDates = shopifyOrders.map(o => new Date(o.orderDate)).filter(Boolean);
    const productDates = shopifyProducts.map(p => new Date(p.updatedAt)).filter(Boolean);

    const allDates = [...orderDates, ...productDates];

    const lastSyncDate = allDates.length > 0
      ? new Date(Math.max(...allDates.map(d => d.getTime())))
      : undefined;

    return {
      totalOrders: shopifyOrders.length,
      totalProducts: shopifyProducts.length,
      lastSyncDate,
    };
  } catch (error) {
    console.error('Error getting Shopify sync stats:', error);
    return {
      totalOrders: 0,
      totalProducts: 0,
      lastSyncDate: undefined
    };
  }
}

// ============================================================================
// DATA MANAGEMENT
// ============================================================================

/**
 * Delete all Shopify data for an account (when disconnecting integration)
 */
export async function deleteShopifyData(accountId: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Get orders and remove Shopify orders
    const ordersKey = `orderSync_orders_${accountId}`;
    const orders = JSON.parse(
      localStorage.getItem(ordersKey) || '[]'
    ) as Order[];
    const nonShopifyOrders = orders.filter(order => order.platform !== 'Shopify');
    localStorage.setItem(ordersKey, JSON.stringify(nonShopifyOrders));

    // Get products and remove Shopify products
    const productsKey = `orderSync_products_${accountId}`;
    const products = JSON.parse(
      localStorage.getItem(productsKey) || '[]'
    ) as Product[];
    const nonShopifyProducts = products.filter(product => !product.id.startsWith('shopify-'));
    localStorage.setItem(productsKey, JSON.stringify(nonShopifyProducts));
  } catch (error) {
    console.error('Error deleting Shopify data:', error);
    throw error;
  }
}
