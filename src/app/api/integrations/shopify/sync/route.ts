//file path: src/app/api/integrations/shopify/sync/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ShopifyGraphQLClient } from '@/lib/shopify/shopifyGraphQLClient';
import { transformGraphQLOrder, transformGraphQLProduct } from '@/lib/shopify/shopifyGraphQLTransform';

export async function POST(request: NextRequest) {
  console.log('=================================');
  console.log('🚀 SHOPIFY SYNC API ROUTE CALLED');
  console.log('=================================');

  try {
    const body = await request.json();
    const { shop, accessToken, accountId, syncType, warehouseId, storeId: providedStoreId } = body;

    console.log('[Shopify Sync] Sync Type:', syncType);
    console.log('[Shopify Sync] Shop:', shop);
    console.log('[Shopify Sync] Account ID:', accountId);

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

    if (syncType === 'orders') {
      console.log('[Shopify Sync] 🔥 Starting order sync...');

      // Sync orders with GraphQL pagination
      const orders = [];
      let hasNextPage = true;
      let endCursor: string | null = null;

      while (hasNextPage) {
        const response = await client.getOrders({
          first: 50,
          after: endCursor || undefined,
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

      console.log(`[Shopify Sync] ✅ Fetched ${orders.length} orders`);

      return NextResponse.json({
        success: true,
        type: 'orders',
        count: orders.length,
        data: orders,
        message: `Successfully fetched ${orders.length} orders`,
      });

    } else if (syncType === 'products') {
      console.log('[Shopify Sync] 🔥 Starting product sync...');

      // Sync products with GraphQL pagination
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
        type: 'products',
        count: products.length,
        data: products,
        message: `Successfully fetched ${products.length} products`,
      });

    } else if (syncType === 'all') {
      console.log('[Shopify Sync] 🔥 Starting full sync (orders + products)...');

      // Sync orders
      const orders = [];
      let hasNextPage = true;
      let endCursor: string | null = null;

      while (hasNextPage) {
        const response = await client.getOrders({
          first: 50,
          after: endCursor || undefined,
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

      console.log(`[Shopify Sync] ✅ Fetched ${orders.length} orders`);

      // Sync products
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

      console.log(`[Shopify Sync] ✅ Fetched ${products.length} products`);

      return NextResponse.json({
        success: true,
        type: 'all',
        orderCount: orders.length,
        productCount: products.length,
        data: {
          orders,
          products,
        },
        message: `Successfully fetched ${orders.length} orders and ${products.length} products`,
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid sync type. Must be "orders", "products", or "all"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[Shopify Sync] ❌ Error:', error);
    console.error('[Shopify Sync] Error message:', error instanceof Error ? error.message : 'Unknown error');
    if (error instanceof Error) {
      console.error('[Shopify Sync] Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
