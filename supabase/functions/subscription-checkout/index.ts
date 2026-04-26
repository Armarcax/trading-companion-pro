// subscription-checkout/index.ts — Stripe checkout session

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const SITE_URL = Deno.env.get('SITE_URL') ?? 'http://localhost:8080';
const STRIPE_PRICE_ID = Deno.env.get('STRIPE_PRO_PRICE_ID') ?? '';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    const { userId, email } = await req.json();

    // Create Stripe checkout session
    const params = new URLSearchParams({
      'payment_method_types[]': 'card',
      mode: 'subscription',
      'line_items[0][price]': STRIPE_PRICE_ID,
      'line_items[0][quantity]': '1',
      'customer_email': email,
      'success_url': `${SITE_URL}?payment=success&userId=${userId}`,
      'cancel_url': `${SITE_URL}?payment=cancelled`,
      'metadata[userId]': userId,
      'subscription_data[metadata][userId]': userId,
    });

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await res.json();

    if (!session.url) {
      throw new Error(session.error?.message ?? 'Stripe error');
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});