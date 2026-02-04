// RSI Filter Strategy - HAYQ Project

import type { BaseStrategy, MarketState, StrategySignal } from './types';

export const rsiFilterStrategy: BaseStrategy = {
  name: 'RSI',
  
  evaluate(state: MarketState): StrategySignal {
    const { rsi, direction } = state;
    
    // BUY logic
    if (direction === 'BUY') {
      // Pullback in uptrend (strongest signal)
      if (rsi >= 42 && rsi <= 50) {
        return { name: 'RSI', signal: 'BUY', score: 2 };
      }
      // Momentum continuation
      if (rsi > 50 && rsi <= 65) {
        return { name: 'RSI', signal: 'BUY', score: 1 };
      }
      // Overbought → trade blocked
      if (rsi > 70) {
        return { name: 'RSI', signal: null, score: -2 };
      }
    }
    
    // SELL logic
    if (direction === 'SELL') {
      // Pullback in downtrend
      if (rsi >= 50 && rsi <= 58) {
        return { name: 'RSI', signal: 'SELL', score: 2 };
      }
      // Momentum continuation
      if (rsi >= 35 && rsi < 50) {
        return { name: 'RSI', signal: 'SELL', score: 1 };
      }
      // Oversold → trade blocked
      if (rsi < 30) {
        return { name: 'RSI', signal: null, score: -2 };
      }
    }
    
    return { name: 'RSI', signal: null, score: 0 };
  }
};
