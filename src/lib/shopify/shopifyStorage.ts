//file path: lib/shopify/shopifyStorage.ts

import { Order } from '@/app/dashboard/orders/utils/orderTypes';
import { Product } from '@/app/dashboard/products/utils/productTypes';

/**
 * Save Shopify order to localStorage
 */
export async function saveShopifyOrder(
  order: Order,
  accountId: string
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Get existing orders
    const ordersKey = `orderSync_orders_${accountId}`;
    const existingOrders = JSON.parse(
      localStorage.getItem(ordersKey) || '[]'
    ) as Order[];

    // Check if order already exists
    const existingIndex = existingOrders.findIndex(o => o.id === order.id);

    if (existingIndex >= 0) {
      // Update existing order
      existingOrders[existingIndex] = {
        ...existingOrders[existingIndex],
        ...order,
      };
    } else {
      // Add new order
      existingOrders.push(order);
    }

    // Save back to localStorage
    localStorage.setItem(ordersKey, JSON.stringify(existingOrders));
  } catch (error) {
    console.error('Error saving Shopify order:', error);
    throw error;
  }
}

/**
 * Save Shopify product to localStorage
 */
export async function saveShopifyProduct(
  product: Product,
  accountId: string
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Get existing products
    const productsKey = `products_${accountId}`;
    const existingProducts = JSON.parse(
      localStorage.getItem(productsKey) || '[]'
    ) as Product[];

    // Check if product already exists
    const existingIndex = existingProducts.findIndex(p => p.id === product.id);

    if (existingIndex >= 0) {
      // Update existing product
      existingProducts[existingIndex] = {
        ...existingProducts[existingIndex],
        ...product,
      };
    } else {
      // Add new product
      existingProducts.push(product);
    }

    // Save back to localStorage
    localStorage.setItem(productsKey, JSON.stringify(existingProducts));
  } catch (error) {
    console.error('Error saving Shopify product:', error);
    throw error;
  }
}

/**
 * Update order status
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
 * Update order fulfillment info
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

/**
 * Delete Shopify data for an account (when disconnecting)
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
    const productsKey = `products_${accountId}`;
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

/**
 * Get sync statistics
 */
export function getShopifySyncStats(accountId: string): {
  totalOrders: number;
  totalProducts: number;
  lastSyncDate?: Date;
} {
  const orders = getShopifyOrders(accountId);
  const products = getShopifyProducts(accountId);

  // Find most recent orderDate from orders (they all have orderDate)
  const orderDates = orders.map(o => new Date(o.orderDate)).filter(Boolean);
  const productDates = products.map(p => new Date(p.updatedAt)).filter(Boolean);

  const allDates = [...orderDates, ...productDates];

  const lastSyncDate = allDates.length > 0
    ? new Date(Math.max(...allDates.map(d => d.getTime())))
    : undefined;

  return {
    totalOrders: orders.length,
    totalProducts: products.length,
    lastSyncDate,
  };
}
