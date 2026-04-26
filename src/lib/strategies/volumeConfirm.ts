// Volume Confirmation Strategy - HAYQ Project

import type { BaseStrategy, MarketState, StrategySignal } from './types';

export const volumeConfirmStrategy: BaseStrategy = {
  name: 'Volume',
  
  evaluate(state: MarketState): StrategySignal {
    const candles = state.candles1m;
    
    if (candles.length < 20) {
      return { name: 'Volume', signal: null, score: 0 };
    }
    
    const volumes = candles.map(c => c.volume);
    const closes = candles.map(c => c.close);
    const opens = candles.map(c => c.open);
    
    const currentVolume = volumes[volumes.length - 1];
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    
    const priceChange = closes[closes.length - 1] - opens[opens.length - 1];
    
    // 🔹 Strong bullish volume
    if (currentVolume > avgVolume * 1.5 && priceChange > 0) {
      return { name: 'Volume', signal: 'BUY', score: 2 };
    }
    
    // 🔹 Strong bearish volume
    if (currentVolume > avgVolume * 1.5 && priceChange < 0) {
      return { name: 'Volume', signal: 'SELL', score: 2 };
    }
    
    // 🔹 Weak volume breakout (danger zone)
    if (currentVolume < avgVolume * 0.6) {
      return { name: 'Volume', signal: null, score: -1, meta: { warning: 'LOW_VOL' } };
    }
    
    return { name: 'Volume', signal: null, score: 0 };
  }
};
