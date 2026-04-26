# HAYQ Trading Pro 🤖

Multi-exchange trading bot — Binance, Bybit, Pocket Option, TradingView, Telegram

## ⚡ Արագ տեղադրում

```bash
npm install
npm run dev
```

## 🔧 Կարգավորումներ (.env)

```env
VITE_SUPABASE_URL=https://YOUR_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY
```

## 🚀 Edge Functions deploy

```bash
supabase functions deploy exchange-api
supabase functions deploy pocket-option
supabase functions deploy telegram-webhook
supabase functions deploy tradingview-webhook
```

## 🔑 Supabase Secrets (Dashboard → Edge Functions → Secrets)

```
BINANCE_API_KEY
BINANCE_API_SECRET
BYBIT_API_KEY
BYBIT_API_SECRET
TRADINGVIEW_SECRET
```

## 📱 Pocket Option կապ

1. Բացեք pocketoption.com → մուտք գործեք
2. F12 → Network → WS → socket.io Messages
3. Փնտրեք `42["auth",{"sessionToken":"...","uid":"..."}]`
4. Պատճենեք sessionToken + uid → Options tab

## 📣 Telegram

1. @BotFather → /newbot → ստացեք Token
2. @userinfobot → ստացեք Chat ID
3. Telegram tab → մուտքագրեք → Test

## 📊 TradingView Webhook

Alert-ում URL ↓
```
https://YOUR_PROJECT.supabase.co/functions/v1/tradingview-webhook
```
Message (JSON):
```json
{"action":"buy","ticker":"BTCUSDT","price":"{{close}}","secret":"YOUR_SECRET"}
```

## 📈 Ռազմավարություններ (20 հատ)

Turtle Trading (1983) · Ichimoku · Bollinger Squeeze · Dual Momentum ·
VWAP · MACD Divergence · Stoch RSI · Price Action NR7 · Supertrend ·
Heikin Ashi · ORB · Williams %R + 8 original strategies
