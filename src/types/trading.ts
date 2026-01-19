// Trading Bot Types - HAYQ Project

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface Trade {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  profit: number;
  timestamp: Date;
  status: 'completed' | 'pending' | 'cancelled';
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  performance: number;
  risk: 'low' | 'medium' | 'high';
  tradesCount: number;
}

export interface Exchange {
  id: string;
  name: string;
  logo: string;
  connected: boolean;
  status: 'online' | 'offline' | 'connecting';
  balance?: number;
}

export interface BotStats {
  totalProfit: number;
  profitPercent: number;
  totalTrades: number;
  weeklyTrades: number;
  winRate: number;
  winRateChange: number;
  balance: number;
  balanceChange: number;
}

export interface BotConfig {
  symbol: string;
  stopLossPct: number;
  takeProfitPct: number;
  tradeQuantity: number;
  dryRun: boolean;
  emaShortPeriod: number;
  emaLongPeriod: number;
  rsiPeriod: number;
}

export type TabType = 'dashboard' | 'strategies' | 'exchanges' | 'trades' | 'settings' | 'reports';
