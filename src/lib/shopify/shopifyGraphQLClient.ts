//file path frontend: src/lib/shopify/shopifyGraphQLClient.ts
// ✅ BACKEND SERVICE - Shopify GraphQL API Client
// Added updateOrderFulfillment method for syncing status back to Shopify

/**
 * Shopify GraphQL Admin API Client (Backend)
 * API Version: 2025-01
 *
 * This is the BACKEND version - does NOT use frontend types
 * Makes direct HTTP requests to Shopify GraphQL API
 */

export interface ShopifyGraphQLConfig {
  shop: string;
  accessToken: string;
  apiVersion?: string;
}

// ✅ Custom error classes for better error handling
export class ShopifyPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShopifyPermissionError';
  }
}

export class ShopifyGraphQLError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShopifyGraphQLError';
  }
}

// ✅ Status mapping from GravityHub to Shopify
export const FULFILLMENT_STATUS_MAP: Record<string, string> = {
  'PENDING': 'UNFULFILLED',
  'PROCESSING': 'IN_PROGRESS',
  'PICKING': 'IN_PROGRESS',
  'PACKING': 'IN_PROGRESS',
  'PACKED': 'IN_PROGRESS',
  'READY_TO_SHIP': 'IN_PROGRESS',
  'SHIPPED': 'FULFILLED',
  'DELIVERED': 'FULFILLED',
  'CANCELLED': 'UNFULFILLED'
};

export class ShopifyGraphQLClient {
  private shop: string;
  private accessToken: string;
  private apiVersion: string;
  private endpoint: string;

  constructor(config: ShopifyGraphQLConfig) {
    this.shop = config.shop;
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion || '2025-10';
    this.endpoint = `https://${this.shop}/admin/api/${this.apiVersion}/graphql.json`;
  }

  /**
   * Execute a GraphQL query or mutation
   */
  async request<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': this.accessToken,
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      // Check for GraphQL errors
      if (result.errors && result.errors.length > 0) {
        const errorMessages = result.errors.map((e: any) => e.message).join(', ');

        // ✅ Check for permission errors specifically
        if (errorMessages.includes('not approved to access') ||
            errorMessages.includes('protected customer data') ||
            errorMessages.includes('access scope')) {
          throw new ShopifyPermissionError(
            `Shopify app requires additional permissions: ${errorMessages}\n\n` +
            `Please ensure your app has been approved for protected customer data access. ` +
            `Visit: https://shopify.dev/docs/apps/launch/protected-customer-data`
          );
        }

        throw new ShopifyGraphQLError(`GraphQL Error: ${errorMessages}`);
      }

      return result.data;
    } catch (error) {
      // ✅ Re-throw our custom errors without logging
      if (error instanceof ShopifyPermissionError || error instanceof ShopifyGraphQLError) {
        throw error;
      }

      console.error('Shopify GraphQL request error:', error);
      throw error;
    }
  }

  /**
   * Test connection by fetching shop info
   * Propagate permission errors properly
   */
  async testConnection(): Promise<{
    success: boolean;
    shop: {
      id: string;
      name: string;
      email: string;
      currencyCode: string;
    };
  }> {
    const query = `
      query {
        shop {
          id
          name
          email
          currencyCode
        }
      }
    `;

    try {
      const data = await this.request<{ shop: any }>(query);
      return {
        success: true,
        shop: data.shop,
      };
    } catch (error) {
      // ✅ Propagate permission errors
      if (error instanceof ShopifyPermissionError) {
        throw error;
      }
      throw new Error(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get orders with pagination
   * ✅ Added updatedAtMin parameter for incremental sync
   */
  async getOrders(options: {
    first?: number;
    after?: string;
    query?: string;
    updatedAtMin?: string; // ✅ ISO 8601 date string for incremental sync
  } = {}): Promise<{
    orders: any[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  }> {
    const { first = 50, after, query: searchQuery, updatedAtMin } = options;

    // ✅ Build query string with date filter if provided
    let finalQuery = searchQuery || '';
    if (updatedAtMin) {
      const dateFilter = `updated_at:>='${updatedAtMin}'`;
      finalQuery = finalQuery ? `${finalQuery} AND ${dateFilter}` : dateFilter;
    }

    const queryStr = `
      query getOrders($first: Int!, $after: String, $query: String) {
        orders(first: $first, after: $after, query: $query) {
          edges {
            cursor
            node {
              id
              name
              createdAt
              updatedAt
              currencyCode
              email
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              subtotalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              totalTaxSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              totalShippingPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              displayFulfillmentStatus
              displayFinancialStatus
              customer {
                id
                email
                firstName
                lastName
              }
              shippingAddress {
                firstName
                lastName
                address1
                address2
                city
                province
                zip
                country
                countryCode
                phone
              }
              lineItems(first: 250) {
                edges {
                  node {
                    id
                    title
                    name
                    sku
                    variantTitle
                    quantity
                    originalUnitPriceSet {
                      shopMoney {
                        amount
                        currencyCode
                      }
                    }
                    product {
                      id
                    }
                    variant {
                      id
                    }
                  }
                }
              }
              shippingLines(first: 5) {
                edges {
                  node {
                    id
                    title
                    originalPriceSet {
                      shopMoney {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
              fulfillments(first: 10) {
                id
                status
                trackingInfo(first: 5) {
                  company
                  number
                  url
                }
              }
              note
              tags
              totalWeight
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const variables = {
      first,
      after: after || null,
      query: finalQuery || null,  // Use finalQuery which has the date filter
    };

    const data = await this.request<{ orders: any }>(queryStr, variables);

    return {
      orders: data.orders.edges.map((edge: any) => edge.node),
      pageInfo: data.orders.pageInfo,
    };
  }

  /**
   * Get products with pagination
   */
  async getProducts(options: {
    first?: number;
    after?: string;
    query?: string;
  } = {}): Promise<{
    products: any[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  }> {
    const { first = 50, after, query: searchQuery } = options;

    const queryStr = `
      query getProducts($first: Int!, $after: String, $query: String) {
        products(first: $first, after: $after, query: $query) {
          edges {
            cursor
            node {
              id
              title
              description
              descriptionHtml
              vendor
              productType
              status
              createdAt
              updatedAt
              publishedAt
              tags
              seo {
                title
                description
              }
              variants(first: 100) {
                edges {
                  node {
                    id
                    title
                    sku
                    barcode
                    price
                    compareAtPrice
                    weight
                    weightUnit
                    inventoryQuantity
                    position
                    image {
                      url
                    }
                    inventoryItem {
                      id
                      unitCost {
                        amount
                        currencyCode
                      }
                    }
                    selectedOptions {
                      name
                      value
                    }
                  }
                }
              }
              images(first: 10) {
                edges {
                  node {
                    id
                    url
                    altText
                    width
                    height
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const variables = {
      first,
      after: after || null,
      query: searchQuery || null,
    };

    const data = await this.request<{ products: any }>(queryStr, variables);

    return {
      products: data.products.edges.map((edge: any) => edge.node),
      pageInfo: data.products.pageInfo,
    };
  }

  /**
   * Create a fulfillment for an order
   * Note: In GraphQL, you need to use fulfillmentOrders
   */
  async createFulfillment(
    orderId: string,
    fulfillmentData: {
      trackingNumber?: string;
      trackingCompany?: string;
      trackingUrl?: string;
      notifyCustomer?: boolean;
      lineItems?: Array<{
        id: string;
        quantity: number;
      }>;
    }
  ): Promise<any> {
    // First, get the fulfillment orders for this order
    const fulfillmentOrdersQuery = `
      query getFulfillmentOrders($orderId: ID!) {
        order(id: $orderId) {
          id
          fulfillmentOrders(first: 10) {
            edges {
              node {
                id
                status
                lineItems(first: 250) {
                  edges {
                    node {
                      id
                      remainingQuantity
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const orderData = await this.request<{ order: any }>(
      fulfillmentOrdersQuery,
      { orderId: `gid://shopify/Order/${orderId}` }
    );

    // Find the open fulfillment order
    const fulfillmentOrder = orderData.order.fulfillmentOrders.edges
      .find((edge: any) => edge.node.status === 'OPEN')?.node;

    if (!fulfillmentOrder) {
      throw new Error('No open fulfillment order found');
    }

    // Create the fulfillment
    const mutation = `
      mutation fulfillmentCreateV2($fulfillment: FulfillmentV2Input!) {
        fulfillmentCreateV2(fulfillment: $fulfillment) {
          fulfillment {
            id
            status
            trackingInfo {
              company
              number
              url
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const lineItemsInput = fulfillmentData.lineItems
      ? fulfillmentData.lineItems.map(item => ({
          fulfillmentOrderLineItemId: `gid://shopify/FulfillmentOrderLineItem/${item.id}`,
          quantity: item.quantity,
        }))
      : fulfillmentOrder.lineItems.edges.map((edge: any) => ({
          fulfillmentOrderLineItemId: edge.node.id,
          quantity: edge.node.remainingQuantity,
        }));

    const variables = {
      fulfillment: {
        lineItemsByFulfillmentOrder: [
          {
            fulfillmentOrderId: fulfillmentOrder.id,
            fulfillmentOrderLineItems: lineItemsInput,
          },
        ],
        notifyCustomer: fulfillmentData.notifyCustomer ?? true,
        trackingInfo: fulfillmentData.trackingNumber
          ? {
              company: fulfillmentData.trackingCompany || 'Other',
              number: fulfillmentData.trackingNumber,
              url: fulfillmentData.trackingUrl,
            }
          : undefined,
      },
    };

    const result = await this.request<{ fulfillmentCreateV2: any }>(mutation, variables);

    if (result.fulfillmentCreateV2.userErrors.length > 0) {
      const errors = result.fulfillmentCreateV2.userErrors.map((e: any) => e.message).join(', ');
      throw new Error(`Fulfillment creation failed: ${errors}`);
    }

    return result.fulfillmentCreateV2.fulfillment;
  }

  /**
   * ✅ NEW: Get fulfillment orders for an order (to check current status)
   */
  async getFulfillmentOrders(orderId: string): Promise<{
    orderId: string;
    fulfillmentOrders: Array<{
      id: string;
      status: string;
      lineItems: Array<{
        id: string;
        remainingQuantity: number;
        totalQuantity: number;
      }>;
    }>;
    fulfillments: Array<{
      id: string;
      status: string;
      trackingInfo: Array<{
        company: string;
        number: string;
        url: string;
      }>;
    }>;
  }> {
    const orderGid = orderId.startsWith('gid://')
      ? orderId
      : `gid://shopify/Order/${orderId}`;

    const query = `
      query getFulfillmentOrders($orderId: ID!) {
        order(id: $orderId) {
          id
          displayFulfillmentStatus
          fulfillmentOrders(first: 10) {
            edges {
              node {
                id
                status
                lineItems(first: 250) {
                  edges {
                    node {
                      id
                      remainingQuantity
                      totalQuantity
                    }
                  }
                }
              }
            }
          }
          fulfillments(first: 10) {
            id
            status
            trackingInfo(first: 5) {
              company
              number
              url
            }
          }
        }
      }
    `;

    const data = await this.request<{ order: any }>(query, { orderId: orderGid });

    if (!data.order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    return {
      orderId: data.order.id,
      fulfillmentOrders: data.order.fulfillmentOrders.edges.map((edge: any) => ({
        id: edge.node.id,
        status: edge.node.status,
        lineItems: edge.node.lineItems.edges.map((li: any) => ({
          id: li.node.id,
          remainingQuantity: li.node.remainingQuantity,
          totalQuantity: li.node.totalQuantity,
        })),
      })),
      fulfillments: data.order.fulfillments.map((f: any) => ({
        id: f.id,
        status: f.status,
        trackingInfo: f.trackingInfo || [],
      })),
    };
  }

  /**
   * ✅ NEW: Cancel a fulfillment (revert to unfulfilled)
   * Use when changing status back from SHIPPED to something earlier
   */
  async cancelFulfillment(fulfillmentId: string): Promise<any> {
    const fulfillmentGid = fulfillmentId.startsWith('gid://')
      ? fulfillmentId
      : `gid://shopify/Fulfillment/${fulfillmentId}`;

    const mutation = `
      mutation fulfillmentCancel($id: ID!) {
        fulfillmentCancel(id: $id) {
          fulfillment {
            id
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const result = await this.request<{ fulfillmentCancel: any }>(mutation, { id: fulfillmentGid });

    if (result.fulfillmentCancel.userErrors.length > 0) {
      const errors = result.fulfillmentCancel.userErrors.map((e: any) => e.message).join(', ');
      throw new Error(`Fulfillment cancel failed: ${errors}`);
    }

    return result.fulfillmentCancel.fulfillment;
  }

  /**
   * ✅ NEW: Add tags to an order (can be used to track status in Shopify)
   */
  async addOrderTags(orderId: string, tags: string[]): Promise<any> {
    const orderGid = orderId.startsWith('gid://')
      ? orderId
      : `gid://shopify/Order/${orderId}`;

    const mutation = `
      mutation tagsAdd($id: ID!, $tags: [String!]!) {
        tagsAdd(id: $id, tags: $tags) {
          node {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const result = await this.request<{ tagsAdd: any }>(mutation, {
      id: orderGid,
      tags,
    });

    if (result.tagsAdd.userErrors.length > 0) {
      const errors = result.tagsAdd.userErrors.map((e: any) => e.message).join(', ');
      throw new Error(`Add tags failed: ${errors}`);
    }

    return result.tagsAdd.node;
  }

  /**
   * ✅ NEW: Update order note (can include status info)
   */
  async updateOrderNote(orderId: string, note: string): Promise<any> {
    const orderGid = orderId.startsWith('gid://')
      ? orderId
      : `gid://shopify/Order/${orderId}`;

    const mutation = `
      mutation orderUpdate($input: OrderInput!) {
        orderUpdate(input: $input) {
          order {
            id
            note
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const result = await this.request<{ orderUpdate: any }>(mutation, {
      input: {
        id: orderGid,
        note,
      },
    });

    if (result.orderUpdate.userErrors.length > 0) {
      const errors = result.orderUpdate.userErrors.map((e: any) => e.message).join(', ');
      throw new Error(`Order update failed: ${errors}`);
    }

    return result.orderUpdate.order;
  }

  /**
   * Get a single order by ID
   */
  async getOrder(orderId: string): Promise<any | null> {
    const orderGid = orderId.startsWith('gid://')
      ? orderId
      : `gid://shopify/Order/${orderId}`;

    const query = `
      query getOrder($id: ID!) {
        order(id: $id) {
          id
          name
          createdAt
          updatedAt
          currencyCode
          email
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          displayFulfillmentStatus
          displayFinancialStatus
          customer {
            id
            email
            firstName
            lastName
          }
          shippingAddress {
            firstName
            lastName
            address1
            address2
            city
            province
            zip
            country
            countryCode
            phone
          }
          lineItems(first: 250) {
            edges {
              node {
                id
                title
                name
                sku
                variantTitle
                quantity
                originalUnitPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
          fulfillments(first: 10) {
            id
            status
            trackingInfo(first: 5) {
              company
              number
              url
            }
          }
        }
      }
    `;

    const data = await this.request<{ order: any | null }>(query, { id: orderGid });
    return data.order;
  }

  /**
   * Get a single product by ID
   */
  async getProduct(productId: string): Promise<any | null> {
    const productGid = productId.startsWith('gid://')
      ? productId
      : `gid://shopify/Product/${productId}`;

    const query = `
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          title
          description
          descriptionHtml
          vendor
          productType
          status
          createdAt
          updatedAt
          publishedAt
          tags
          variants(first: 100) {
            edges {
              node {
                id
                title
                sku
                barcode
                price
                compareAtPrice
                inventoryQuantity
              }
            }
          }
          images(first: 10) {
            edges {
              node {
                id
                url
                altText
              }
            }
          }
        }
      }
    `;

    const data = await this.request<{ product: any | null }>(query, { id: productGid });
    return data.product;
  }
}
