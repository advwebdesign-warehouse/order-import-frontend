//file path: lib/services/subscriptionService.ts

/**
 * Subscription Management Service
 * Handles billing through both Shopify and Stripe
 */

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  interval: 'monthly' | 'yearly'
  features: {
    orders: number | 'unlimited'
    integrations: number | 'unlimited'
    warehouses: number
    users: number
    support: 'email' | 'priority' | '24/7'
  }
}

export const PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'monthly',
    features: {
      orders: 50,
      integrations: 1,
      warehouses: 1,
      users: 1,
      support: 'email'
    }
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 29,
    interval: 'monthly',
    features: {
      orders: 500,
      integrations: 'unlimited',
      warehouses: 2,
      users: 2,
      support: 'email'
    }
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 79,
    interval: 'monthly',
    features: {
      orders: 2000,
      integrations: 'unlimited',
      warehouses: 5,
      users: 5,
      support: 'priority'
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    interval: 'monthly',
    features: {
      orders: 'unlimited',
      integrations: 'unlimited',
      warehouses: 'unlimited' as any,
      users: 'unlimited' as any,
      support: '24/7'
    }
  }
}

/**
 * Create Shopify recurring charge
 * Used when user installs from Shopify App Store
 */
export async function createShopifySubscription(
  shop: string,
  accessToken: string,
  plan: SubscriptionPlan
): Promise<{
  confirmationUrl: string
  chargeId: string
}> {

  const response = await fetch(`https://${shop}/admin/api/2024-01/recurring_application_charges.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      recurring_application_charge: {
        name: `${plan.name} Plan`,
        price: plan.price,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/shopify/billing/callback`,
        test: process.env.NODE_ENV === 'development', // Test mode in dev
        trial_days: 14
      }
    })
  })

  if (!response.ok) {
    throw new Error('Failed to create Shopify subscription')
  }

  const data = await response.json()
  const charge = data.recurring_application_charge

  return {
    confirmationUrl: charge.confirmation_url,
    chargeId: charge.id.toString()
  }
}

/**
 * Activate Shopify subscription after user confirms
 */
export async function activateShopifySubscription(
  shop: string,
  accessToken: string,
  chargeId: string
): Promise<boolean> {

  const response = await fetch(
    `https://${shop}/admin/api/2024-01/recurring_application_charges/${chargeId}/activate.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recurring_application_charge: {
          id: chargeId
        }
      })
    }
  )

  return response.ok
}

/**
 * Create Stripe subscription
 * Used for direct web app signups
 */
export async function createStripeSubscription(
  customerId: string,
  plan: SubscriptionPlan
): Promise<{
  subscriptionId: string
  clientSecret: string
}> {

  // This requires the Stripe SDK
  // npm install stripe

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

  // Create subscription
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [
      {
        price: getPriceIdForPlan(plan.id) // You need to create prices in Stripe Dashboard
      }
    ],
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription'
    },
    expand: ['latest_invoice.payment_intent'],
    trial_period_days: 14
  })

  return {
    subscriptionId: subscription.id,
    clientSecret: subscription.latest_invoice.payment_intent.client_secret
  }
}

/**
 * Cancel subscription (works for both Shopify and Stripe)
 */
export async function cancelSubscription(
  accountId: string,
  cancelImmediately: boolean = false
): Promise<void> {

  const account = await getAccount(accountId)

  if (!account) {
    throw new Error('Account not found')
  }

  if (account.subscription.billingProvider === 'shopify') {
    // Cancel Shopify subscription
    await cancelShopifySubscription(
      account.integrations.shopify[0], // Primary shop
      account.subscription.shopifyChargeId!
    )
  } else if (account.subscription.billingProvider === 'stripe') {
    // Cancel Stripe subscription
    await cancelStripeSubscription(
      account.subscription.stripeCustomerId!,
      cancelImmediately
    )
  }

  // Update account
  account.subscription.status = cancelImmediately ? 'cancelled' : 'active'
  account.subscription.cancelAtPeriodEnd = !cancelImmediately

  await saveAccount(account)
}

/**
 * Cancel Shopify subscription
 */
async function cancelShopifySubscription(
  shop: string,
  chargeId: string
): Promise<void> {

  // Get access token for this shop
  const integration = await getShopifyIntegration(shop)

  const response = await fetch(
    `https://${shop}/admin/api/2024-01/recurring_application_charges/${chargeId}.json`,
    {
      method: 'DELETE',
      headers: {
        'X-Shopify-Access-Token': integration.accessToken
      }
    }
  )

  if (!response.ok) {
    throw new Error('Failed to cancel Shopify subscription')
  }
}

/**
 * Cancel Stripe subscription
 */
async function cancelStripeSubscription(
  subscriptionId: string,
  immediately: boolean
): Promise<void> {

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

  if (immediately) {
    await stripe.subscriptions.cancel(subscriptionId)
  } else {
    // Cancel at period end
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    })
  }
}

/**
 * Upgrade/downgrade subscription
 */
export async function updateSubscription(
  accountId: string,
  newPlanId: string
): Promise<void> {

  const account = await getAccount(accountId)

  if (!account) {
    throw new Error('Account not found')
  }

  const newPlan = PLANS[newPlanId]

  if (!newPlan) {
    throw new Error('Invalid plan')
  }

  if (account.subscription.billingProvider === 'shopify') {
    // For Shopify, we need to create a new charge
    const shop = account.integrations.shopify[0]
    const integration = await getShopifyIntegration(shop)

    // Cancel old subscription
    if (account.subscription.shopifyChargeId) {
      await cancelShopifySubscription(shop, account.subscription.shopifyChargeId)
    }

    // Create new subscription
    const { confirmationUrl, chargeId } = await createShopifySubscription(
      shop,
      integration.accessToken,
      newPlan
    )

    // User needs to confirm - redirect them
    throw new Error(`REDIRECT_REQUIRED:${confirmationUrl}`)

  } else if (account.subscription.billingProvider === 'stripe') {
    // For Stripe, we can update immediately
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

    await stripe.subscriptions.update(account.subscription.stripeCustomerId, {
      items: [{
        price: getPriceIdForPlan(newPlanId)
      }],
      proration_behavior: 'create_prorations'
    })
  }

  // Update account
  account.subscription.plan = newPlanId as any
  await saveAccount(account)
}

/**
 * Check if account can perform action based on plan limits
 */
export function canPerformAction(
  account: any,
  action: 'add_order' | 'add_integration' | 'add_warehouse' | 'add_user'
): {
  allowed: boolean
  reason?: string
  currentUsage?: number
  limit?: number
} {

  const plan = PLANS[account.subscription.plan]

  if (!plan) {
    return { allowed: false, reason: 'Invalid plan' }
  }

  switch (action) {
    case 'add_order':
      if (plan.features.orders === 'unlimited') {
        return { allowed: true }
      }
      const currentOrders = account.stats?.ordersThisMonth || 0
      if (currentOrders >= plan.features.orders) {
        return {
          allowed: false,
          reason: `Monthly order limit reached (${plan.features.orders})`,
          currentUsage: currentOrders,
          limit: plan.features.orders
        }
      }
      return { allowed: true, currentUsage: currentOrders, limit: plan.features.orders }

    case 'add_integration':
      if (plan.features.integrations === 'unlimited') {
        return { allowed: true }
      }
      const currentIntegrations = getTotalIntegrations(account)
      if (currentIntegrations >= plan.features.integrations) {
        return {
          allowed: false,
          reason: `Integration limit reached (${plan.features.integrations})`,
          currentUsage: currentIntegrations,
          limit: plan.features.integrations
        }
      }
      return { allowed: true, currentUsage: currentIntegrations, limit: plan.features.integrations }

    case 'add_warehouse':
      const currentWarehouses = account.storeIds?.length || 0
      if (currentWarehouses >= plan.features.warehouses) {
        return {
          allowed: false,
          reason: `Warehouse limit reached (${plan.features.warehouses})`,
          currentUsage: currentWarehouses,
          limit: plan.features.warehouses
        }
      }
      return { allowed: true, currentUsage: currentWarehouses, limit: plan.features.warehouses }

    default:
      return { allowed: true }
  }
}

function getTotalIntegrations(account: any): number {
  return (
    (account.integrations?.shopify?.length || 0) +
    (account.integrations?.woocommerce?.length || 0) +
    (account.integrations?.etsy?.length || 0) +
    (account.integrations?.ebay?.length || 0)
  )
}

function getPriceIdForPlan(planId: string): string {
  // Map plan IDs to Stripe price IDs
  // You need to create these in Stripe Dashboard
  const priceIds: Record<string, string> = {
    starter: 'price_xxxxxxxxxxxxx',
    professional: 'price_xxxxxxxxxxxxx',
    enterprise: 'price_xxxxxxxxxxxxx'
  }

  return priceIds[planId] || ''
}

// Helper functions
async function getAccount(accountId: string): Promise<any> {
  // Implement
  return null
}

async function saveAccount(account: any): Promise<void> {
  // Implement
}

async function getShopifyIntegration(shop: string): Promise<any> {
  // Implement
  return { accessToken: '' }
}
