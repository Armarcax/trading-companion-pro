// Multi-Timeframe Trend Strategy - HAYQ Project

import type { BaseStrategy, MarketState, StrategySignal } from './types';
import { calculateEMA } from './technicalIndicators';

const EMA_FAST = 9;
const EMA_SLOW = 21;

function detectTrend(fast: number, slow: number, threshold: number = 0.001): number {
  if (fast > slow * (1 + threshold)) return 1;
  if (fast < slow * (1 - threshold)) return -1;
  return 0; // Neutral zone
}

export const trendTFStrategy: BaseStrategy = {
  name: 'TrendTF',
  
  evaluate(state: MarketState): StrategySignal {
    try {
      const prices5m = state.trend5mPrices;
      const prices15m = state.trend15mPrices;
      
      if (prices5m.length < EMA_SLOW || prices15m.length < EMA_SLOW) {
        return { name: 'TrendTF', signal: null, score: 0 };
      }
      
      // Calculate EMAs
      const fastEma5m = calculateEMA(prices5m, EMA_FAST);
      const slowEma5m = calculateEMA(prices5m, EMA_SLOW);
      const fastEma15m = calculateEMA(prices15m, EMA_FAST);
      const slowEma15m = calculateEMA(prices15m, EMA_SLOW);
      
      if (!fastEma5m || !slowEma5m || !fastEma15m || !slowEma15m) {
        return { name: 'TrendTF', signal: null, score: 0 };
      }
      
      const trend5m = detectTrend(fastEma5m, slowEma5m);
      const trend15m = detectTrend(fastEma15m, slowEma15m);
      
      // Strong alignment
      if (trend5m === 1 && trend15m === 1) {
        return { name: 'TrendTF', signal: 'BUY', score: 3 };
      }
      
      if (trend5m === -1 && trend15m === -1) {
        return { name: 'TrendTF', signal: 'SELL', score: 3 };
      }
      
      // Weak trend
      if (trend5m === 1 || trend15m === 1) {
        return { name: 'TrendTF', signal: 'BUY', score: 1 };
      }
      
      if (trend5m === -1 || trend15m === -1) {
        return { name: 'TrendTF', signal: 'SELL', score: 1 };
      }
      
      return { name: 'TrendTF', signal: null, score: 0 };
    } catch {
      return { name: 'TrendTF', signal: null, score: 0 };
    }
  }
};
