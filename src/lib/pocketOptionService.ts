// Pocket Option Service - HAYQ Pro
// Auth: sessionToken + uid from 42["auth",...] WebSocket frame

import { supabase } from '@/integrations/supabase/client';

export interface POCredentials {
  sessionToken: string;
  uid: string;
  lang?: string;
}

export interface POBalance {
  balance: number;
  currency: string;
  is_demo: boolean;
  uid: string;
  name: string;
}

export interface POCandle {
  time: number; open: number; high: number;
  low: number; close: number; volume: number;
}

export interface POOrder {
  order_id: string;
  status: 'open' | 'win' | 'loss' | 'pending';
  asset?: string; amount?: number;
  direction?: 'call' | 'put';
  duration?: number;
  open_time?: string; expire_time?: string;
  profit?: number;
}

export type POAsset =
  | 'EURUSD_otc' | 'GBPUSD_otc' | 'USDJPY_otc' | 'AUDUSD_otc'
  | 'EURJPY_otc' | 'GBPJPY_otc' | 'USDCAD_otc' | 'NZDUSD_otc'
  | '#AAPL_otc'  | '#TSLA_otc'  | '#AMZN_otc'  | '#GOOGL_otc'
  | 'BTCUSD_otc' | 'ETHUSD_otc' | 'XRPUSD_otc'
  | 'XAUUSD_otc' | 'XAGUSD_otc';

export type PODuration = 5 | 15 | 30 | 60 | 120 | 300 | 900;

function isSupabaseReady(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL ?? '';
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';
  return url.startsWith('https://') &&
    !url.includes('YOUR_') && !url.includes('your_') && key.length > 20;
}

async function edge<T>(action: string, creds: POCredentials, extra: Record<string, unknown> = {}): Promise<T> {
  if (!isSupabaseReady()) {
    throw new Error('Supabase կարգավորված չէ։ Ավելացրեք .env ֆայլում VITE_SUPABASE_URL և KEY, հետո deploy արեք pocket-option edge function-ը։');
  }
  const { data, error } = await supabase.functions.invoke('pocket-option', {
    body: { action, ...creds, ...extra },
  });
  if (error) throw new Error(error.message);
  const res = data as { success: boolean; data?: T; error?: string };
  if (!res.success) throw new Error(res.error ?? 'Pocket Option error');
  return res.data as T;
}

export const poGetBalance      = (c: POCredentials, isDemo = true) =>
  edge<POBalance>('get_balance', c, { is_demo: isDemo });

export const poGetCandles      = (c: POCredentials, asset: POAsset, timeframe = 60, count = 100, isDemo = true) =>
  edge<POCandle[]>('get_candles', c, { asset, timeframe, count, is_demo: isDemo });

export const poPlaceOrder      = (c: POCredentials, asset: POAsset, amount: number, direction: 'call' | 'put', duration: PODuration = 60, isDemo = true) =>
  edge<POOrder>('place_order', c, { asset, amount, direction, duration, is_demo: isDemo });

export const poGetActiveOrders = (c: POCredentials, isDemo = true) =>
  edge<POOrder[]>('get_active_orders', c, { is_demo: isDemo });

export const poCheckOrder      = (c: POCredentials, order_id: string, isDemo = true) =>
  edge<POOrder>('check_order', c, { order_id, is_demo: isDemo });
