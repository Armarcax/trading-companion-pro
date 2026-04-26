import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

async function createHmacSha256(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.text();
    const parsedBody = JSON.parse(body);
    const { exchange, action, params, testnet } = parsedBody;
    
    console.log('=== BYBIT DEBUG SCAN START ===');
    console.log('Exchange API call:', exchange, '-', action, '- testnet:', testnet);

    if (!exchange || !action) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing exchange or action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;
    switch (exchange.toLowerCase()) {
      case 'bybit':
        if (action === 'debug_bybit') {
          result = await debugBybit(testnet, Deno.env.get('BYBIT_API_KEY'), Deno.env.get('BYBIT_API_SECRET'));
        } else {
          result = await handleBybit(action, params, testnet, Deno.env.get('BYBIT_API_KEY'), Deno.env.get('BYBIT_API_SECRET'));
        }
        break;
      case 'binance':
        result = await handleBinance(action, params, testnet, Deno.env.get('BINANCE_API_KEY'), Deno.env.get('BINANCE_API_SECRET'));
        break;
      default:
        throw new Error(`Unsupported exchange: ${exchange}`);
    }

    console.log('=== BYBIT DEBUG SCAN END ===');
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Exchange API error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ԴԻԱԳՆՈՍՏԻԿ ՖՈՒՆԿՑԻԱ - ստուգում է բոլոր endpoint-ները
async function debugBybit(testnet: boolean, apiKey?: string, apiSecret?: string) {
  console.log('=== DEBUG BYBIT START ===');
  
  const baseUrl = testnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
  const timestamp = Date.now().toString();
  const recvWindow = '5000';
  
  const results: any = {
    hasApiKey: !!apiKey,
    hasApiSecret: !!apiSecret,
    keyLength: apiKey?.length || 0,
    secretLength: apiSecret?.length || 0,
    baseUrl,
    tests: []
  };
  
  if (!apiKey || !apiSecret) {
    results.error = 'API credentials missing';
    return results;
  }
  
  // Test 1: Server Time - public endpoint, չի պահանջում auth
  try {
    console.log('Test 1: Server Time');
    const res = await fetch(`${baseUrl}/v5/market/time`);
    const data = await res.json();
    results.tests.push({
      name: 'server_time',
      status: res.status,
      retCode: data.retCode,
      retMsg: data.retMsg,
      success: data.retCode === 0
    });
  } catch (e) {
    results.tests.push({ name: 'server_time', error: e.message });
  }
  
  // Test 2: API Key Info - ստուգում է key-ը վալիդ է թե չէ
  try {
    console.log('Test 2: API Key Info');
    const queryString = '';
    const signString = timestamp + apiKey + recvWindow + queryString;
    const signature = await createHmacSha256(apiSecret, signString);
    
    const res = await fetch(`${baseUrl}/v5/user/query-api`, {
      headers: {
        'X-BAPI-API-KEY': apiKey,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': recvWindow,
        'X-BAPI-SIGN': signature,
      }
    });
    const data = await res.json();
    results.tests.push({
      name: 'api_key_info',
      status: res.status,
      retCode: data.retCode,
      retMsg: data.retMsg,
      permissions: data.result,
      success: data.retCode === 0
    });
  } catch (e) {
    results.tests.push({ name: 'api_key_info', error: e.message });
  }
  
  // Test 3: Wallet Balance UNIFIED
  try {
    console.log('Test 3: Wallet Balance UNIFIED');
    const queryString = 'accountType=UNIFIED';
    const signString = timestamp + apiKey + recvWindow + queryString;
    const signature = await createHmacSha256(apiSecret, signString);
    
    const res = await fetch(`${baseUrl}/v5/account/wallet-balance?${queryString}`, {
      headers: {
        'X-BAPI-API-KEY': apiKey,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': recvWindow,
        'X-BAPI-SIGN': signature,
      }
    });
    const data = await res.json();
    results.tests.push({
      name: 'wallet_unified',
      status: res.status,
      retCode: data.retCode,
      retMsg: data.retMsg,
      success: data.retCode === 0
    });
  } catch (e) {
    results.tests.push({ name: 'wallet_unified', error: e.message });
  }
  
  // Test 4: Wallet Balance CONTRACT
  try {
    console.log('Test 4: Wallet Balance CONTRACT');
    const queryString = 'accountType=CONTRACT';
    const signString = timestamp + apiKey + recvWindow + queryString;
    const signature = await createHmacSha256(apiSecret, signString);
    
    const res = await fetch(`${baseUrl}/v5/account/wallet-balance?${queryString}`, {
      headers: {
        'X-BAPI-API-KEY': apiKey,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': recvWindow,
        'X-BAPI-SIGN': signature,
      }
    });
    const data = await res.json();
    results.tests.push({
      name: 'wallet_contract',
      status: res.status,
      retCode: data.retCode,
      retMsg: data.retMsg,
      success: data.retCode === 0
    });
  } catch (e) {
    results.tests.push({ name: 'wallet_contract', error: e.message });
  }
  
  // Test 5: Wallet Balance SPOT
  try {
    console.log('Test 5: Wallet Balance SPOT');
    const queryString = 'accountType=SPOT';
    const signString = timestamp + apiKey + recvWindow + queryString;
    const signature = await createHmacSha256(apiSecret, signString);
    
    const res = await fetch(`${baseUrl}/v5/account/wallet-balance?${queryString}`, {
      headers: {
        'X-BAPI-API-KEY': apiKey,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': recvWindow,
        'X-BAPI-SIGN': signature,
      }
    });
    const data = await res.json();
    results.tests.push({
      name: 'wallet_spot',
      status: res.status,
      retCode: data.retCode,
      retMsg: data.retMsg,
      success: data.retCode === 0
    });
  } catch (e) {
    results.tests.push({ name: 'wallet_spot', error: e.message });
  }
  
  console.log('=== DEBUG BYBIT END ===');
  return results;
}

async function handleBinance(action: string, params: any, testnet: boolean, apiKey?: string, apiSecret?: string) {
  const baseUrl = testnet ? 'https://testnet.binance.vision' : 'https://api.binance.com';
  const timestamp = Date.now();
  
  if (action === 'get_balance') {
    if (!apiKey || !apiSecret) throw new Error('Binance API credentials not configured');
    const queryString = `timestamp=${timestamp}`;
    const signature = await createHmacSha256(apiSecret, queryString);
    const url = `${baseUrl}/api/v3/account?${queryString}&signature=${signature}`;
    const response = await fetch(url, { headers: { 'X-MBX-APIKEY': apiKey } });
    if (!response.ok) throw new Error(`Binance error: ${await response.text()}`);
    return await response.json();
  }
  throw new Error(`Unsupported Binance action: ${action}`);
}

async function handleBybit(action: string, params: any, testnet: boolean, apiKey?: string, apiSecret?: string) {
  const baseUrl = testnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
  
  if (action === 'get_balance') {
    if (!apiKey || !apiSecret) throw new Error('Bybit API credentials not configured');
    
    const timestamp = Date.now().toString();
    const recvWindow = '5000';
    const accountTypes = ['UNIFIED', 'CONTRACT', 'SPOT'];
    let lastError = null;
    
    for (const accountType of accountTypes) {
      try {
        const queryString = `accountType=${accountType}`;
        const signString = timestamp + apiKey + recvWindow + queryString;
        const signature = await createHmacSha256(apiSecret, signString);
        
        const url = `${baseUrl}/v5/account/wallet-balance?${queryString}`;
        const response = await fetch(url, {
          headers: {
            'X-BAPI-API-KEY': apiKey,
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'X-BAPI-SIGN': signature,
          }
        });
        
        const data = await response.json();
        if (data.retCode === 0) return data.result;
        lastError = data;
      } catch (err) {
        lastError = { retCode: -1, retMsg: err.message };
      }
    }
    throw new Error(`Bybit error: ${lastError?.retMsg || 'Unknown'} (code: ${lastError?.retCode})`);
  }
  throw new Error(`Unsupported Bybit action: ${action}`);
}