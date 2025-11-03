//file path: src/lib/shopify/shopifyWebhookRegistration.ts

/**
 * Shopify Webhook Registration Service
 * Handles webhook registration/unregistration for real-time updates
 */

export interface WebhookRegistrationConfig {
  shop: string;
  accessToken: string;
  webhookUrl: string; // Your app's webhook endpoint URL
}

export interface WebhookTopic {
  topic: string;
  address: string;
}

export class ShopifyWebhookRegistration {
  private shop: string;
  private accessToken: string;
  private apiVersion: string;
  private webhookUrl: string;

  constructor(config: WebhookRegistrationConfig) {
    this.shop = config.shop;
    this.accessToken = config.accessToken;
    this.webhookUrl = config.webhookUrl;
    this.apiVersion = '2025-10';
  }

  /**
   * Register all necessary webhooks for order and product updates
   */
  async registerAllWebhooks(): Promise<{ success: boolean; registered: string[]; errors: string[] }> {
    const webhooksToRegister = [
      'orders/create',
      'orders/updated',
      'orders/cancelled',
      'orders/fulfilled',
      'products/create',
      'products/update',
      'products/delete',
    ];

    const registered: string[] = [];
    const errors: string[] = [];

    console.log('[Webhook Registration] Starting registration for', this.shop);

    for (const topic of webhooksToRegister) {
      try {
        const result = await this.registerWebhook(topic);
        if (result.success) {
          registered.push(topic);
          console.log(`[Webhook Registration] ✅ Registered: ${topic}`);
        } else {
          errors.push(`${topic}: ${result.message}`);
          console.error(`[Webhook Registration] ❌ Failed: ${topic} - ${result.message}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${topic}: ${errorMsg}`);
        console.error(`[Webhook Registration] ❌ Error: ${topic} - ${errorMsg}`);
      }
    }

    return {
      success: registered.length > 0,
      registered,
      errors,
    };
  }

  /**
   * Register a single webhook topic
   */
  async registerWebhook(topic: string): Promise<{ success: boolean; message: string; webhookId?: string }> {
    try {
      // Check if webhook already exists
      const existing = await this.getWebhooks(topic);
      if (existing.length > 0) {
        console.log(`[Webhook Registration] Webhook already exists for ${topic}, updating...`);
        // Delete old ones and create new
        for (const webhook of existing) {
          await this.deleteWebhook(webhook.id);
        }
      }

      const mutation = `
        mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
          webhookSubscriptionCreate(
            topic: $topic
            webhookSubscription: $webhookSubscription
          ) {
            webhookSubscription {
              id
              topic
              endpoint {
                __typename
                ... on WebhookHttpEndpoint {
                  callbackUrl
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        topic: topic.toUpperCase().replace('/', '_'),
        webhookSubscription: {
          callbackUrl: `${this.webhookUrl}/${topic}`,
          format: 'JSON',
        },
      };

      const response = await this.request(mutation, variables);

      if (response.webhookSubscriptionCreate.userErrors.length > 0) {
        const errorMsg = response.webhookSubscriptionCreate.userErrors
          .map((e: any) => e.message)
          .join(', ');
        return { success: false, message: errorMsg };
      }

      return {
        success: true,
        message: 'Webhook registered successfully',
        webhookId: response.webhookSubscriptionCreate.webhookSubscription.id,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get existing webhooks for a topic
   */
  async getWebhooks(topic?: string): Promise<Array<{ id: string; topic: string; endpoint: string }>> {
    try {
      const query = `
        query {
          webhookSubscriptions(first: 50, topics: ${topic ? `[${topic.toUpperCase().replace('/', '_')}]` : '[]'}) {
            edges {
              node {
                id
                topic
                endpoint {
                  __typename
                  ... on WebhookHttpEndpoint {
                    callbackUrl
                  }
                }
              }
            }
          }
        }
      `;

      const response = await this.request(query);

      return response.webhookSubscriptions.edges.map((edge: any) => ({
        id: edge.node.id,
        topic: edge.node.topic,
        endpoint: edge.node.endpoint.callbackUrl,
      }));
    } catch (error) {
      console.error('[Webhook Registration] Failed to get webhooks:', error);
      return [];
    }
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<boolean> {
    try {
      const mutation = `
        mutation webhookSubscriptionDelete($id: ID!) {
          webhookSubscriptionDelete(id: $id) {
            deletedWebhookSubscriptionId
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = { id: webhookId };
      const response = await this.request(mutation, variables);

      return response.webhookSubscriptionDelete.userErrors.length === 0;
    } catch (error) {
      console.error('[Webhook Registration] Failed to delete webhook:', error);
      return false;
    }
  }

  /**
   * Delete all webhooks for this shop
   */
  async deleteAllWebhooks(): Promise<{ success: boolean; deleted: number }> {
    try {
      const webhooks = await this.getWebhooks();
      let deleted = 0;

      for (const webhook of webhooks) {
        const success = await this.deleteWebhook(webhook.id);
        if (success) deleted++;
      }

      return { success: true, deleted };
    } catch (error) {
      console.error('[Webhook Registration] Failed to delete all webhooks:', error);
      return { success: false, deleted: 0 };
    }
  }

  /**
   * Make GraphQL request to Shopify
   */
  private async request(query: string, variables?: Record<string, any>): Promise<any> {
    const endpoint = `https://${this.shop}/admin/api/${this.apiVersion}/graphql.json`;

    const response = await fetch(endpoint, {
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

    if (result.errors && result.errors.length > 0) {
      const errorMessages = result.errors.map((e: any) => e.message).join(', ');
      throw new Error(`GraphQL Error: ${errorMessages}`);
    }

    return result.data;
  }
}

/**
 * Helper function to register webhooks for a shop
 */
export async function registerShopifyWebhooks(
  shop: string,
  accessToken: string,
  webhookBaseUrl: string
): Promise<{ success: boolean; registered: string[]; errors: string[] }> {
  const registration = new ShopifyWebhookRegistration({
    shop,
    accessToken,
    webhookUrl: webhookBaseUrl,
  });

  return await registration.registerAllWebhooks();
}
