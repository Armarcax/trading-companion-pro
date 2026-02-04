// Exchange API Edge Function - HAYQ Project
// Handles API calls to Binance, Bybit, Coinbase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExchangeRequest {
  exchange: 'binance' | 'bybit' | 'coinbase';
  action: 'get_balance' | 'get_ticker' | 'place_order' | 'get_orders' | 'cancel_order';
  params?: Record<string, unknown>;
}

// Exchange API base URLs
const EXCHANGE_URLS = {
  binance: 'https://api.binance.com',
  binance_testnet: 'https://testnet.binance.vision',
  bybit: 'https://api.bybit.com',
  bybit_testnet: 'https://api-testnet.bybit.com',
  coinbase: 'https://api.coinbase.com',
};

// Simple HMAC-SHA256 signature for Binance
async function signBinance(queryString: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(queryString);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Binance API Handler
async function handleBinance(action: string, params: Record<string, unknown> = {}, testnet: boolean = false) {
  const apiKey = Deno.env.get('BINANCE_API_KEY');
  const apiSecret = Deno.env.get('BINANCE_API_SECRET');
  
  if (!apiKey || !apiSecret) {
    throw new Error('Binance API credentials not configured');
  }
  
  const baseUrl = testnet ? EXCHANGE_URLS.binance_testnet : EXCHANGE_URLS.binance;
  const timestamp = Date.now();
  
  switch (action) {
    case 'get_balance': {
      const queryString = `timestamp=${timestamp}`;
      const signature = await signBinance(queryString, apiSecret);
      
      const response = await fetch(`${baseUrl}/api/v3/account?${queryString}&signature=${signature}`, {
        headers: { 'X-MBX-APIKEY': apiKey }
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Binance error: ${error}`);
      }
      
      return await response.json();
    }
    
    case 'get_ticker': {
      const symbol = params.symbol as string || 'BTCUSDT';
      const response = await fetch(`${baseUrl}/api/v3/ticker/price?symbol=${symbol}`);
      return await response.json();
    }
    
    case 'place_order': {
      const orderParams = new URLSearchParams({
        symbol: params.symbol as string,
        side: params.side as string,
        type: params.type as string || 'MARKET',
        quantity: String(params.quantity),
        timestamp: String(timestamp)
      });
      
      const queryString = orderParams.toString();
      const signature = await signBinance(queryString, apiSecret);
      
      const response = await fetch(`${baseUrl}/api/v3/order?${queryString}&signature=${signature}`, {
        method: 'POST',
        headers: { 'X-MBX-APIKEY': apiKey }
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Binance order error: ${error}`);
      }
      
      return await response.json();
    }
    
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

// Bybit API Handler
async function handleBybit(action: string, params: Record<string, unknown> = {}, testnet: boolean = false) {
  const apiKey = Deno.env.get('BYBIT_API_KEY');
  const apiSecret = Deno.env.get('BYBIT_API_SECRET');
  
  if (!apiKey || !apiSecret) {
    throw new Error('Bybit API credentials not configured');
  }
  
  const baseUrl = testnet ? EXCHANGE_URLS.bybit_testnet : EXCHANGE_URLS.bybit;
  const timestamp = Date.now();
  
  switch (action) {
    case 'get_balance': {
      const recvWindow = 5000;
      const queryString = `api_key=${apiKey}&recv_window=${recvWindow}&timestamp=${timestamp}`;
      const signature = await signBinance(queryString, apiSecret); // Same HMAC algo
      
      const response = await fetch(`${baseUrl}/v5/account/wallet-balance?accountType=UNIFIED&${queryString}&sign=${signature}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      return await response.json();
    }
    
    case 'get_ticker': {
      const symbol = params.symbol as string || 'BTCUSDT';
      const response = await fetch(`${baseUrl}/v5/market/tickers?category=spot&symbol=${symbol}`);
      return await response.json();
    }
    
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

// Coinbase API Handler
async function handleCoinbase(action: string, params: Record<string, unknown> = {}) {
  const apiKey = Deno.env.get('COINBASE_API_KEY');
  const apiSecret = Deno.env.get('COINBASE_API_SECRET');
  
  if (!apiKey || !apiSecret) {
    throw new Error('Coinbase API credentials not configured');
  }
  
  const baseUrl = EXCHANGE_URLS.coinbase;
  
  switch (action) {
    case 'get_ticker': {
      const symbol = params.symbol as string || 'BTC-USD';
      const response = await fetch(`${baseUrl}/v2/prices/${symbol}/spot`);
      return await response.json();
    }
    
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const { exchange, action, params } = await req.json() as ExchangeRequest;
    
    console.log(`Exchange API call: ${exchange} - ${action}`);
    
    let result;
    
    switch (exchange) {
      case 'binance':
        result = await handleBinance(action, params, params?.testnet as boolean);
        break;
      case 'bybit':
        result = await handleBybit(action, params, params?.testnet as boolean);
        break;
      case 'coinbase':
        result = await handleCoinbase(action, params);
        break;
      default:
        throw new Error(`Unknown exchange: ${exchange}`);
    }
    
    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Exchange API error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
