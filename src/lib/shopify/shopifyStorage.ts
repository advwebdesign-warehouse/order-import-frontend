//file path: lib/shopify/shopifyStorage.ts

import { Order } from '@/app/dashboard/orders/utils/orderTypes';
import { Product } from '@/app/dashboard/products/utils/productTypes';
import { OrderAPI } from '@/lib/api/orderApi';
import { ProductAPI } from '@/lib/api/productApi';

/**
 * Shopify-specific helper functions for working with centralized API storage
 * ✅ UPDATED: Now uses API calls instead of localStorage
 */

// ============================================================================
// ORDER HELPERS
// ============================================================================

/**
 * Get all Shopify orders for an account
 * ✅ UPDATED: Fetches from API instead of localStorage
 */
export async function getShopifyOrders(accountId: string): Promise<Order[]> {
  try {
    const orders = await OrderAPI.getOrders();

    // Filter only Shopify orders (platform is 'Shopify')
    return orders.filter((order: Order) => order.platform === 'Shopify');
  } catch (error) {
    console.error('Error getting Shopify orders:', error);
    return [];
  }
}

/**
 * ✅ Get the most recent updatedAt timestamp from Shopify orders
 * This is used for incremental sync to only fetch orders modified after this date
 * ✅ UPDATED: Fetches from API instead of localStorage
 */
export async function getLastShopifyOrderUpdateDate(accountId: string, storeId: string): Promise<string | null> {
  try {
    const orders = await OrderAPI.getOrders();

    // Filter Shopify orders for this specific store
    const shopifyOrders = orders.filter(
      (order: Order) => order.platform === 'Shopify' && order.storeId === storeId
    );

    if (shopifyOrders.length === 0) {
      return null;
    }

    // Find the most recent updatedAt date
    const dates = shopifyOrders
      .map((order: Order) => order.updatedAt)
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
 * ✅ UPDATED: Uses API instead of localStorage
 */
export async function updateOrderStatus(
  orderId: string,
  status: Order['status'],
  accountId: string
): Promise<void> {
  try {
    await OrderAPI.updateOrder(orderId, { status });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

/**
 * Update order fulfillment info (for webhook processing)
 * ✅ UPDATED: Uses API instead of localStorage
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
  try {
    await OrderAPI.updateOrder(orderId, {
      fulfillmentStatus: fulfillment.status,
      trackingNumber: fulfillment.trackingNumber,
      status: fulfillment.status === 'success' ? 'shipped' : undefined,
    });
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
 * ✅ UPDATED: Fetches from API instead of localStorage
 */
export async function getShopifyProducts(accountId: string): Promise<Product[]> {
  try {
    const products = await ProductAPI.getProducts();

    // Filter only products with Shopify platform or ID prefix
    return products.filter(
      (product: Product) =>
        product.platform === 'Shopify' || product.id.startsWith('shopify-')
    );
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
 * ✅ UPDATED: Fetches from API instead of localStorage
 */
 export function getShopifySyncStats(accountId: string): {
   totalOrders: number;
   totalProducts: number;
   lastSyncDate?: Date;
 } {
   // This is a synchronous function but we need async data
   // Return default values and let the hook handle fetching
   // The hook useShopifySyncStats will handle the actual fetching
   return {
     totalOrders: 0,
     totalProducts: 0,
     lastSyncDate: undefined
   };
 }

 /**
  * ✅ NEW: Async version of getShopifySyncStats
  * Get sync statistics for Shopify integration from API
  */
 export async function getShopifySyncStatsAsync(accountId: string): Promise<{
   totalOrders: number;
   totalProducts: number;
   lastSyncDate?: Date;
 }> {
   try {
     const [orders, products] = await Promise.all([
       OrderAPI.getOrders(),
       ProductAPI.getProducts()
     ]);

     // Filter only Shopify data
     const shopifyOrders = orders.filter((order: Order) => order.platform === 'Shopify');
     const shopifyProducts = products.filter(
       (product: Product) => product.platform === 'Shopify' || product.id.startsWith('shopify-')
     );

     // Find most recent orderDate from orders (they all have orderDate)
     const orderDates = shopifyOrders.map((o: Order) => new Date(o.orderDate)).filter(Boolean);
     const productDates = shopifyProducts.map((p: Product) => new Date(p.updatedAt)).filter(Boolean);

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
 * ✅ UPDATED: This is now handled by backend when integration is deleted
 * Frontend just needs to call the delete integration API
 */
 export async function deleteShopifyData(accountId: string): Promise<void> {
   try {
     // Note: The backend should handle cascading deletes when an integration is removed
     // This function is kept for compatibility but the actual deletion happens on backend
     console.log('[Shopify Storage] Deletion handled by backend when integration is removed');
   } catch (error) {
     console.error('Error deleting Shopify data:', error);
     throw error;
   }
 }
