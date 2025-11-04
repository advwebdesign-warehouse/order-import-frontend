//file path: src/app/api/integrations/shopify/sync/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ShopifyGraphQLClient } from '@/lib/shopify/shopifyGraphQLClient';
import { transformGraphQLOrder, transformGraphQLProduct } from '@/lib/shopify/shopifyGraphQLTransform';
import { getLastShopifyOrderUpdateDate } from '@/lib/shopify/shopifyStorage';

/**
 * Shopify Sync API Route
 * ✅ UPDATED: Now supports incremental order sync using updatedAtMin parameter
 */
export async function POST(request: NextRequest) {
  console.log('=================================');
  console.log('🚀 SHOPIFY SYNC API ROUTE CALLED');
  console.log('=================================');

  try {
    const body = await request.json();
    const {
      shop,
      accessToken,
      accountId,
      syncType,
      warehouseId,
      storeId: providedStoreId,
      forceFullSync = false // ✅ NEW: Optional parameter to force full sync
    } = body;

    console.log('[Shopify Sync] Sync Type:', syncType);
    console.log('[Shopify Sync] Shop:', shop);
    console.log('[Shopify Sync] Account ID:', accountId);
    console.log('[Shopify Sync] Force Full Sync:', forceFullSync);

    if (!shop || !accessToken || !accountId || !syncType) {
      return NextResponse.json(
        { error: 'Missing required parameters: shop, accessToken, accountId, syncType' },
        { status: 400 }
      );
    }

    // Initialize Shopify GraphQL client
    const client = new ShopifyGraphQLClient({
      shop,
      accessToken,
    });

    // Use provided store info
    const storeId = providedStoreId || `shopify-${accountId}`;

    // ============================================================================
    // SYNC TYPE: ORDERS ONLY
    // ============================================================================
    if (syncType === 'orders') {
      console.log('[Shopify Sync] 🔥 Starting order sync...');

      // ✅ NEW: Get last sync date for incremental sync (unless force full sync)
      let updatedAtMin: string | null = null;
      let isIncremental = false;

      if (!forceFullSync) {
        updatedAtMin = getLastShopifyOrderUpdateDate(accountId, storeId);

        if (updatedAtMin) {
          isIncremental = true;
          console.log(`[Shopify Sync] 📅 Incremental sync: Fetching orders updated after ${updatedAtMin}`);
        } else {
          console.log('[Shopify Sync] 📦 Full sync: No previous sync date found');
        }
      } else {
        console.log('[Shopify Sync] 📦 Full sync: Force full sync requested');
      }

      // Sync orders with GraphQL pagination
      const orders = [];
      let hasNextPage = true;
      let endCursor: string | null = null;

      while (hasNextPage) {
        const response = await client.getOrders({
          first: 50,
          after: endCursor || undefined,
          updatedAtMin: updatedAtMin || undefined, // ✅ NEW: Pass date filter for incremental sync
        });

        if (response.orders.length === 0) {
          break;
        }

        // Transform orders
        for (const graphqlOrder of response.orders) {
          const order = transformGraphQLOrder(
            graphqlOrder,
            storeId,
            warehouseId
          );
          orders.push(order);
        }

        // Pagination
        hasNextPage = response.pageInfo.hasNextPage;
        endCursor = response.pageInfo.endCursor;
      }

      const syncTypeMsg = isIncremental ? 'Incremental sync' : 'Full sync';
      console.log(`[Shopify Sync] ✅ ${syncTypeMsg} complete: ${orders.length} orders ${isIncremental ? 'updated' : 'synced'}`);

      return NextResponse.json({
        success: true,
        orderCount: orders.length,
        isIncremental,
        data: {
          orders: orders,
        },
      });
    }

    // ============================================================================
    // SYNC TYPE: PRODUCTS ONLY
    // ============================================================================
    else if (syncType === 'products') {
      console.log('[Shopify Sync] 🔥 Starting product sync...');

      // ✅ FIXED: Sync products, not orders!
      const products = [];
      let hasNextPage = true;
      let endCursor: string | null = null;

      while (hasNextPage) {
        const response = await client.getProducts({
          first: 50,
          after: endCursor || undefined,
        });

        if (response.products.length === 0) {
          break;
        }

        // Transform products
        for (const graphqlProduct of response.products) {
          const product = transformGraphQLProduct(graphqlProduct, storeId);
          products.push(product);
        }

        // Pagination
        hasNextPage = response.pageInfo.hasNextPage;
        endCursor = response.pageInfo.endCursor;
      }

      console.log(`[Shopify Sync] ✅ Fetched ${products.length} products`);

      return NextResponse.json({
        success: true,
        productCount: products.length,
        data: {
          products: products,
        },
      });
    }

    // ============================================================================
    // SYNC TYPE: ALL (ORDERS + PRODUCTS)
    // ============================================================================
    else if (syncType === 'all') {
      console.log('[Shopify Sync] 🔥 Starting full sync (orders + products)...');

      // ✅ STEP 1: Sync orders with incremental support
      let updatedAtMin: string | null = null;
      let isIncremental = false;

      if (!forceFullSync) {
        updatedAtMin = getLastShopifyOrderUpdateDate(accountId, storeId);

        if (updatedAtMin) {
          isIncremental = true;
          console.log(`[Shopify Sync] 📅 Incremental sync: Fetching orders updated after ${updatedAtMin}`);
        } else {
          console.log('[Shopify Sync] 📦 Full sync: No previous sync date found');
        }
      } else {
        console.log('[Shopify Sync] 📦 Full sync: Force full sync requested');
      }

      const orders = [];
      let hasNextPage = true;
      let endCursor: string | null = null;

      while (hasNextPage) {
        const response = await client.getOrders({
          first: 50,
          after: endCursor || undefined,
          updatedAtMin: updatedAtMin || undefined,
        });

        if (response.orders.length === 0) {
          break;
        }

        for (const graphqlOrder of response.orders) {
          const order = transformGraphQLOrder(
            graphqlOrder,
            storeId,
            warehouseId
          );
          orders.push(order);
        }

        hasNextPage = response.pageInfo.hasNextPage;
        endCursor = response.pageInfo.endCursor;
      }

      const syncTypeMsg = isIncremental ? 'Incremental sync' : 'Full sync';
      console.log(`[Shopify Sync] ✅ ${syncTypeMsg} complete: ${orders.length} orders`);

      // ✅ STEP 2: Sync products
      console.log('[Shopify Sync] 🔥 Starting product sync...');

      const products = [];
      hasNextPage = true;
      endCursor = null;

      while (hasNextPage) {
        const response = await client.getProducts({
          first: 50,
          after: endCursor || undefined,
        });

        if (response.products.length === 0) {
          break;
        }

        for (const graphqlProduct of response.products) {
          const product = transformGraphQLProduct(graphqlProduct, storeId);
          products.push(product);
        }

        hasNextPage = response.pageInfo.hasNextPage;
        endCursor = response.pageInfo.endCursor;
      }

      console.log(`[Shopify Sync] ✅ Synced ${products.length} products`);

      return NextResponse.json({
        success: true,
        orderCount: orders.length,
        productCount: products.length,
        isIncremental, // ✅ NEW: Indicate if order sync was incremental
        data: {
          orders: orders,
          products: products,
        },
      });
    }

    // Invalid syncType
    return NextResponse.json(
      { error: 'Invalid syncType. Must be "orders", "products", or "all"' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[Shopify Sync] ❌ Sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Sync failed',
        message: 'Failed to sync data from Shopify'
      },
      { status: 500 }
    );
  }
}
