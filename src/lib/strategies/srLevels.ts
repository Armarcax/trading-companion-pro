// Support/Resistance Strategy - HAYQ Project

import type { BaseStrategy, MarketState, StrategySignal } from './types';

export const srLevelsStrategy: BaseStrategy = {
  name: 'SR',
  
  evaluate(state: MarketState): StrategySignal {
    const { price, support, resistance, candles1m: candles, volume, avgVolume, direction } = state;
    
    if (!candles.length || candles.length < 2) {
      return { name: 'SR', signal: null, score: 0 };
    }
    
    const lastCandle = candles[candles.length - 1];
    const body = Math.abs(lastCandle.close - lastCandle.open);
    const fullRange = lastCandle.high - lastCandle.low;
    
    if (fullRange === 0) {
      return { name: 'SR', signal: null, score: 0 };
    }
    
    const rejectionRatio = body / fullRange;
    
    const nearSupport = Math.abs(price - support) / price < 0.0025;
    const nearResistance = Math.abs(price - resistance) / price < 0.0025;
    
    const volumeConfirm = volume > avgVolume * 1.1;
    
    // BUY setup → support bounce
    if (
      nearSupport &&
      direction === 'BUY' &&
      rejectionRatio < 0.6 && // Small body → rejection
      volumeConfirm
    ) {
      return { name: 'SR', signal: 'BUY', score: 2 };
    }
    
    // SELL setup → resistance rejection
    if (
      nearResistance &&
      direction === 'SELL' &&
      rejectionRatio < 0.6 &&
      volumeConfirm
    ) {
      return { name: 'SR', signal: 'SELL', score: 2 };
    }
    
    return { name: 'SR', signal: null, score: 0 };
  }
};
