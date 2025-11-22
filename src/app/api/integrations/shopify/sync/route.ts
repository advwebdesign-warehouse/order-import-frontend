//file path: src/app/api/integrations/shopify/sync/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ShopifyGraphQLClient } from '@/lib/shopify/shopifyGraphQLClient';
import { transformGraphQLOrder, transformGraphQLProduct } from '@/lib/shopify/shopifyGraphQLTransform';
import { getLastShopifyOrderUpdateDate } from '@/lib/shopify/shopifyStorage';
import { OrderAPI } from '@/lib/api/orderApi';
import { ProductAPI } from '@/lib/api/productApi';

/**
 * Shopify Sync API Route
 * ✅ UPDATED: Now supports incremental order sync using updatedAtMin parameter
 * ✅ FIXED: Properly awaits async storage functions
 * ✅ UPDATED: Saves data to backend API instead of returning it
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
      forceFullSync = false // Optional parameter to force full sync
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
        updatedAtMin = await getLastShopifyOrderUpdateDate(accountId, storeId);

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
          updatedAtMin: updatedAtMin || undefined, // Pass date filter for incremental sync
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

      // ✅ Save orders to backend database via API
      if (orders.length > 0) {
        try {
          await OrderAPI.saveOrders(orders);
          console.log(`[Shopify Sync] ✅ Saved ${orders.length} orders to database`);
        } catch (saveError) {
          console.error('[Shopify Sync] ❌ Error saving orders:', saveError);
          return NextResponse.json({
            success: false,
            error: 'Failed to save orders to database',
            orderCount: orders.length,
            isIncremental
          }, { status: 500 });
        }
      }

      return NextResponse.json({
        success: true,
        orderCount: orders.length,
        isIncremental,
        message: `${syncTypeMsg}: ${orders.length} orders synced successfully`
      });
    }

    // ============================================================================
    // SYNC TYPE: PRODUCTS ONLY
    // ============================================================================
    else if (syncType === 'products') {
      console.log('[Shopify Sync] 🔥 Starting product sync...');

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

      // ✅ Save products to backend database via API
      if (products.length > 0) {
        try {
          await ProductAPI.saveProducts(products);
          console.log(`[Shopify Sync] ✅ Saved ${products.length} products to database`);
        } catch (saveError) {
          console.error('[Shopify Sync] ❌ Error saving products:', saveError);
          return NextResponse.json({
            success: false,
            error: 'Failed to save products to database',
            productCount: products.length
          }, { status: 500 });
        }
      }

      return NextResponse.json({
        success: true,
        productCount: products.length,
        message: `${products.length} products synced successfully`
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
        // ✅ FIXED: Properly await async function
        updatedAtMin = await getLastShopifyOrderUpdateDate(accountId, storeId);

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

      // ✅ Save orders to database
      if (orders.length > 0) {
        try {
          await OrderAPI.saveOrders(orders);
          console.log(`[Shopify Sync] ✅ Saved ${orders.length} orders to database`);
        } catch (saveError) {
          console.error('[Shopify Sync] ❌ Error saving orders:', saveError);
          // Continue with product sync even if order save fails
        }
      }

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

      // ✅ Save products to database
      if (products.length > 0) {
        try {
          await ProductAPI.saveProducts(products);
          console.log(`[Shopify Sync] ✅ Saved ${products.length} products to database`);
        } catch (saveError) {
          console.error('[Shopify Sync] ❌ Error saving products:', saveError);
          // Return partial success
        }
      }

      return NextResponse.json({
        success: true,
        orderCount: orders.length,
        productCount: products.length,
        isIncremental,
        message: `${syncTypeMsg}: ${orders.length} orders and ${products.length} products synced successfully`
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
