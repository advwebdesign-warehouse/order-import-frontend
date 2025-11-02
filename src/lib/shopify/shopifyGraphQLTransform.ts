//file path: lib/shopify/shopifyGraphQLTransform.ts

import { Order, OrderItem } from '@/app/dashboard/orders/utils/orderTypes';
import { Product, VariantAttribute } from '@/app/dashboard/products/utils/productTypes';
import { LineItemWithWeight } from './shopifyTypes'

/**
 * Transform GraphQL order to app Order format
 */
export function transformGraphQLOrder(
  graphqlOrder: any,
  storeId: string,
  storeName: string,
  warehouseId?: string
): Order {
  // Extract numeric ID from GraphQL global ID
  const orderId = graphqlOrder.id.split('/').pop();

  // Transform line items
  const lineItems = graphqlOrder.lineItems.edges.map((edge: any) => {
    const item = edge.node;
    const variantId = item.variant?.id?.split('/').pop() || '';

    // Weight: Set to 0 for now (ProductVariant weight fields not available in current API version)
    // TODO: Fetch weight from inventoryItem or product data if needed
    let weightOz = 0;

    return {
      id: `shopify-line-${item.id.split('/').pop()}`,
      name: item.name || item.title,
      sku: item.sku || '',
      quantity: item.quantity,
      price: parseFloat(item.originalUnitPriceSet.shopMoney.amount),
      currency: item.originalUnitPriceSet.shopMoney.currencyCode,
      variant: item.variantTitle || 'Default',
      weight: Math.round(weightOz * 100) / 100,
      meta: {
        color: '',
        size: '',
        material: '',
      },
    } as OrderItem;
  });

  // Calculate total weight in ounces
  const totalWeightOz = lineItems.reduce((sum: number, item: LineItemWithWeight) =>
    sum + (item.weight * item.quantity), 0
  )

  // Map fulfillment status
  const fulfillmentStatus = mapFulfillmentStatus(graphqlOrder.displayFulfillmentStatus);

  // Get shipping method
  const shippingLine = graphqlOrder.shippingLines.edges[0]?.node;
  const requestedShipping = shippingLine?.title || 'Standard Shipping';

  // Get first fulfillment for tracking info
  const fulfillment = graphqlOrder.fulfillments?.[0];
  const trackingInfo = fulfillment?.trackingInfo?.[0];

  // Create order object
  const order: Order = {
    id: `shopify-${orderId}`,
    orderNumber: graphqlOrder.name, // e.g., "#1001"
    customerName: graphqlOrder.customer
      ? `${graphqlOrder.customer.firstName} ${graphqlOrder.customer.lastName}`
      : graphqlOrder.shippingAddress
      ? `${graphqlOrder.shippingAddress.firstName} ${graphqlOrder.shippingAddress.lastName}`
      : 'Unknown Customer',
    customerEmail: graphqlOrder.email || graphqlOrder.customer?.email || '',
    totalAmount: parseFloat(graphqlOrder.totalPriceSet.shopMoney.amount),
    currency: graphqlOrder.currencyCode,
    status: mapFinancialStatus(graphqlOrder.displayFinancialStatus),
    fulfillmentStatus: fulfillmentStatus,
    platform: 'Shopify',
    storeId: storeId,
    storeName: storeName,
    orderDate: graphqlOrder.createdAt,
    itemCount: lineItems.reduce((sum: number, item: OrderItem) => sum + item.quantity, 0),
    shippingFirstName: graphqlOrder.shippingAddress?.firstName || '',
    shippingLastName: graphqlOrder.shippingAddress?.lastName || '',
    country: graphqlOrder.shippingAddress?.country || '',
    countryCode: graphqlOrder.shippingAddress?.countryCode || '',
    requestedShipping: requestedShipping,

    // Shipping address fields
    shippingAddress1: graphqlOrder.shippingAddress?.address1 || '',
    shippingAddress2: graphqlOrder.shippingAddress?.address2 || '',
    shippingCity: graphqlOrder.shippingAddress?.city || '',
    shippingProvince: graphqlOrder.shippingAddress?.province || '',
    shippingZip: graphqlOrder.shippingAddress?.zip || '',
    shippingCountry: graphqlOrder.shippingAddress?.country || '',
    shippingCountryCode: graphqlOrder.shippingAddress?.countryCode || '',
    shippingPhone: graphqlOrder.shippingAddress?.phone || '',

    // Line items as JSON string
    lineItems: JSON.stringify(lineItems),

    // Total weight
    totalWeight: Math.round(totalWeightOz * 100) / 100,

    // Tracking info
    trackingNumber: trackingInfo?.number || undefined,

    // Warehouse assignment (if provided)
    warehouseId: warehouseId,
  };

  return order;
}

/**
 * Transform GraphQL product to app Product format
 */
export function transformGraphQLProduct(
  graphqlProduct: any,
  storeId: string
): Product {
  // Extract numeric ID from GraphQL global ID
  const productId = graphqlProduct.id.split('/').pop();

  // Get primary variant (first one)
  const variants = graphqlProduct.variants.edges.map((edge: any) => edge.node);
  const primaryVariant = variants[0];

  // Determine stock status based on quantity
  const stockQuantity = primaryVariant?.inventoryQuantity || 0;
  const stockStatus: 'in_stock' | 'out_of_stock' | 'low_stock' | 'backorder' =
    stockQuantity > 10 ? 'in_stock' :
    stockQuantity > 0 ? 'low_stock' :
    'out_of_stock';

  // Convert weight to ounces
  let weightOz = 0;
  if (primaryVariant?.weight) {
    const unit = primaryVariant.weightUnit;
    if (unit === 'GRAMS') {
      weightOz = primaryVariant.weight / 28.3495;
    } else if (unit === 'KILOGRAMS') {
      weightOz = primaryVariant.weight * 35.274;
    } else if (unit === 'POUNDS') {
      weightOz = primaryVariant.weight * 16;
    } else if (unit === 'OUNCES') {
      weightOz = primaryVariant.weight;
    }
  }

  // Transform images
  const images = graphqlProduct.images.edges.map((edge: any, index: number) => {
    const img = edge.node;
    return {
      id: `shopify-image-${img.id.split('/').pop()}`,
      url: img.url,
      altText: img.altText || graphqlProduct.title,
      position: index,
      isMain: index === 0,
    };
  });

  // Transform variants
  const productVariants = variants.map((v: any) => {
    // Build attributes array from selected options
    const attributes: VariantAttribute[] = v.selectedOptions.map((opt: any) => ({
      name: opt.name,
      value: opt.value,
    }));

    const variantStockQuantity = v.inventoryQuantity || 0;
    const variantStockStatus: 'in_stock' | 'out_of_stock' | 'low_stock' | 'backorder' =
      variantStockQuantity > 10 ? 'in_stock' :
      variantStockQuantity > 0 ? 'low_stock' :
      'out_of_stock';

    // Convert variant weight to ounces
    let variantWeightOz = 0;
    if (v.weight) {
      const unit = v.weightUnit;
      if (unit === 'GRAMS') {
        variantWeightOz = v.weight / 28.3495;
      } else if (unit === 'KILOGRAMS') {
        variantWeightOz = v.weight * 35.274;
      } else if (unit === 'POUNDS') {
        variantWeightOz = v.weight * 16;
      } else if (unit === 'OUNCES') {
        variantWeightOz = v.weight;
      }
    }

    return {
      id: `shopify-variant-${v.id.split('/').pop()}`,
      name: v.title,
      sku: v.sku || '',
      price: parseFloat(v.price),
      comparePrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) : undefined,
      stockQuantity: variantStockQuantity,
      stockStatus: variantStockStatus,
      attributes: attributes,
      barcode: v.barcode || undefined,
      weight: variantWeightOz || undefined,
    };
  });

  return {
    id: `shopify-${productId}`,
    sku: primaryVariant?.sku || `SHOPIFY-${productId}`,
    name: graphqlProduct.title,
    description: graphqlProduct.description || '',
    type: variants.length > 1 ? 'variant' : 'simple',
    category: graphqlProduct.productType || 'Uncategorized',
    brand: graphqlProduct.vendor || '',
    vendor: graphqlProduct.vendor || '',
    price: parseFloat(primaryVariant?.price || '0'),
    comparePrice: primaryVariant?.compareAtPrice ? parseFloat(primaryVariant.compareAtPrice) : undefined,
    currency: 'USD',
    stockQuantity: stockQuantity,
    stockStatus: stockStatus,
    trackQuantity: true,
    weight: weightOz,
    dimensions: {
      length: 0,
      width: 0,
      height: 0,
      unit: 'in',
    },
    barcode: primaryVariant?.barcode || '',
    status: mapProductStatus(graphqlProduct.status),
    visibility: 'visible',
    images: images,
    tags: graphqlProduct.tags || [],
    variants: productVariants,
    createdAt: graphqlProduct.createdAt,
    updatedAt: graphqlProduct.updatedAt,
    publishedAt: graphqlProduct.publishedAt,
  };
}

/**
 * Map GraphQL fulfillment status to app format
 */
function mapFulfillmentStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'FULFILLED': 'fulfilled',
    'PARTIALLY_FULFILLED': 'partially_fulfilled',
    'UNFULFILLED': 'unfulfilled',
    'RESTOCKED': 'cancelled',
    'PENDING_FULFILLMENT': 'pending',
    'OPEN': 'unfulfilled',
    'IN_PROGRESS': 'processing',
    'ON_HOLD': 'on_hold',
    'SCHEDULED': 'scheduled',
  };

  return statusMap[status] || 'unfulfilled';
}

/**
 * Map GraphQL financial status to app order status
 */
function mapFinancialStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'PENDING': 'pending',
    'AUTHORIZED': 'processing',
    'PAID': 'paid',
    'PARTIALLY_PAID': 'partially_paid',
    'REFUNDED': 'refunded',
    'PARTIALLY_REFUNDED': 'partially_refunded',
    'VOIDED': 'cancelled',
    'EXPIRED': 'expired',
  };

  return statusMap[status] || status.toLowerCase();
}

/**
 * Map GraphQL product status to app format
 */
function mapProductStatus(status: string): 'active' | 'archived' | 'draft' | 'inactive' {
  const statusMap: Record<string, 'active' | 'archived' | 'draft' | 'inactive'> = {
    'ACTIVE': 'active',
    'DRAFT': 'draft',
    'ARCHIVED': 'archived',
  };

  return statusMap[status] || 'inactive';
}

/**
 * Batch transform GraphQL orders
 */
export function transformGraphQLOrders(
  graphqlOrders: any[],
  storeId: string,
  storeName: string,
  warehouseId?: string
): Order[] {
  return graphqlOrders.map(order =>
    transformGraphQLOrder(order, storeId, storeName, warehouseId)
  );
}

/**
 * Batch transform GraphQL products
 */
export function transformGraphQLProducts(
  graphqlProducts: any[],
  storeId: string
): Product[] {
  return graphqlProducts.map(product => transformGraphQLProduct(product, storeId));
}

/**
 * Transform internal order to GraphQL fulfillment input
 */
export function transformToGraphQLFulfillment(
  order: Order
): {
  trackingNumber?: string;
  trackingCompany?: string;
  trackingUrl?: string;
  notifyCustomer: boolean;
  lineItems?: Array<{
    id: string;
    quantity: number;
  }>;
} {
  // Parse line items from JSON string
  const lineItems = order.lineItems ? JSON.parse(order.lineItems) : [];

  return {
    trackingNumber: order.trackingNumber || undefined,
    trackingCompany: order.shippingLabel?.carrier || undefined,
    notifyCustomer: true,
    lineItems: lineItems.map((item: any) => ({
      id: item.id.replace('shopify-line-', ''),
      quantity: item.quantity,
    })),
  };
}
