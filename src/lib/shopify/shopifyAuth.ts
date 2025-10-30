//file path: lib/shopify/shopifyAuth.ts

import crypto from 'crypto';

export interface ShopifyAuthConfig {
  clientId: string;
  clientSecret: string;
  scopes: string[];
  redirectUri: string;
}

export class ShopifyAuth {
  private config: ShopifyAuthConfig;

  constructor(config: ShopifyAuthConfig) {
    this.config = config;
  }

  /**
   * Generate OAuth authorization URL
   */
  generateAuthUrl(shop: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      scope: this.config.scopes.join(','),
      redirect_uri: this.config.redirectUri,
      state,
    });

    return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    shop: string,
    code: string
  ): Promise<{ access_token: string; scope: string }> {
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for token: ${error}`);
    }

    return response.json();
  }

  /**
   * Verify HMAC signature from Shopify
   */
  verifyHmac(query: Record<string, string>): boolean {
    const { hmac, ...params } = query;

    if (!hmac) {
      return false;
    }

    // Create message from query params (sorted)
    const message = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    // Generate HMAC
    const generatedHmac = crypto
      .createHmac('sha256', this.config.clientSecret)
      .update(message)
      .digest('hex');

    return generatedHmac === hmac;
  }

  /**
   * Generate random state for CSRF protection
   */
  static generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate shop domain
   */
  static validateShop(shop: string): boolean {
    const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
    return shopRegex.test(shop);
  }

  /**
   * Get required scopes for the app
   */
  static getRequiredScopes(): string[] {
    return [
      'read_orders',
      'write_orders',
      'read_products',
      'write_products',
      'read_inventory',
      'write_inventory',
      'read_fulfillments',
      'write_fulfillments',
      'read_shipping',
      'write_shipping',
    ];
  }
}

/**
 * Token storage interface for server-side
 */
export interface TokenStorage {
  saveToken(shop: string, token: string, accountId: string): Promise<void>;
  getToken(shop: string, accountId: string): Promise<string | null>;
  deleteToken(shop: string, accountId: string): Promise<void>;
}

/**
 * Simple in-memory token storage (for development only)
 * In production, use a proper database
 */
export class MemoryTokenStorage implements TokenStorage {
  private tokens: Map<string, { token: string; accountId: string }> = new Map();

  async saveToken(shop: string, token: string, accountId: string): Promise<void> {
    this.tokens.set(shop, { token, accountId });
  }

  async getToken(shop: string, accountId: string): Promise<string | null> {
    const data = this.tokens.get(shop);
    if (data && data.accountId === accountId) {
      return data.token;
    }
    return null;
  }

  async deleteToken(shop: string, accountId: string): Promise<void> {
    const data = this.tokens.get(shop);
    if (data && data.accountId === accountId) {
      this.tokens.delete(shop);
    }
  }
}

/**
 * LocalStorage-based token storage (client-side)
 */
export class LocalStorageTokenStorage implements TokenStorage {
  private getKey(shop: string, accountId: string): string {
    return `shopify_token_${accountId}_${shop}`;
  }

  async saveToken(shop: string, token: string, accountId: string): Promise<void> {
    if (typeof window === 'undefined') return;

    const key = this.getKey(shop, accountId);
    localStorage.setItem(key, JSON.stringify({
      token,
      timestamp: new Date().toISOString(),
    }));
  }

  async getToken(shop: string, accountId: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    const key = this.getKey(shop, accountId);
    const data = localStorage.getItem(key);

    if (!data) return null;

    try {
      const parsed = JSON.parse(data);
      return parsed.token;
    } catch {
      return null;
    }
  }

  async deleteToken(shop: string, accountId: string): Promise<void> {
    if (typeof window === 'undefined') return;

    const key = this.getKey(shop, accountId);
    localStorage.removeItem(key);
  }
}
