//file path: lib/shopify/shopifyGraphQLHooks.ts

import { useState, useCallback, useEffect } from 'react';
import { ShopifyGraphQLClient } from './shopifyGraphQLClient';
import { transformGraphQLOrder, transformGraphQLProduct } from './shopifyGraphQLTransform';
import { getShopifySyncStats } from './shopifyStorage';
import { saveOrdersToStorage } from '@/lib/storage/orderStorage';
import { saveProductsToStorage } from '@/lib/storage/productStorage';
import { Order } from '@/app/dashboard/orders/utils/orderTypes';
import { Product } from '@/app/dashboard/products/utils/productTypes';

interface ShopifyConnection {
  shop: string;
  accessToken: string;
  isConnected: boolean;
}

/**
 * Hook for managing Shopify connection
 */
export function useShopifyConnection(accountId: string) {
  const [connection, setConnection] = useState<ShopifyConnection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load connection from localStorage
    const loadConnection = () => {
      try {
        const integrations = localStorage.getItem(`integrations_${accountId}`);
        if (integrations) {
          const parsed = JSON.parse(integrations);
          const shopifyConfig = parsed.find((i: any) => i.type === 'shopify');

          if (shopifyConfig?.config?.shop && shopifyConfig?.config?.accessToken) {
            setConnection({
              shop: shopifyConfig.config.shop,
              accessToken: shopifyConfig.config.accessToken,
              isConnected: true,
            });
          }
        }
      } catch (error) {
        console.error('Error loading Shopify connection:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConnection();
  }, [accountId]);

  const disconnect = useCallback(() => {
    setConnection(null);
    // Remove from localStorage
    try {
      const integrations = localStorage.getItem(`integrations_${accountId}`);
      if (integrations) {
        const parsed = JSON.parse(integrations);
        const filtered = parsed.filter((i: any) => i.type !== 'shopify');
        localStorage.setItem(`integrations_${accountId}`, JSON.stringify(filtered));
      }
    } catch (error) {
      console.error('Error disconnecting Shopify:', error);
    }
  }, [accountId]);

  return {
    connection,
    loading,
    disconnect,
  };
}

/**
 * Hook for syncing Shopify orders using GraphQL
 */
export function useShopifyOrderSync(accountId: string) {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { connection } = useShopifyConnection(accountId);

  const syncOrders = useCallback(async () => {
    if (!connection?.accessToken || !connection?.shop) {
      setError('Not connected to Shopify');
      return { success: false, count: 0 };
    }

    setSyncing(true);
    setError(null);
    setProgress(0);

    try {
      const client = new ShopifyGraphQLClient({
        shop: connection.shop,
        accessToken: connection.accessToken,
      });

      // Create store ID and name from shop
      const storeName = connection.shop.replace('.myshopify.com', '');
      const storeId = `shopify-${accountId}`;

      // Fetch orders with pagination
      let allOrders: Order[] = [];
      let hasNextPage = true;
      let endCursor: string | null = null;
      let pageCount = 0;

      while (hasNextPage) {
        const response = await client.getOrders({
          first: 50,
          after: endCursor || undefined,
        });

        if (response.orders.length === 0) {
          hasNextPage = false;
          break;
        }

        // Transform and save orders
        for (const graphqlOrder of response.orders) {
          const order = transformGraphQLOrder(graphqlOrder, storeId, storeName);
          allOrders.push(order);
        }

        // Update progress
        pageCount++;
        setProgress(Math.min(pageCount * 10, 90));

        // Update pagination
        hasNextPage = response.pageInfo.hasNextPage;
        endCursor = response.pageInfo.endCursor;
      }

      // ✅ FIXED: Save all orders at once
      if (allOrders.length > 0) {
        saveOrdersToStorage(allOrders, accountId);
      }

      setProgress(100);
      return { success: true, count: allOrders.length };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync orders';
      setError(errorMessage);
      return { success: false, count: 0 };
    } finally {
      setSyncing(false);
    }
  }, [connection, accountId]);

  return {
    syncOrders,
    syncing,
    progress,
    error,
  };
}

/**
 * Hook for syncing Shopify products using GraphQL
 */
export function useShopifyProductSync(accountId: string) {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { connection } = useShopifyConnection(accountId);

  const syncProducts = useCallback(async () => {
    if (!connection?.accessToken || !connection?.shop) {
      setError('Not connected to Shopify');
      return { success: false, count: 0 };
    }

    setSyncing(true);
    setError(null);
    setProgress(0);

    try {
      const client = new ShopifyGraphQLClient({
        shop: connection.shop,
        accessToken: connection.accessToken,
      });

      // Create store ID from shop
      const storeId = `shopify-${accountId}`;

      // Fetch products with pagination
      let allProducts: Product[] = [];
      let hasNextPage = true;
      let endCursor: string | null = null;
      let pageCount = 0;

      while (hasNextPage) {
        const response = await client.getProducts({
          first: 50,
          after: endCursor || undefined,
        });

        if (response.products.length === 0) {
          hasNextPage = false;
          break;
        }

        // Transform and save products
        for (const graphqlProduct of response.products) {
          const product = transformGraphQLProduct(graphqlProduct, storeId);
          allProducts.push(product);
        }

        // Update progress
        pageCount++;
        setProgress(Math.min(pageCount * 10, 90));

        // Update pagination
        hasNextPage = response.pageInfo.hasNextPage;
        endCursor = response.pageInfo.endCursor;
      }

      // ✅ FIXED: Save all products at once
      if (allProducts.length > 0) {
        saveProductsToStorage(allProducts, accountId);
      }

      setProgress(100);
      return { success: true, count: allProducts.length };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync products';
      setError(errorMessage);
      return { success: false, count: 0 };
    } finally {
      setSyncing(false);
    }
  }, [connection, accountId]);

  return {
    syncProducts,
    syncing,
    progress,
    error,
  };
}

/**
 * Hook for Shopify sync statistics
 */
export function useShopifySyncStats(accountId: string) {
  const [stats, setStats] = useState<{
    totalOrders: number;
    totalProducts: number;
    lastSyncDate?: Date | undefined;
  }>({
    totalOrders: 0,
    totalProducts: 0,
    lastSyncDate: undefined,
  });

  useEffect(() => {
    const updateStats = () => {
      const syncStats = getShopifySyncStats(accountId);
      setStats(syncStats);
    };

    updateStats();

    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, [accountId]);

  return stats;
}

/**
 * Hook for testing Shopify connection using GraphQL
 */
export function useShopifyConnectionTest(accountId: string) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const { connection } = useShopifyConnection(accountId);

  const testConnection = useCallback(async () => {
    if (!connection?.accessToken || !connection?.shop) {
      setResult({
        success: false,
        message: 'Not connected to Shopify',
      });
      return;
    }

    setTesting(true);
    setResult(null);

    try {
      const client = new ShopifyGraphQLClient({
        shop: connection.shop,
        accessToken: connection.accessToken,
      });

      const { success, shop } = await client.testConnection();

      if (success) {
        setResult({
          success: true,
          message: `Successfully connected to ${shop.name}`,
        });
      } else {
        setResult({
          success: false,
          message: 'Failed to connect to Shopify',
        });
      }
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : 'Connection test failed',
      });
    } finally {
      setTesting(false);
    }
  }, [connection]);

  return {
    testConnection,
    testing,
    result,
  };
}

/**
 * Hook for creating Shopify fulfillments using GraphQL
 */
export function useShopifyFulfillment(accountId: string) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { connection } = useShopifyConnection(accountId);

  const createFulfillment = useCallback(async (order: Order) => {
    if (!connection?.accessToken || !connection?.shop) {
      setError('Not connected to Shopify');
      return { success: false };
    }

    // Extract Shopify order ID from the order.id (format: "shopify-{id}")
    const shopifyOrderId = order.id.replace('shopify-', '');

    if (!shopifyOrderId || shopifyOrderId === order.id) {
      setError('Order does not have a valid Shopify order ID');
      return { success: false };
    }

    if (!order.trackingNumber) {
      setError('Order does not have a tracking number');
      return { success: false };
    }

    setCreating(true);
    setError(null);

    try {
      const client = new ShopifyGraphQLClient({
        shop: connection.shop,
        accessToken: connection.accessToken,
      });

      // Parse line items from JSON string
      const lineItems = order.lineItems ? JSON.parse(order.lineItems) : [];

      const fulfillment = await client.createFulfillment(shopifyOrderId, {
        trackingNumber: order.trackingNumber,
        trackingCompany: order.shippingLabel?.carrier || 'Other',
        notifyCustomer: true,
        lineItems: lineItems.map((item: any) => ({
          id: item.id.replace('shopify-line-', ''),
          quantity: item.quantity,
        })),
      });

      return { success: true, fulfillment };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create fulfillment';
      setError(errorMessage);
      return { success: false };
    } finally {
      setCreating(false);
    }
  }, [connection]);

  return {
    createFulfillment,
    creating,
    error,
  };
}
