// Strategy Framework Types - HAYQ Project

export interface StrategySignal {
  name: string;
  signal: 'BUY' | 'SELL' | null;
  score: number;
  meta?: Record<string, unknown>;
}

export interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: Date;
}

export interface MarketState {
  price: number;
  rsi: number;
  direction?: 'BUY' | 'SELL' | null;
  volume: number;
  avgVolume: number;
  support: number;
  resistance: number;
  candles1m: CandleData[];
  trend5mPrices: number[];
  trend15mPrices: number[];
}

export interface BaseStrategy {
  name: string;
  evaluate: (state: MarketState) => StrategySignal;
}

export interface RiskConfig {
  maxRiskPerTrade: number;      // % of capital per trade (e.g., 0.02 = 2%)
  maxExposure: number;          // Maximum total exposure %
  maxConsecutiveLosses: number; // Stop after N consecutive losses
  cooldownMinutes: number;      // Minutes between trades
  adaptiveSL: boolean;          // Use ATR-based stop loss
  adaptiveTP: boolean;          // Use ATR-based take profit
  slMultiplier: number;         // SL = ATR * multiplier
  tpMultiplier: number;         // TP = ATR * multiplier
}

export interface TradingMode {
  mode: 'signal' | 'trade';
  signalOnly: boolean;
  autoExecute: boolean;
}

export interface StrategyVote {
  strategy: string;
  signal: 'BUY' | 'SELL' | null;
  score: number;
  weight: number;
  weightedScore: number;
}

export interface AggregatedSignal {
  direction: 'BUY' | 'SELL' | null;
  confidence: number;
  totalScore: number;
  votes: StrategyVote[];
  timestamp: Date;
  approved: boolean;
  reason?: string;
}

export type SupportedLanguage = 'en' | 'hy' | 'ru';

export interface ExchangeConfig {
  id: string;
  name: string;
  apiKey?: string;
  apiSecret?: string;
  testnet: boolean;
  enabled: boolean;
}
