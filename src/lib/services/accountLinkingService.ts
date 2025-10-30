//file path: lib/services/accountLinkingService.ts

/**
 * Account Linking Service
 * Handles users coming from both Shopify App Store and direct web app signup
 */

export interface Account {
  id: string
  email: string
  name: string
  createdAt: string

  // Subscription info
  subscription: {
    plan: 'free' | 'starter' | 'professional' | 'enterprise'
    status: 'active' | 'cancelled' | 'past_due' | 'trial'
    billingProvider: 'shopify' | 'stripe' | 'none'
    shopifyChargeId?: string      // If paying via Shopify
    stripeCustomerId?: string      // If paying via Stripe
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
  }

  // Integration tracking
  integrations: {
    shopify: string[]      // Array of shop domains
    woocommerce: string[]  // Array of store URLs
    etsy: string[]
    ebay: string[]
  }

  // Acquisition channel
  acquisitionChannel: 'shopify_app_store' | 'direct_signup' | 'referral'

  // Store IDs in your system
  storeIds: string[]
}

/**
 * Create account from Shopify App Store installation
 */
export async function createAccountFromShopify(data: {
  shop: string
  accessToken: string
  email: string
  shopName: string
  shopifyChargeId?: string
}): Promise<Account> {

  // Check if account already exists (by email)
  const existingAccount = await findAccountByEmail(data.email)

  if (existingAccount) {
    // User already has account - just add Shopify integration
    return await addShopifyToExistingAccount(existingAccount.id, {
      shop: data.shop,
      accessToken: data.accessToken
    })
  }

  // Create new account
  const account: Account = {
    id: generateId(),
    email: data.email,
    name: data.shopName,
    createdAt: new Date().toISOString(),

    subscription: {
      plan: 'starter', // They paid via Shopify
      status: 'active',
      billingProvider: 'shopify',
      shopifyChargeId: data.shopifyChargeId,
      currentPeriodEnd: calculatePeriodEnd(30), // 30 days
      cancelAtPeriodEnd: false
    },

    integrations: {
      shopify: [data.shop],
      woocommerce: [],
      etsy: [],
      ebay: []
    },

    acquisitionChannel: 'shopify_app_store',
    storeIds: []
  }

  // Save to database
  await saveAccount(account)

  // Create store in your system
  const storeId = await createStore({
    accountId: account.id,
    name: data.shopName,
    platform: 'shopify',
    platformStoreId: data.shop
  })

  account.storeIds.push(storeId)
  await saveAccount(account)

  return account
}

/**
 * Create account from direct signup
 */
export async function createAccountFromDirectSignup(data: {
  email: string
  name: string
  password: string
  plan?: 'free' | 'starter' | 'professional'
}): Promise<Account> {

  const account: Account = {
    id: generateId(),
    email: data.email,
    name: data.name,
    createdAt: new Date().toISOString(),

    subscription: {
      plan: data.plan || 'free',
      status: data.plan && data.plan !== 'free' ? 'trial' : 'active',
      billingProvider: data.plan && data.plan !== 'free' ? 'stripe' : 'none',
      currentPeriodEnd: calculatePeriodEnd(14), // 14-day trial
      cancelAtPeriodEnd: false
    },

    integrations: {
      shopify: [],
      woocommerce: [],
      etsy: [],
      ebay: []
    },

    acquisitionChannel: 'direct_signup',
    storeIds: []
  }

  await saveAccount(account)
  return account
}

/**
 * Add Shopify integration to existing account
 */
export async function addShopifyToExistingAccount(
  accountId: string,
  data: {
    shop: string
    accessToken: string
  }
): Promise<Account> {

  const account = await getAccount(accountId)

  if (!account) {
    throw new Error('Account not found')
  }

  // Check if shop already connected
  if (account.integrations.shopify.includes(data.shop)) {
    console.log(`Shop ${data.shop} already connected to account ${accountId}`)
    return account
  }

  // Add shop to integrations
  account.integrations.shopify.push(data.shop)

  // Create store in your system
  const storeId = await createStore({
    accountId: account.id,
    name: data.shop,
    platform: 'shopify',
    platformStoreId: data.shop
  })

  account.storeIds.push(storeId)

  // Save Shopify integration config
  await saveIntegration({
    accountId: account.id,
    storeId: storeId,
    type: 'shopify',
    config: {
      shop: data.shop,
      accessToken: data.accessToken
    }
  })

  await saveAccount(account)
  return account
}

/**
 * Add WooCommerce integration to existing account
 */
export async function addWooCommerceToAccount(
  accountId: string,
  data: {
    storeUrl: string
    consumerKey: string
    consumerSecret: string
  }
): Promise<Account> {

  const account = await getAccount(accountId)

  if (!account) {
    throw new Error('Account not found')
  }

  // Add to integrations
  account.integrations.woocommerce.push(data.storeUrl)

  // Create store
  const storeId = await createStore({
    accountId: account.id,
    name: data.storeUrl,
    platform: 'woocommerce',
    platformStoreId: data.storeUrl
  })

  account.storeIds.push(storeId)

  // Save integration
  await saveIntegration({
    accountId: account.id,
    storeId: storeId,
    type: 'woocommerce',
    config: {
      storeUrl: data.storeUrl,
      consumerKey: data.consumerKey,
      consumerSecret: data.consumerSecret
    }
  })

  await saveAccount(account)
  return account
}

/**
 * Check if user can add more integrations based on plan
 */
export function canAddIntegration(account: Account): {
  allowed: boolean
  reason?: string
} {
  const totalIntegrations =
    account.integrations.shopify.length +
    account.integrations.woocommerce.length +
    account.integrations.etsy.length +
    account.integrations.ebay.length

  // Free plan: 1 integration only
  if (account.subscription.plan === 'free' && totalIntegrations >= 1) {
    return {
      allowed: false,
      reason: 'Upgrade to Starter plan to add more integrations'
    }
  }

  // Paid plans: unlimited integrations
  return { allowed: true }
}

/**
 * Handle Shopify OAuth callback with account linking
 */
export async function handleShopifyOAuthCallback(data: {
  shop: string
  accessToken: string
  email?: string
  currentUserId?: string // If user is already logged in
}): Promise<{
  account: Account
  isNewAccount: boolean
  redirectUrl: string
}> {

  // Case 1: User is already logged in (adding Shopify to existing account)
  if (data.currentUserId) {
    const account = await addShopifyToExistingAccount(data.currentUserId, {
      shop: data.shop,
      accessToken: data.accessToken
    })

    return {
      account,
      isNewAccount: false,
      redirectUrl: '/dashboard/integrations?success=shopify_connected'
    }
  }

  // Case 2: Check if account exists by email
  if (data.email) {
    const existingAccount = await findAccountByEmail(data.email)

    if (existingAccount) {
      // Account exists - add Shopify integration
      const account = await addShopifyToExistingAccount(existingAccount.id, {
        shop: data.shop,
        accessToken: data.accessToken
      })

      return {
        account,
        isNewAccount: false,
        redirectUrl: '/dashboard/integrations?success=shopify_connected'
      }
    }
  }

  // Case 3: Check if this shop is already connected
  const existingByShop = await findAccountByShopifyShop(data.shop)

  if (existingByShop) {
    // Update access token
    await updateShopifyIntegration(existingByShop.id, data.shop, {
      accessToken: data.accessToken
    })

    return {
      account: existingByShop,
      isNewAccount: false,
      redirectUrl: '/dashboard/integrations?success=shopify_reconnected'
    }
  }

  // Case 4: New account from Shopify App Store
  const shopInfo = await fetchShopInfo(data.shop, data.accessToken)

  const account = await createAccountFromShopify({
    shop: data.shop,
    accessToken: data.accessToken,
    email: shopInfo.email,
    shopName: shopInfo.name
  })

  return {
    account,
    isNewAccount: true,
    redirectUrl: '/onboarding?source=shopify'
  }
}

// Helper functions (implement these based on your database)
async function findAccountByEmail(email: string): Promise<Account | null> {
  // Query your database
  return null // Implement
}

async function findAccountByShopifyShop(shop: string): Promise<Account | null> {
  // Query your database
  return null // Implement
}

async function getAccount(accountId: string): Promise<Account | null> {
  // Query your database
  return null // Implement
}

async function saveAccount(account: Account): Promise<void> {
  // Save to database
}

async function createStore(data: any): Promise<string> {
  // Create store in your system
  return 'store-id' // Implement
}

async function saveIntegration(data: any): Promise<void> {
  // Save integration config
}

async function updateShopifyIntegration(
  accountId: string,
  shop: string,
  updates: any
): Promise<void> {
  // Update integration
}

async function fetchShopInfo(shop: string, accessToken: string): Promise<any> {
  // Fetch shop info from Shopify API
  return {
    email: 'shop@example.com',
    name: 'Shop Name'
  }
}

function generateId(): string {
  return `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function calculatePeriodEnd(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}
