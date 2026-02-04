// Volatility Strategy - HAYQ Project

import type { BaseStrategy, MarketState, StrategySignal } from './types';
import { calculateATR } from './technicalIndicators';

export const volatilityStrategy: BaseStrategy = {
  name: 'Volatility',
  
  evaluate(state: MarketState): StrategySignal {
    const candles = state.candles1m;
    
    if (candles.length < 30) {
      return { name: 'Volatility', signal: null, score: 0 };
    }
    
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const closes = candles.map(c => c.close);
    
    // Current ATR
    const atr = calculateATR(highs, lows, closes, 14);
    
    // Historical ATR average
    const atrValues: number[] = [];
    for (let i = 20; i < candles.length; i++) {
      const subHighs = highs.slice(0, i);
      const subLows = lows.slice(0, i);
      const subCloses = closes.slice(0, i);
      atrValues.push(calculateATR(subHighs, subLows, subCloses, 14));
    }
    
    if (!atrValues.length) {
      return { name: 'Volatility', signal: null, score: 0 };
    }
    
    const recentATRs = atrValues.slice(-20);
    const avgATR = recentATRs.reduce((a, b) => a + b, 0) / recentATRs.length;
    
    // Volatility regime detection
    if (atr < avgATR * 0.75) {
      // Low volatility → breakout setup possible
      return { name: 'Volatility', signal: null, score: 1, meta: { regime: 'LOW_VOL' } };
    }
    
    if (atr > avgATR * 1.8) {
      // Too volatile → risky market
      return { name: 'Volatility', signal: null, score: -1, meta: { regime: 'HIGH_VOL' } };
    }
    
    return { name: 'Volatility', signal: null, score: 0, meta: { regime: 'NORMAL' } };
  }
};
