//file path: app/api/integrations/shopify/graphql-sync/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ShopifyGraphQLClient } from '@/lib/shopify/shopifyGraphQLClient';
import { transformGraphQLOrder, transformGraphQLProduct } from '@/lib/shopify/shopifyGraphQLTransform';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop, accessToken, accountId, syncType, warehouseId } = body;

    if (!shop || !accessToken || !accountId || !syncType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Initialize Shopify GraphQL client
    const client = new ShopifyGraphQLClient({
      shop,
      accessToken,
    });

    // Use shop name as store name
    const storeName = shop.replace('.myshopify.com', '');
    const storeId = `shopify-${accountId}`;

    if (syncType === 'orders') {
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
            storeName,
            warehouseId
          );
          orders.push(order);
        }

        // Pagination
        hasNextPage = response.pageInfo.hasNextPage;
        endCursor = response.pageInfo.endCursor;
      }

      return NextResponse.json({
        success: true,
        type: 'orders',
        count: orders.length,
        data: orders,
      });
    } else if (syncType === 'products') {
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

      return NextResponse.json({
        success: true,
        type: 'products',
        count: products.length,
        data: products,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid sync type. Must be "orders" or "products"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Shopify GraphQL sync error:', error);
    return NextResponse.json(
      {
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
