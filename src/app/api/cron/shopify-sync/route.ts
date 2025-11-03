//file path: src/app/api/cron/shopify-sync/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ShopifyGraphQLClient } from '@/lib/shopify/shopifyGraphQLClient';
import { transformGraphQLOrder, transformGraphQLProduct } from '@/lib/shopify/shopifyGraphQLTransform';
import {
  getConnectedShopifyStores,
  updateIntegrationConfig
} from '@/lib/storage/shopifyIntegrationHelpers';
import { saveOrder } from '@/lib/storage/orderStorageHelpers';
import { saveProduct, Product } from '@/lib/storage/productStorage';

/**
 * Cron Job for Shopify Sync
 * This should be called periodically (e.g., every 15 minutes) by a cron service
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
  const cronSecret = process.env.CRON_SECRET || 'your-secure-cron-secret-here';

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

  try {
    // Get all connected Shopify stores
    const shopifyIntegrations = getConnectedShopifyStores();

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

      // Ensure storeId exists
      const storeId = integration.storeId || integration.id || 'unknown';

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
        let ordersCount = 0;

        while (hasNextPage) {
          const response = await client.getOrders({
            first: 50,
            after: endCursor || undefined,
            query: syncQuery,
          });

          if (response.orders.length === 0) break;

          // Transform and save orders
          for (const graphqlOrder of response.orders) {
            const order = transformGraphQLOrder(
              graphqlOrder,
              storeId,
              config?.defaultWarehouseId
            );
            saveOrder(order);
            ordersCount++;
          }

          hasNextPage = response.pageInfo.hasNextPage;
          endCursor = response.pageInfo.endCursor;
        }

        storeResult.ordersSynced = ordersCount;
        console.log(`[Shopify Cron] ✅ Synced ${ordersCount} orders for ${shop}`);

        // Sync products
        console.log(`[Shopify Cron] 🏷️  Syncing products for ${shop}...`);
        hasNextPage = true;
        endCursor = null;
        let productsCount = 0;

        while (hasNextPage) {
          const response = await client.getProducts({
            first: 50,
            after: endCursor || undefined,
            query: syncQuery,
          });

          if (response.products.length === 0) break;

          // Transform and save products
          for (const graphqlProduct of response.products) {
            // Convert GraphQL product to simple Product format
            const product = transformToSimpleProduct(graphqlProduct, storeId);
            saveProduct(product);
            productsCount++;
          }

          hasNextPage = response.pageInfo.hasNextPage;
          endCursor = response.pageInfo.endCursor;
        }

        storeResult.productsSynced = productsCount;
        console.log(`[Shopify Cron] ✅ Synced ${productsCount} products for ${shop}`);

        // Update last sync time
        updateIntegrationConfig(integration.id, {
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
 * Transform GraphQL product to simple Product format (matches productStorage.ts)
 */
function transformToSimpleProduct(graphqlProduct: any, storeId: string): Product {
  const firstVariant = graphqlProduct.variants?.edges?.[0]?.node;

  return {
    id: `product-${graphqlProduct.id}`,
    externalId: graphqlProduct.id.toString(),
    storeId,
    platform: 'Shopify',
    name: graphqlProduct.title || 'Unknown Product',
    sku: firstVariant?.sku || graphqlProduct.id.toString(),
    barcode: firstVariant?.barcode || undefined,
    price: parseFloat(firstVariant?.price || '0'),
    quantity: firstVariant?.inventoryQuantity || 0,
    vendor: graphqlProduct.vendor || undefined,
    productType: graphqlProduct.productType || undefined,
    tags: graphqlProduct.tags || [],
    variants: (graphqlProduct.variants?.edges || []).map((edge: any) => ({
      id: edge.node.id.toString(),
      title: edge.node.title || '',
      sku: edge.node.sku || '',
      barcode: edge.node.barcode || '',
      price: parseFloat(edge.node.price || '0'),
      quantity: edge.node.inventoryQuantity || 0,
    })),
    createdAt: graphqlProduct.createdAt || new Date().toISOString(),
    updatedAt: graphqlProduct.updatedAt || new Date().toISOString(),
  };
}

/**
 * POST endpoint for manual triggering (useful for testing)
 */
export async function POST(request: NextRequest) {
  console.log('[Shopify Cron] Manual sync triggered via POST');
  return GET(request);
}
