#!/bin/bash

# Config
SUPABASE_URL=https://kbzbacsordkghhscvlsx.supabase.co
SUPABASE_ANON_KEY=c7fd88750ffd7246a1703cfb9d2dcc05b727e2be94bd4dbab238155b8fa090b3

echo "=== HAYQ Exchange API Diagnostic Tool ==="
echo ""

# 1. Check if function exists
echo "1. Checking if function is deployed..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" \
  -X OPTIONS \
  "${SUPABASE_URL}/functions/v1/exchange-api" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"

echo ""

# 2. Test GET - should return 405
echo "2. Testing GET request - should return 405 Method Not Allowed..."
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "${SUPABASE_URL}/functions/v1/exchange-api" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"

echo ""

# 3. Test POST with empty body - should return 400 with 'Request body is empty'
echo "3. Testing POST with empty body..."
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X POST \
  "${SUPABASE_URL}/functions/v1/exchange-api" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d ''

echo ""

# 4. Test POST with invalid JSON
echo "4. Testing POST with invalid JSON..."
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X POST \
  "${SUPABASE_URL}/functions/v1/exchange-api" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{invalid}'

echo ""

# 5. Test Binance get_ticker - public endpoint, no auth needed
echo "5. Testing Binance get_ticker BTCUSDT - public, should work..."
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X POST \
  "${SUPABASE_URL}/functions/v1/exchange-api" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"exchange":"binance","action":"get_ticker","params":{"symbol":"BTCUSDT"},"testnet":false}'

echo ""

# 6. Test Binance get_balance testnet - needs API keys
echo "6. Testing Binance get_balance TESTNET - needs API keys..."
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X POST \
  "${SUPABASE_URL}/functions/v1/exchange-api" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"exchange":"binance","action":"get_balance","testnet":true}'

echo ""

# 7. Test Binance get_balance mainnet - will fail with testnet keys
echo "7. Testing Binance get_balance MAINNET - should fail if using testnet keys..."
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X POST \
  "${SUPABASE_URL}/functions/v1/exchange-api" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"exchange":"binance","action":"get_balance","testnet":false}'

echo ""
echo "=== Diagnostic Complete ==="
echo ""
echo "Ինչ նայել:"
echo "- Test 2: Պետք է 405 լինի"
echo "- Test 3: Պետք է 400 'Request body is empty'"
echo "- Test 4: Պետք է 400 'Invalid JSON'"
echo "- Test 5: Պետք է 200 ու price վերադարձնի"
echo "- Test 6: Եթե 200 + balances → testnet key-երը ճիշտ են"
echo "- Test 6: Եթե 400 + code:-2015 → key-երը binance.com-ից են, ոչ թե testnet-ից"
echo "- Test 7: Պետք է 400 code:-2015 լինի եթե testnet key ես օգտագործում"