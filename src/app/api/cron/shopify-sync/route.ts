//file path: src/app/api/cron/shopify-sync/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ShopifyGraphQLClient } from '@/lib/shopify/shopifyGraphQLClient';
import { transformGraphQLOrder, transformGraphQLProduct } from '@/lib/shopify/shopifyGraphQLTransform';
import { Product } from '@/app/dashboard/products/utils/productTypes';

/**
 * Cron Job for Shopify Sync
 * This should be called periodically (e.g., every 15 minutes) by a cron service
 *
 * ✅ UPDATED: Now uses backend API instead of localStorage
 *
 * Setup options:
 * 1. Vercel Cron Jobs: Add to vercel.json
 * 2. External cron service (e.g., cron-job.org)
 * 3. GitHub Actions with scheduled workflow
 */
export async function GET(request: NextRequest) {
  console.log('=================================');
  console.log('⏰ SHOPIFY CRON SYNC STARTED');
  console.log('=================================');

  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error('[Shopify Cron] ❌ Unauthorized: Invalid or missing authorization');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const syncResults = {
    success: true,
    timestamp: new Date().toISOString(),
    stores: [] as any[],
    errors: [] as string[],
  };

  const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://gravityhub.co';

  try {
    // ✅ Get all connected Shopify stores from backend API
    const shopifyIntegrations = await getConnectedShopifyStores(API_BASE_URL);

    console.log(`[Shopify Cron] Found ${shopifyIntegrations.length} connected Shopify stores`);

    if (shopifyIntegrations.length === 0) {
      console.log('[Shopify Cron] No connected stores to sync');
      return NextResponse.json({
        ...syncResults,
        message: 'No connected Shopify stores found',
      });
    }

    // Sync each store
    for (const integration of shopifyIntegrations) {
      // Type the config as Shopify config
      const config = integration.config as any;

      // Ensure storeId and accountId exist
      const storeId = integration.storeId;
      const accountId = integration.accountId;
      const integrationId = integration.id;

      const storeResult = {
        storeId,
        shop: config?.storeUrl || 'unknown',
        ordersSynced: 0,
        productsSynced: 0,
        errors: [] as string[],
      };

      try {
        const shop = config?.storeUrl;
        const accessToken = config?.accessToken;

        if (!shop || !accessToken) {
          const error = `Missing shop or accessToken for store ${storeId}`;
          console.error('[Shopify Cron]', error);
          storeResult.errors.push(error);
          syncResults.errors.push(error);
          syncResults.stores.push(storeResult);
          continue;
        }

        console.log(`[Shopify Cron] 🔄 Syncing store: ${shop}`);

        // Initialize Shopify client
        const client = new ShopifyGraphQLClient({ shop, accessToken });

        // Get the last sync time from integration config
        const lastSyncTime = config?.lastSyncTime || null;
        const syncQuery = lastSyncTime
          ? `updated_at:>='${lastSyncTime}'`
          : undefined;

        // Sync orders
        console.log(`[Shopify Cron] 📦 Syncing orders for ${shop}...`);
        let hasNextPage = true;
        let endCursor: string | null = null;
        const ordersToSave: any[] = [];

        while (hasNextPage) {
          const response = await client.getOrders({
            first: 50,
            after: endCursor || undefined,
            query: syncQuery,
          });

          if (response.orders.length === 0) break;

          // Transform and save orders
          // ✅ FIXED: transformGraphQLOrder now only takes 2 parameters (graphqlOrder, storeId)
          // Warehouse assignment is handled by backend based on integration's warehouseConfig
          for (const graphqlOrder of response.orders) {
            const order = transformGraphQLOrder(
              graphqlOrder,
              storeId
            );
            ordersToSave.push(order);
          }

          hasNextPage = response.pageInfo.hasNextPage;
          endCursor = response.pageInfo.endCursor;
        }

        // ✅ Bulk save orders using internal API call
        if (ordersToSave.length > 0) {
          const response = await fetch(`${API_BASE_URL}/api/orders/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orders: ordersToSave, accountId })
          });

          if (!response.ok) {
            throw new Error(`Failed to save orders: ${response.statusText}`);
          }

          storeResult.ordersSynced = ordersToSave.length;
        }

        console.log(`[Shopify Cron] ✅ Synced ${ordersToSave.length} orders for ${shop}`);

        // Sync products
        console.log(`[Shopify Cron] 🏷️ Syncing products for ${shop}...`);
        hasNextPage = true;
        endCursor = null;
        const productsToSave: Product[] = [];

        while (hasNextPage) {
          const response = await client.getProducts({
            first: 50,
            after: endCursor || undefined,
            query: syncQuery,
          });

          if (response.products.length === 0) break;

          // Transform and save products
          for (const graphqlProduct of response.products) {
            const product = transformToSimpleProduct(graphqlProduct, integrationId);
            productsToSave.push(product);
          }

          hasNextPage = response.pageInfo.hasNextPage;
          endCursor = response.pageInfo.endCursor;
        }

        // ✅ Bulk save products using internal API call
        if (productsToSave.length > 0) {
          const response = await fetch(`${API_BASE_URL}/api/products/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products: productsToSave, accountId })
          });

          if (!response.ok) {
            throw new Error(`Failed to save products: ${response.statusText}`);
          }

          storeResult.productsSynced = productsToSave.length;
        }

        console.log(`[Shopify Cron] ✅ Synced ${productsToSave.length} products for ${shop}`);

        // Update last sync time
        await updateIntegrationConfig(API_BASE_URL, integration.id, {
          ...config,
          lastSyncTime: new Date().toISOString(),
        });

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Shopify Cron] ❌ Error syncing store ${storeResult.shop}:`, errorMsg);
        storeResult.errors.push(errorMsg);
        syncResults.errors.push(`${storeResult.shop}: ${errorMsg}`);
      }

      syncResults.stores.push(storeResult);
    }

    console.log('=================================');
    console.log('⏰ SHOPIFY CRON SYNC COMPLETED');
    console.log(`Total stores synced: ${syncResults.stores.length}`);
    console.log(`Total errors: ${syncResults.errors.length}`);
    console.log('=================================');

    return NextResponse.json({
      ...syncResults,
      message: `Synced ${syncResults.stores.length} stores`,
    });

  } catch (error) {
    console.error('[Shopify Cron] ❌ Fatal error:', error);
    return NextResponse.json(
      {
        ...syncResults,
        success: false,
        error: 'Cron sync failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Transform GraphQL product to simple Product format
 */
function transformToSimpleProduct(graphqlProduct: any, integrationId: string): Product {
  const firstVariant = graphqlProduct.variants?.edges?.[0]?.node;
  const allVariants = graphqlProduct.variants?.edges || [];

  // Calculate total inventory across all variants
  const totalInventory = allVariants.reduce((sum: number, edge: any) => {
    return sum + (edge.node.inventoryQuantity || 0);
  }, 0);

  return {
    // Required fields
    id: graphqlProduct.id.toString(),
    sku: firstVariant?.sku || graphqlProduct.id.toString(),
    name: graphqlProduct.title || 'Unknown Product',
    price: parseFloat(firstVariant?.price || '0'),
    currency: 'USD', // Default to USD, should be configurable per store
    stockQuantity: totalInventory,
    stockStatus: totalInventory > 0 ? 'in_stock' : 'out_of_stock',
    trackQuantity: true,
    type: 'simple',
    status: graphqlProduct.status === 'ACTIVE' ? 'active' : 'inactive',
    visibility: 'visible',
    tags: graphqlProduct.tags || [],
    images: (graphqlProduct.images?.edges || []).map((edge: any, index: number) => ({
      id: edge.node.id.toString(),
      url: edge.node.url || edge.node.src,
      altText: edge.node.altText || graphqlProduct.title,
      position: index,
      isMain: index === 0,
    })),
    createdAt: graphqlProduct.createdAt || new Date().toISOString(),
    updatedAt: graphqlProduct.updatedAt || new Date().toISOString(),

    // Integration relationship - links to Shopify integration
    integrationId,

    // Optional fields
    description: graphqlProduct.descriptionHtml || graphqlProduct.description || undefined,
    vendor: graphqlProduct.vendor || undefined,
    barcode: firstVariant?.barcode || undefined,
    category: graphqlProduct.productType || undefined,

    // Variants if product has multiple options
    variants: allVariants.length > 1 ? allVariants.map((edge: any) => ({
      id: edge.node.id.toString(),
      sku: edge.node.sku || edge.node.id.toString(),
      name: edge.node.title || edge.node.displayName || '',
      price: parseFloat(edge.node.price || '0'),
      comparePrice: edge.node.compareAtPrice ? parseFloat(edge.node.compareAtPrice) : undefined,
      stockQuantity: edge.node.inventoryQuantity || 0,
      stockStatus: (edge.node.inventoryQuantity || 0) > 0 ? 'in_stock' : 'out_of_stock',
      barcode: edge.node.barcode || undefined,
      weight: edge.node.weight || undefined,
      attributes: (edge.node.selectedOptions || []).map((opt: any) => ({
        name: opt.name,
        value: opt.value,
      })),
    })) : undefined,

    // Multi-warehouse stock - will be populated later when warehouse assignment happens
    warehouseStock: [],
  };
}

// ============================================================================
// ✅ HELPER FUNCTIONS - UPDATED TO USE BACKEND API
// ============================================================================

/**
 * Get all connected Shopify stores from backend API
 * Replaces localStorage-based getConnectedShopifyStores
 */
async function getConnectedShopifyStores(apiBaseUrl: string) {
  try {
    const response = await fetch(`${apiBaseUrl}/api/integrations?type=shopify`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch integrations: ${response.statusText}`);
    }

    const data = await response.json();

    // Filter for connected Shopify integrations
    const shopifyIntegrations = (data.integrations || []).filter((integration: any) => {
      return (
        integration.type === 'shopify' &&
        integration.status === 'connected' &&
        integration.enabled !== false
      );
    });

    return shopifyIntegrations;
  } catch (error) {
    console.error('[Shopify Cron] Error fetching connected stores:', error);
    return [];
  }
}

/**
 * Update integration config via backend API
 * Replaces localStorage-based updateIntegrationConfig
 */
async function updateIntegrationConfig(
  apiBaseUrl: string,
  integrationId: string,
  config: any
) {
  try {
    const response = await fetch(`${apiBaseUrl}/api/integrations/${integrationId}/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      throw new Error(`Failed to update integration config: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[Shopify Cron] ✅ Updated config for integration ${integrationId}`);
    return data;
  } catch (error) {
    console.error('[Shopify Cron] Error updating integration config:', error);
    throw error;
  }
}

/**
 * POST endpoint for manual triggering (useful for testing)
 */
export async function POST(request: NextRequest) {
  console.log('[Shopify Cron] Manual sync triggered via POST');
  return GET(request);
}
