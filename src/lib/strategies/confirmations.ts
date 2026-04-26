// Confirmations Strategy - HAYQ Project
// Smart confirmation layer: RSI + volume + price structure

import type { BaseStrategy, MarketState, StrategySignal } from './types';

export const confirmationsStrategy: BaseStrategy = {
  name: 'Confirmations',
  
  evaluate(state: MarketState): StrategySignal {
    const { price, rsi, direction, volume, avgVolume, candles1m: candles } = state;
    
    if (!candles.length || direction === null || direction === undefined) {
      return { name: 'Confirmations', signal: null, score: 0 };
    }
    
    let confirmations = 0;
    let penalty = 0;
    
    // 1️⃣ RSI alignment
    if (direction === 'BUY') {
      if (rsi >= 45 && rsi <= 65) confirmations += 1;
      if (rsi > 70) penalty += 1;
    } else if (direction === 'SELL') {
      if (rsi >= 35 && rsi <= 55) confirmations += 1;
      if (rsi < 30) penalty += 1;
    }
    
    // 2️⃣ Volume confirmation
    if (avgVolume > 0) {
      if (volume > avgVolume * 1.3) confirmations += 1;
      else if (volume < avgVolume * 0.8) penalty += 1;
    }
    
    // 3️⃣ Structure confirmation (higher close / lower close)
    const last = candles[candles.length - 1];
    const prev = candles.length > 1 ? candles[candles.length - 2] : last;
    
    if (direction === 'BUY' && last.close > prev.close) confirmations += 1;
    if (direction === 'SELL' && last.close < prev.close) confirmations += 1;
    
    // 4️⃣ Overextension filter (avoid chasing)
    const recentCandles = candles.slice(-20);
    const recentHigh = Math.max(...recentCandles.map(c => c.high));
    const recentLow = Math.min(...recentCandles.map(c => c.low));
    
    if (direction === 'BUY' && price >= recentHigh) penalty += 1;
    if (direction === 'SELL' && price <= recentLow) penalty += 1;
    
    const score = confirmations - penalty;
    
    if (score <= 0) {
      return { name: 'Confirmations', signal: null, score: 0 };
    }
    
    return { name: 'Confirmations', signal: direction, score: Math.min(score, 3) };
  }
};
