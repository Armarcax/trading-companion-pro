// subscription-webhook/index.ts — Stripe webhook handler

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const cors = { 'Access-Control-Allow-Origin': '*' };

async function verifyStripeSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = signature.split(',');
    const ts = parts.find(p => p.startsWith('t='))?.slice(2);
    const v1 = parts.find(p => p.startsWith('v1='))?.slice(3);
    if (!ts || !v1) return false;

    const payload = `${ts}.${body}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
    const computed = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    return computed === v1;
  } catch { return false; }
}

async function upsertSubscription(data: Record<string, any>) {
  await fetch(
    `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${data.user_id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(data),
    }
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  const valid = await verifyStripeSignature(body, sig, STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    return new Response('Invalid signature', { status: 400 });
  }

  const event = JSON.parse(body);
  const obj = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed': {
      const userId = obj.metadata?.userId;
      if (!userId) break;
      await upsertSubscription({
        user_id: userId,
        tier: 'pro',
        stripe_customer_id: obj.customer,
        stripe_subscription_id: obj.subscription,
        updated_at: new Date().toISOString(),
      });
      break;
    }

    case 'customer.subscription.updated': {
      const userId = obj.metadata?.userId;
      if (!userId) break;
      const active = obj.status === 'active';
      await upsertSubscription({
        user_id: userId,
        tier: active ? 'pro' : 'free',
        stripe_subscription_id: obj.id,
        current_period_end: new Date(obj.current_period_end * 1000).toISOString(),
        cancel_at_period_end: obj.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const userId = obj.metadata?.userId;
      if (!userId) break;
      await upsertSubscription({
        user_id: userId,
        tier: 'free',
        stripe_subscription_id: null,
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      });
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});