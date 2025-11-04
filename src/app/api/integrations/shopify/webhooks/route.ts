//file path: src/app/api/integrations/shopify/webhooks/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ShopifyWebhooks } from '@/lib/shopify/shopifyWebhooks';
import { getIntegrationByShop } from '@/lib/storage/shopifyIntegrationHelpers';
import {
  getOrderByExternalId,
  saveOrder,
  updateOrder
} from '@/lib/storage/orderStorageHelpers';
import {
  getProductByExternalId,
  saveProduct,
  updateProduct,
  deleteProduct
} from '@/lib/storage/productStorage';
import { Product } from '@/app/dashboard/products/utils/productTypes';
import { Order } from '@/app/dashboard/orders/utils/orderTypes';

/**
 * Shopify Webhook Handler
 * Processes incoming webhooks from Shopify for real-time updates
 */
export async function POST(request: NextRequest) {
  console.log('=================================');
  console.log('🔔 SHOPIFY WEBHOOK RECEIVED');
  console.log('=================================');

  try {
    // Get raw body for HMAC verification
    const rawBody = await request.text();
    const hmac = request.headers.get('x-shopify-hmac-sha256');
    const topic = request.headers.get('x-shopify-topic');
    const shop = request.headers.get('x-shopify-shop-domain');

    console.log('[Shopify Webhook] Topic:', topic);
    console.log('[Shopify Webhook] Shop:', shop);
    console.log('[Shopify Webhook] Has HMAC:', !!hmac);

    // Verify webhook authenticity
    if (!hmac || !process.env.SHOPIFY_WEBHOOK_SECRET) {
      console.error('[Shopify Webhook] ❌ Missing HMAC or webhook secret');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const isValid = ShopifyWebhooks.verifyWebhook(
      rawBody,
      hmac,
      process.env.SHOPIFY_WEBHOOK_SECRET
    );

    if (!isValid) {
      console.error('[Shopify Webhook] ❌ HMAC verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log('[Shopify Webhook] ✅ HMAC verified');

    // Parse webhook data
    const data = JSON.parse(rawBody);

    // Get integration info from shop domain
    const integration = getIntegrationByShop(shop || '');

    if (!integration) {
      console.error('[Shopify Webhook] ❌ No integration found for shop:', shop);
      return NextResponse.json(
        { error: 'No integration found for this shop' },
        { status: 404 }
      );
    }

    // Ensure storeId is always a string
    const storeId = integration.storeId || integration.id || 'unknown';
    const integrationId = integration.id;
    const config = integration.config;
    const warehouseId = (config as any)?.defaultWarehouseId;

    console.log('[Shopify Webhook] Integration found:', {
      integrationId,
      storeId,
      warehouseId,
    });

    // Process webhook based on topic
    switch (topic) {
      case 'orders/create':
      case 'orders/updated':
        console.log('[Shopify Webhook] 📦 Processing order webhook:', data.id);
        await processOrderWebhook(data, storeId, warehouseId);
        break;

      case 'orders/cancelled':
        console.log('[Shopify Webhook] ❌ Processing order cancellation:', data.id);
        await processOrderCancellation(data, storeId);
        break;

      case 'orders/fulfilled':
        console.log('[Shopify Webhook] ✅ Processing order fulfillment:', data.id);
        await processOrderFulfillment(data, storeId);
        break;

      case 'products/create':
      case 'products/update':
        console.log('[Shopify Webhook] 🏷️  Processing product webhook:', data.id);
        await processProductWebhook(data, integrationId);
        break;

      case 'products/delete':
        console.log('[Shopify Webhook] 🗑️  Processing product deletion:', data.id);
        await processProductDeletion(data, integrationId);
        break;

      default:
        console.log('[Shopify Webhook] ⚠️  Unhandled topic:', topic);
    }

    console.log('[Shopify Webhook] ✅ Webhook processed successfully');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Shopify Webhook] ❌ Error:', error);
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Process order creation/update webhook
 */
async function processOrderWebhook(
  data: any,
  storeId: string,
  warehouseId?: string
): Promise<void> {
  try {
    // Check if order already exists
    const existingOrder = getOrderByExternalId(data.id.toString(), storeId);

    // Transform the webhook data to match our order format
    const order = transformWebhookOrderData(data, storeId, warehouseId);

    if (existingOrder) {
      console.log('[Webhook] Updating existing order:', order.id);
      updateOrder(existingOrder.id, order);
    } else {
      console.log('[Webhook] Creating new order:', order.id);
      saveOrder(order);
    }
  } catch (error) {
    console.error('[Webhook] Error processing order:', error);
    throw error;
  }
}

/**
 * Process order cancellation
 */
async function processOrderCancellation(data: any, storeId: string): Promise<void> {
  try {
    const existingOrder = getOrderByExternalId(data.id.toString(), storeId);

    if (existingOrder) {
      console.log('[Webhook] Marking order as cancelled:', existingOrder.id);
      updateOrder(existingOrder.id, {
        status: 'CANCELLED',
        fulfillmentStatus: 'CANCELLED',
      });
    }
  } catch (error) {
    console.error('[Webhook] Error processing cancellation:', error);
    throw error;
  }
}

/**
 * Process order fulfillment
 */
async function processOrderFulfillment(data: any, storeId: string): Promise<void> {
  try {
    const existingOrder = getOrderByExternalId(data.id.toString(), storeId);

    if (existingOrder) {
      console.log('[Webhook] Marking order as fulfilled:', existingOrder.id);
      updateOrder(existingOrder.id, {
        status: 'SHIPPED',
        fulfillmentStatus: 'SHIPPED',
      });
    }
  } catch (error) {
    console.error('[Webhook] Error processing fulfillment:', error);
    throw error;
  }
}

/**
 * Process product creation/update webhook
 */
async function processProductWebhook(data: any, integrationId: string): Promise<void> {
  try {
    // Transform webhook data to simple Product format
    const product = transformWebhookProductData(data, integrationId);

    // Check if product exists
    const existingProduct = getProductByExternalId(data.id.toString(), integrationId);

    if (existingProduct) {
      console.log('[Webhook] Updating existing product:', product.id);
      updateProduct(existingProduct.id, product);
    } else {
      console.log('[Webhook] Creating new product:', product.id);
      saveProduct(product);
    }
  } catch (error) {
    console.error('[Webhook] Error processing product:', error);
    throw error;
  }
}

/**
 * Process product deletion
 */
async function processProductDeletion(data: any, integrationId: string): Promise<void> {
  try {
    const existingProduct = getProductByExternalId(data.id.toString(), integrationId);

    if (existingProduct) {
      console.log('[Webhook] Deleting product:', existingProduct.id);
      deleteProduct(existingProduct.id);
    }
  } catch (error) {
    console.error('[Webhook] Error processing product deletion:', error);
    throw error;
  }
}

/**
 * Transform webhook order data to our internal format
 */
function transformWebhookOrderData(data: any, storeId: string, warehouseId?: string): Order {
  return {
    id: `order-${data.id}`,
    externalId: data.id.toString(),
    orderNumber: data.name || data.order_number?.toString() || data.id.toString(),
    storeId,
    warehouseId,
    platform: 'Shopify',
    customerName: data.customer
      ? `${data.customer.first_name || ''} ${data.customer.last_name || ''}`.trim()
      : 'Unknown',
    customerEmail: data.email || data.customer?.email || '',
    status: mapShopifyStatus(data.financial_status, data.fulfillment_status),
    fulfillmentStatus: mapFulfillmentStatus(data.fulfillment_status),
    totalAmount: parseFloat(data.total_price || '0'),
    currency: data.currency || 'USD',
    shippingFirstName: data.shipping_address?.first_name || '',
    shippingLastName: data.shipping_address?.last_name || '',
    country: data.shipping_address?.country || '',
    countryCode: data.shipping_address?.country_code || '',
    itemCount: (data.line_items || []).reduce((sum: number, item: any) => sum + (item.quantity || 0), 0),
    orderDate: data.created_at || new Date().toISOString(),
    updatedAt: data.updated_at || new Date().toISOString(),
  } as Order;
}

/**
 * Transform webhook product data to simple Product format (matches productStorage.ts)
 */
function transformWebhookProductData(data: any, integrationId: string): Product {
  const firstVariant = data.variants?.[0];
  const allVariants = data.variants || [];

  // Calculate total inventory across all variants
  const totalInventory = allVariants.reduce((sum: number, variant: any) => {
    return sum + (variant.inventory_quantity || 0);
  }, 0);

  return {
    // Required fields
    id: data.id.toString(),
    sku: firstVariant?.sku || data.id.toString(),
    name: data.title || 'Unknown Product',
    price: parseFloat(firstVariant?.price || '0'),
    currency: 'USD', // Default, should be configurable
    stockQuantity: totalInventory,
    stockStatus: totalInventory > 0 ? 'in_stock' : 'out_of_stock',
    trackQuantity: true,
    type: 'simple',
    status: data.status === 'active' ? 'active' : 'inactive',
    visibility: 'visible',
    tags: Array.isArray(data.tags)
      ? data.tags
      : (data.tags?.split(',').map((t: string) => t.trim()) || []),
    images: (data.images || []).map((img: any, index: number) => ({
      id: img.id?.toString() || `img-${index}`,
      url: img.src || img.url || '',
      altText: img.alt || data.title,
      position: img.position || index,
      isMain: index === 0,
    })),
    createdAt: data.created_at || new Date().toISOString(),
    updatedAt: data.updated_at || new Date().toISOString(),

    // Integration relationship - links to Shopify integration
    integrationId,

    // Optional fields
    description: data.body_html || data.description || undefined,
    vendor: data.vendor || undefined,
    barcode: firstVariant?.barcode || undefined,
    category: data.product_type || undefined,

    // Variants if product has multiple options
    variants: allVariants.length > 1 ? allVariants.map((variant: any) => ({
      id: variant.id.toString(),
      sku: variant.sku || variant.id.toString(),
      name: variant.title || '',
      price: parseFloat(variant.price || '0'),
      comparePrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : undefined,
      stockQuantity: variant.inventory_quantity || 0,
      stockStatus: (variant.inventory_quantity || 0) > 0 ? 'in_stock' : 'out_of_stock',
      barcode: variant.barcode || undefined,
      weight: variant.weight || undefined,
      attributes: (variant.option1 || variant.option2 || variant.option3) ? [
        variant.option1 ? { name: 'Option 1', value: variant.option1 } : null,
        variant.option2 ? { name: 'Option 2', value: variant.option2 } : null,
        variant.option3 ? { name: 'Option 3', value: variant.option3 } : null,
      ].filter(Boolean) as any : [],
    })) : undefined,

    // Multi-warehouse stock - will be populated later
    warehouseStock: [],
  };
}

/**
 * Map Shopify financial/fulfillment status to our internal status
 */
function mapShopifyStatus(financialStatus: string, fulfillmentStatus: string): string {
  if (fulfillmentStatus === 'fulfilled') return 'SHIPPED';
  if (financialStatus === 'refunded') return 'REFUNDED';
  if (financialStatus === 'paid') return 'PROCESSING';
  return 'PENDING';
}

/**
 * Map Shopify fulfillment status to our internal fulfillment status
 */
function mapFulfillmentStatus(fulfillmentStatus: string): string {
  const statusMap: Record<string, string> = {
    'fulfilled': 'SHIPPED',
    'partial': 'PROCESSING',
    'restocked': 'CANCELLED',
    'null': 'PENDING',
    'unfulfilled': 'PENDING',
  };
  return statusMap[fulfillmentStatus || 'null'] || 'PENDING';
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Shopify Webhooks',
    timestamp: new Date().toISOString(),
  });
}
