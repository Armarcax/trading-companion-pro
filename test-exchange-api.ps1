# Config
$SUPABASE_URL = "https://kbzbacsordkghhscvlsx.supabase.co"
$SUPABASE_ANON_KEY = "c7fd88750ffd7246a1703cfb9d2dcc05b727e2be94bd4dbab238155b8fa090b3"

$headers = @{
    "Authorization" = "Bearer $SUPABASE_ANON_KEY"
    "Content-Type" = "application/json"
}

Write-Host "=== HAYQ Exchange API Diagnostic Tool ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check OPTIONS
Write-Host "1. Checking if function is deployed..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$SUPABASE_URL/functions/v1/exchange-api" -Method OPTIONS -Headers @{Authorization="Bearer $SUPABASE_ANON_KEY"} -ErrorAction Stop
    Write-Host "HTTP Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "HTTP Status: $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Red
}
Write-Host ""

# 2. Test GET
Write-Host "2. Testing GET request - should return 405..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/exchange-api" -Method GET -Headers @{Authorization="Bearer $SUPABASE_ANON_KEY"} -ErrorAction Stop
    Write-Host $response -ForegroundColor Green
} catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "HTTP Status: 405" -ForegroundColor Red
    Write-Host ($err | ConvertTo-Json) -ForegroundColor Red
}
Write-Host ""

# 3. Test POST empty body
Write-Host "3. Testing POST with empty body..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/exchange-api" -Method POST -Headers $headers -Body '' -ErrorAction Stop
} catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "HTTP Status: 400" -ForegroundColor Red
    Write-Host ($err | ConvertTo-Json) -ForegroundColor Red
}
Write-Host ""

# 4. Test POST invalid JSON
Write-Host "4. Testing POST with invalid JSON..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/exchange-api" -Method POST -Headers $headers -Body '{invalid}' -ErrorAction Stop
} catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "HTTP Status: 400" -ForegroundColor Red
    Write-Host ($err | ConvertTo-Json) -ForegroundColor Red
}
Write-Host ""

# 5. Test Binance get_ticker - public
Write-Host "5. Testing Binance get_ticker BTCUSDT - public, should work..." -ForegroundColor Yellow
try {
    $body = @{exchange="binance";action="get_ticker";params=@{symbol="BTCUSDT"};testnet=$false} | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/exchange-api" -Method POST -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "HTTP Status: 200" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor Green
} catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "HTTP Status: 400" -ForegroundColor Red
    Write-Host ($err | ConvertTo-Json) -ForegroundColor Red
}
Write-Host ""

# 6. Test Binance get_balance testnet
Write-Host "6. Testing Binance get_balance TESTNET - needs API keys..." -ForegroundColor Yellow
try {
    $body = @{exchange="binance";action="get_balance";testnet=$true} | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/exchange-api" -Method POST -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "HTTP Status: 200" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor Green
} catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "HTTP Status: 400" -ForegroundColor Red
    Write-Host ($err | ConvertTo-Json) -ForegroundColor Red
}
Write-Host ""

# 7. Test Binance get_balance mainnet
Write-Host "7. Testing Binance get_balance MAINNET - should fail if using testnet keys..." -ForegroundColor Yellow
try {
    $body = @{exchange="binance";action="get_balance";testnet=$false} | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/exchange-api" -Method POST -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "HTTP Status: 200" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor Green
} catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "HTTP Status: 400" -ForegroundColor Red
    Write-Host ($err | ConvertTo-Json) -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Diagnostic Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check results:"
Write-Host "- Test 5: Should be 200 with BTC price"
Write-Host "- Test 6: If 200 with balances -> testnet keys are correct"
Write-Host "- Test 6: If 400 with code:-2015 -> keys are from binance.com, not testnet"
Write-Host "- Test 7: Should be 400 with code:-2015 if using testnet keys"