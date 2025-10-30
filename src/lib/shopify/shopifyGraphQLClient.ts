//file path: lib/shopify/shopifyGraphQLClient.ts

/**
 * Shopify GraphQL Admin API Client
 * API Version: 2025-10
 */

export interface ShopifyGraphQLConfig {
  shop: string;
  accessToken: string;
  apiVersion?: string;
}

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
        throw new Error(`GraphQL Error: ${errorMessages}`);
      }

      return result.data;
    } catch (error) {
      console.error('Shopify GraphQL request error:', error);
      throw error;
    }
  }

  /**
   * Test connection by fetching shop info
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
      throw new Error(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get orders with pagination
   */
  async getOrders(options: {
    first?: number;
    after?: string;
    query?: string;
  } = {}): Promise<{
    orders: any[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  }> {
    const { first = 50, after, query: searchQuery } = options;

    const queryStr = `
      query getOrders($first: Int!, $after: String, $query: String) {
        orders(first: $first, after: $after, query: $query) {
          edges {
            cursor
            node {
              id
              name
              email
              createdAt
              updatedAt
              currencyCode
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
                phone
              }
              shippingAddress {
                firstName
                lastName
                address1
                address2
                city
                province
                provinceCode
                country
                countryCode
                zip
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
                    weight {
                      value
                      unit
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
      query: searchQuery || null,
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
                    weight
                    weightUnit
                    requiresShipping
                    position
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
}
