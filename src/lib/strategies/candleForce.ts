// Candle Force Strategy - HAYQ Project

import type { BaseStrategy, MarketState, StrategySignal } from './types';

export const candleForceStrategy: BaseStrategy = {
  name: 'CandleForce',
  
  evaluate(state: MarketState): StrategySignal {
    const candles = state.candles1m;
    
    if (candles.length < 2) {
      return { name: 'CandleForce', signal: null, score: 0 };
    }
    
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    
    const body = Math.abs(last.close - last.open);
    const totalRange = last.high - last.low || 1;
    const bodyRatio = body / totalRange;
    
    const direction: 'BUY' | 'SELL' = last.close > last.open ? 'BUY' : 'SELL';
    
    let score = 0;
    
    // 1️⃣ Body strength
    if (bodyRatio > 0.6) score += 1;
    if (bodyRatio > 0.75) score += 1;
    
    // 2️⃣ Volume strength
    if (state.avgVolume > 0 && last.volume > state.avgVolume * 1.2) {
      score += 1;
    }
    
    // 3️⃣ Continuation logic (break previous high/low)
    if (direction === 'BUY' && last.close > prev.high) score += 1;
    if (direction === 'SELL' && last.close < prev.low) score += 1;
    
    // Minimum threshold
    if (score >= 2) {
      return { name: 'CandleForce', signal: direction, score };
    }
    
    return { name: 'CandleForce', signal: null, score: 0 };
  }
};
