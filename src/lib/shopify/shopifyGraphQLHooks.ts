//file path: lib/shopify/shopifyGraphQLHooks.ts

import { useState, useCallback, useEffect } from 'react';
import { ShopifyGraphQLClient } from './shopifyGraphQLClient';
import { transformGraphQLOrder, transformGraphQLProduct } from './shopifyGraphQLTransform';
import { OrderAPI } from '@/lib/api/orderApi';
import { ProductAPI } from '@/lib/api/productApi';
import { IntegrationAPI } from '@/lib/api/integrationApi';
import { Order } from '@/app/dashboard/orders/utils/orderTypes';
import { Product } from '@/app/dashboard/products/utils/productTypes';

interface ShopifyConnection {
  shop: string;
  accessToken: string;
  isConnected: boolean;
  storeId: string;
}

/**
 * Hook for managing Shopify connection
 * ✅ UPDATED: Now fetches from API instead of localStorage
 */
export function useShopifyConnection(accountId: string) {
  const [connection, setConnection] = useState<ShopifyConnection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load connection from API
    const loadConnection = async () => {
      try {
        const integrations = await IntegrationAPI.getAccountIntegrations({
          type: 'ecommerce'
        });

        const shopifyIntegration = integrations.find(
          (i: any) => i.name === 'Shopify' && i.enabled
        );

        if (shopifyIntegration?.config?.shop && shopifyIntegration?.config?.accessToken) {
          setConnection({
            shop: shopifyIntegration.config.shop,
            accessToken: shopifyIntegration.config.accessToken,
            storeId: shopifyIntegration.storeId,
            isConnected: true,
          });
        }
      } catch (error) {
        console.error('Error loading Shopify connection:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConnection();
  }, [accountId]);

  const disconnect = useCallback(async () => {
    try {
      // Find Shopify integration
      const integrations = await IntegrationAPI.getAccountIntegrations({
        type: 'ecommerce'
      });

      const shopifyIntegration = integrations.find(
        (i: any) => i.name === 'Shopify'
      );

      if (shopifyIntegration) {
        await IntegrationAPI.deleteIntegration(shopifyIntegration.id);
      }

      setConnection(null);
    } catch (error) {
      console.error('Error disconnecting Shopify:', error);
    }
  }, []);

  return {
    connection,
    loading,
    disconnect,
  };
}

/**
 * Hook for syncing Shopify orders using GraphQL
 * ✅ UPDATED: Now saves to backend API instead of localStorage
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

      const storeId = connection.storeId;

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
          const order = transformGraphQLOrder(graphqlOrder, storeId);
          allOrders.push(order);
        }

        // Update progress
        pageCount++;
        setProgress(Math.min(pageCount * 10, 90));

        // Update pagination
        hasNextPage = response.pageInfo.hasNextPage;
        endCursor = response.pageInfo.endCursor;
      }

      // ✅ Save all orders to backend via API
      if (allOrders.length > 0) {
        await OrderAPI.saveOrders(allOrders);
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
 * ✅ UPDATED: Now saves to backend API instead of localStorage
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

      const storeId = connection.storeId;

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

      // ✅ Save all products to backend via API
      if (allProducts.length > 0) {
        await ProductAPI.saveProducts(allProducts);
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
 * ✅ UPDATED: Now fetches from backend API instead of localStorage
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
    const updateStats = async () => {
      try {
        // Fetch orders and products from API
        const [orders, products] = await Promise.all([
          OrderAPI.getOrders(),
          ProductAPI.getProducts()
        ]);

        // Filter only Shopify data
        const shopifyOrders = orders.filter((order: Order) => order.platform === 'Shopify');
        const shopifyProducts = products.filter((product: Product) =>
          product.id.startsWith('shopify-') || product.platform === 'Shopify'
        );

        // Find most recent date
        const orderDates = shopifyOrders.map((o: Order) => new Date(o.orderDate)).filter(Boolean);
        const productDates = shopifyProducts.map((p: Product) => new Date(p.updatedAt)).filter(Boolean);

        const allDates = [...orderDates, ...productDates];

        const lastSyncDate = allDates.length > 0
          ? new Date(Math.max(...allDates.map(d => d.getTime())))
          : undefined;

        setStats({
          totalOrders: shopifyOrders.length,
          totalProducts: shopifyProducts.length,
          lastSyncDate,
        });
      } catch (error) {
        console.error('Error fetching Shopify stats:', error);
      }
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

    // Extract Shopify order ID from the order.externalId
    const shopifyOrderId = order.externalId;

    if (!shopifyOrderId) {
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
