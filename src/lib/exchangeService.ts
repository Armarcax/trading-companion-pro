// Exchange Service - HAYQ Project
// Client-side service for exchange API calls

import { supabase } from '@/integrations/supabase/client';

export type ExchangeType = 'binance' | 'bybit' | 'coinbase';
export type ExchangeAction = 'get_balance' | 'get_ticker' | 'place_order' | 'get_orders' | 'cancel_order';

interface ExchangeResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface TickerData {
  symbol: string;
  price: string;
}

interface BalanceData {
  balances: Array<{
    asset: string;
    free: string;
    locked: string;
  }>;
}

export async function callExchangeApi<T = unknown>(
  exchange: ExchangeType,
  action: ExchangeAction,
  params?: Record<string, unknown>,
  testnet: boolean = true  // ← ավելացրի առանձին parameter
): Promise<ExchangeResponse<T>> {
  try {
    console.log('Calling exchange-api with:', { exchange, action, params, testnet });
    
    const { data, error } = await supabase.functions.invoke('exchange-api', {
      body: { 
        exchange, 
        action, 
        params: params || {}, 
        testnet  // ← հիմա առանձին field է գնում
      }
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as ExchangeResponse<T>;
  } catch (err) {
    console.error(`Exchange API error (${exchange}/${action}):`, err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

// Convenience functions
export async function getExchangeBalance(exchange: ExchangeType, testnet: boolean = true) {
  return callExchangeApi<BalanceData>(exchange, 'get_balance', {}, testnet); // ← testnet-ը 4-րդ param
}

export async function getExchangeTicker(exchange: ExchangeType, symbol: string) {
  return callExchangeApi<TickerData>(exchange, 'get_ticker', { symbol }, false); // ticker-ը public է
}

export async function placeExchangeOrder(
  exchange: ExchangeType,
  symbol: string,
  side: 'BUY' | 'SELL',
  quantity: number,
  testnet: boolean = true
) {
  return callExchangeApi(exchange, 'place_order', {
    symbol,
    side,
    quantity,
    type: 'MARKET'
  }, testnet); // ← testnet-ը 4-րդ param
}