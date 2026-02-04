// Market Structure Strategy - HAYQ Project

import type { BaseStrategy, MarketState, StrategySignal, CandleData } from './types';

function findSwings(candles: CandleData[], lookback: number = 10): { swingHighs: number[]; swingLows: number[] } {
  const swingHighs: number[] = [];
  const swingLows: number[] = [];
  
  for (let i = 2; i < candles.length - 2; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    
    if (high > candles[i - 1].high && high > candles[i + 1].high) {
      swingHighs.push(high);
    }
    
    if (low < candles[i - 1].low && low < candles[i + 1].low) {
      swingLows.push(low);
    }
  }
  
  return {
    swingHighs: swingHighs.slice(-lookback),
    swingLows: swingLows.slice(-lookback)
  };
}

export const marketStructureStrategy: BaseStrategy = {
  name: 'MarketStructure',
  
  evaluate(state: MarketState): StrategySignal {
    const candles = state.candles1m;
    const rsi = state.rsi;
    
    if (candles.length < 30) {
      return { name: 'MarketStructure', signal: null, score: 0 };
    }
    
    const { swingHighs, swingLows } = findSwings(candles);
    
    if (swingHighs.length < 2 || swingLows.length < 2) {
      return { name: 'MarketStructure', signal: null, score: 0 };
    }
    
    const lastHigh = swingHighs[swingHighs.length - 1];
    const prevHigh = swingHighs[swingHighs.length - 2];
    const lastLow = swingLows[swingLows.length - 1];
    const prevLow = swingLows[swingLows.length - 2];
    
    const lastCandle = candles[candles.length - 1];
    const prevCandle = candles[candles.length - 2];
    
    let score = 0;
    
    // -------- BULLISH STRUCTURE --------
    const bullishStructure = lastLow > prevLow;
    const bullishBreak = lastCandle.close > lastHigh && prevCandle.close <= lastHigh;
    
    if (bullishStructure && bullishBreak) {
      score += 2;
      
      // Momentum confirmation
      if (rsi > 50 && rsi < 70) score += 1;
      
      // Strong candle body
      const body = Math.abs(lastCandle.close - lastCandle.open);
      const range = lastCandle.high - lastCandle.low;
      if (range > 0 && body / range > 0.6) score += 1;
      
      return { name: 'MarketStructure', signal: 'BUY', score: Math.min(score, 4) };
    }
    
    // -------- BEARISH STRUCTURE --------
    const bearishStructure = lastHigh < prevHigh;
    const bearishBreak = lastCandle.close < lastLow && prevCandle.close >= lastLow;
    
    if (bearishStructure && bearishBreak) {
      score += 2;
      
      if (rsi > 30 && rsi < 50) score += 1;
      
      const body = Math.abs(lastCandle.close - lastCandle.open);
      const range = lastCandle.high - lastCandle.low;
      if (range > 0 && body / range > 0.6) score += 1;
      
      return { name: 'MarketStructure', signal: 'SELL', score: Math.min(score, 4) };
    }
    
    return { name: 'MarketStructure', signal: null, score: 0 };
  }
};
