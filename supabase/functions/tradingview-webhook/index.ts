// TradingView Webhook Handler - HAYQ Pro
// Receives Pine Script alerts and broadcasts to connected clients

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TVAlert {
  action: 'buy' | 'sell' | 'close';
  ticker: string;
  price: number;
  time: string;
  exchange: string;
  strategy?: string;
  comment?: string;
  // HAYQ custom fields
  secret?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    const alert: TVAlert = await req.json();
    const expectedSecret = Deno.env.get('TRADINGVIEW_SECRET');

    // Validate webhook secret if configured
    if (expectedSecret && alert.secret !== expectedSecret) {
      return new Response(JSON.stringify({ error: 'Invalid secret' }), { status: 401, headers: cors });
    }

    // Store alert in Supabase for clients to poll
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error } = await supabase.from('tv_alerts').insert({
      action: alert.action,
      ticker: alert.ticker,
      price: alert.price,
      strategy: alert.strategy ?? 'TradingView',
      comment: alert.comment ?? '',
      received_at: new Date().toISOString(),
    });

    if (error) console.error('Supabase insert error:', error);

    return new Response(JSON.stringify({ success: true, received: alert.action, ticker: alert.ticker }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown' }), {
      status: 400, headers: cors,
    });
  }
});
