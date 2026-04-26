// Classic & Modern Trading Strategies - HAYQ Pro
// Covering 30 years: Turtle Trading (1983) → Ichimoku → VWAP → Order Flow (2020s)

import type { BaseStrategy, MarketState, StrategySignal, CandleData } from './types';
import { calculateEMA, calculateRSI, calculateATR, calculateMACD, calculateBollingerBands } from './technicalIndicators';

// ── Helper: Linear Regression Slope ──────────────────────────────────────
function lrSlope(prices: number[], period: number): number {
  const data = prices.slice(-period);
  const n = data.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = data.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  data.forEach((y, x) => { num += (x - xMean) * (y - yMean); den += (x - xMean) ** 2; });
  return den === 0 ? 0 : num / den;
}

// ── Helper: Highest/Lowest ────────────────────────────────────────────────
const highest = (arr: number[], n: number) => Math.max(...arr.slice(-n));
const lowest  = (arr: number[], n: number) => Math.min(...arr.slice(-n));

// ═══════════════════════════════════════════════════════════════════════════
// 1. TURTLE TRADING (Richard Dennis, 1983)
//    Donchian channel breakout — the original systematic trend following
// ═══════════════════════════════════════════════════════════════════════════
export const turtleTradingStrategy: BaseStrategy = {
  name: 'Turtle Trading',
  evaluate(state: MarketState): StrategySignal {
    const candles = state.candles1m;
    if (candles.length < 22) return { name: this.name, signal: null, score: 0 };
    const highs  = candles.map(c => c.high);
    const lows   = candles.map(c => c.low);
    const price  = state.price;
    const h20    = highest(highs, 20);
    const l20    = lowest(lows, 20);
    const h10    = highest(highs, 10);  // exit channel
    const l10    = lowest(lows, 10);
    if (price >= h20) return { name: this.name, signal: 'BUY',  score: 3.5, meta: { h20, l20 } };
    if (price <= l20) return { name: this.name, signal: 'SELL', score: 3.5, meta: { h20, l20 } };
    if (price <= l10) return { name: this.name, signal: 'SELL', score: 1.5 };
    if (price >= h10) return { name: this.name, signal: 'BUY',  score: 1.5 };
    return { name: this.name, signal: null, score: 0 };
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 2. ICHIMOKU KINKO HYO (1968, popularized 1990s)
//    Cloud + TK cross + Chikou confirmation
// ═══════════════════════════════════════════════════════════════════════════
export const ichimokuStrategy: BaseStrategy = {
  name: 'Ichimoku',
  evaluate(state: MarketState): StrategySignal {
    const candles = state.candles1m;
    if (candles.length < 52) return { name: this.name, signal: null, score: 0 };
    const highs  = candles.map(c => c.high);
    const lows   = candles.map(c => c.low);
    const closes = candles.map(c => c.close);
    const price  = state.price;
    const tenkan  = (highest(highs, 9)  + lowest(lows, 9))  / 2;
    const kijun   = (highest(highs, 26) + lowest(lows, 26)) / 2;
    const senkouA = (tenkan + kijun) / 2;
    const senkouB = (highest(highs, 52) + lowest(lows, 52)) / 2;
    const cloudTop    = Math.max(senkouA, senkouB);
    const cloudBottom = Math.min(senkouA, senkouB);
    const chikou  = closes[closes.length - 26] ?? closes[0];
    const tkBull  = tenkan > kijun;
    const tkBear  = tenkan < kijun;
    const aboveCloud = price > cloudTop;
    const belowCloud = price < cloudBottom;
    const chikouBull = price > chikou;
    let score = 0;
    let signal: 'BUY' | 'SELL' | null = null;
    if (tkBull)    { signal = 'BUY';  score += 1.5; }
    if (aboveCloud){ score += 1.5; }
    if (chikouBull){ score += 1; }
    if (tkBear)    { signal = 'SELL'; score += 1.5; }
    if (belowCloud){ score += 1.5; }
    if (!chikouBull && signal === 'SELL'){ score += 1; }
    if (!tkBull && !tkBear) signal = null;
    return { name: this.name, signal: signal ?? null, score, meta: { tenkan, kijun, cloudTop, cloudBottom } };
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 3. MEAN REVERSION / BOLLINGER SQUEEZE (John Bollinger, 1983)
//    Band squeeze → expansion → directional trade
// ═══════════════════════════════════════════════════════════════════════════
export const bollingerSqueezeStrategy: BaseStrategy = {
  name: 'Bollinger Squeeze',
  evaluate(state: MarketState): StrategySignal {
    const closes = state.candles1m.map(c => c.close);
    if (closes.length < 25) return { name: this.name, signal: null, score: 0 };
    const { upper, middle, lower } = calculateBollingerBands(closes, 20, 2);
    const { upper: u1, lower: l1 } = calculateBollingerBands(closes, 20, 1);
    const price   = state.price;
    const width   = (upper - lower) / middle;
    const prevW   = closes.slice(-15).reduce((acc, _, i, arr) => {
      if (i < 4) return acc;
      const sl = arr.slice(i - 4, i + 1);
      const m  = sl.reduce((a, b) => a + b, 0) / 5;
      const std = Math.sqrt(sl.reduce((a, b) => a + (b - m) ** 2, 0) / 5);
      return acc + (2 * 2 * std / m);
    }, 0) / 11;
    const isSqueeze = width < prevW * 0.85;
    if (!isSqueeze) return { name: this.name, signal: null, score: 0 };
    // Direction: price position relative to middle band
    if (price > middle && price > u1) return { name: this.name, signal: 'BUY',  score: 2.5, meta: { width, squeeze: true } };
    if (price < middle && price < l1) return { name: this.name, signal: 'SELL', score: 2.5, meta: { width, squeeze: true } };
    return { name: this.name, signal: null, score: 0 };
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 4. MOMENTUM / DUAL MOMENTUM (Gary Antonacci, 2012)
//    Absolute + relative momentum with 12-month lookback adapted to intraday
// ═══════════════════════════════════════════════════════════════════════════
export const dualMomentumStrategy: BaseStrategy = {
  name: 'Dual Momentum',
  evaluate(state: MarketState): StrategySignal {
    const closes = state.candles1m.map(c => c.close);
    if (closes.length < 50) return { name: this.name, signal: null, score: 0 };
    const price   = state.price;
    const ref30   = closes[closes.length - 30];
    const ref50   = closes[closes.length - 50];
    const mom30   = (price - ref30) / ref30;   // 30-bar momentum
    const mom50   = (price - ref50) / ref50;   // 50-bar momentum
    const slope   = lrSlope(closes, 20);       // linear regression trend
    const absMom  = mom30 > 0 && mom50 > 0;    // absolute momentum positive
    const negMom  = mom30 < 0 && mom50 < 0;
    if (absMom && slope > 0) return { name: this.name, signal: 'BUY',  score: 3, meta: { mom30, mom50 } };
    if (negMom && slope < 0) return { name: this.name, signal: 'SELL', score: 3, meta: { mom30, mom50 } };
    return { name: this.name, signal: null, score: 0 };
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 5. VWAP DEVIATION STRATEGY (widely adopted post-2000)
//    Price deviation from VWAP with mean-reversion logic
// ═══════════════════════════════════════════════════════════════════════════
export const vwapStrategy: BaseStrategy = {
  name: 'VWAP Strategy',
  evaluate(state: MarketState): StrategySignal {
    const candles = state.candles1m;
    if (candles.length < 20) return { name: this.name, signal: null, score: 0 };
    // Intraday VWAP: cumulative(price*vol) / cumulative(vol)
    const recent = candles.slice(-60); // last 60 bars
    let cumPV = 0, cumVol = 0;
    for (const c of recent) {
      const typicalPrice = (c.high + c.low + c.close) / 3;
      cumPV  += typicalPrice * c.volume;
      cumVol += c.volume;
    }
    const vwap = cumVol > 0 ? cumPV / cumVol : state.price;
    const dev  = (state.price - vwap) / vwap;
    const atr  = calculateATR(candles.map(c => c.high), candles.map(c => c.low), candles.map(c => c.close), 14);
    const devThreshold = atr / state.price * 1.5;
    // Trend-following when price is decisively above/below VWAP
    if (dev > devThreshold  * 0.5) return { name: this.name, signal: 'BUY',  score: 2, meta: { vwap, dev } };
    if (dev < -devThreshold * 0.5) return { name: this.name, signal: 'SELL', score: 2, meta: { vwap, dev } };
    return { name: this.name, signal: null, score: 0 };
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 6. MACD HISTOGRAM DIVERGENCE (Gerald Appel 1979, divergence 1990s)
//    Classic MACD cross + histogram divergence confirmation
// ═══════════════════════════════════════════════════════════════════════════
export const macdDivergenceStrategy: BaseStrategy = {
  name: 'MACD Divergence',
  evaluate(state: MarketState): StrategySignal {
    const closes = state.candles1m.map(c => c.close);
    if (closes.length < 35) return { name: this.name, signal: null, score: 0 };
    const { macdLine, signalLine, histogram } = calculateMACD(closes, 12, 26, 9);
    // Get previous histogram (5 bars ago)
    const prev = calculateMACD(closes.slice(0, -5), 12, 26, 9);
    const histDir = histogram > 0;
    const cross   = macdLine > signalLine;
    const increasing = histogram > prev.histogram;
    const decreasing = histogram < prev.histogram;
    if (cross && histDir && increasing)  return { name: this.name, signal: 'BUY',  score: 2.5, meta: { macdLine, signalLine, histogram } };
    if (!cross && !histDir && decreasing) return { name: this.name, signal: 'SELL', score: 2.5, meta: { macdLine, signalLine, histogram } };
    return { name: this.name, signal: null, score: 0 };
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 7. STOCHASTIC RSI OVERSOLD/OVERBOUGHT (Chande & Kroll, 1994)
//    Combines RSI sensitivity with Stochastic range
// ═══════════════════════════════════════════════════════════════════════════
export const stochRsiStrategy: BaseStrategy = {
  name: 'Stochastic RSI',
  evaluate(state: MarketState): StrategySignal {
    const closes = state.candles1m.map(c => c.close);
    if (closes.length < 30) return { name: this.name, signal: null, score: 0 };
    // Calculate RSI series for last 14 bars
    const rsiValues: number[] = [];
    for (let i = 14; i <= closes.length; i++) {
      rsiValues.push(calculateRSI(closes.slice(0, i), 14));
    }
    if (rsiValues.length < 14) return { name: this.name, signal: null, score: 0 };
    const rsiHigh = highest(rsiValues, 14);
    const rsiLow  = lowest(rsiValues, 14);
    const stochRsi = rsiHigh === rsiLow ? 0.5 : (rsiValues[rsiValues.length - 1] - rsiLow) / (rsiHigh - rsiLow);
    // 3-bar smoothed %K
    const k = rsiValues.slice(-3).reduce((a, b) => a + b, 0) / 3;
    if (stochRsi < 0.2 && state.rsi < 35) return { name: this.name, signal: 'BUY',  score: 3, meta: { stochRsi } };
    if (stochRsi > 0.8 && state.rsi > 65) return { name: this.name, signal: 'SELL', score: 3, meta: { stochRsi } };
    return { name: this.name, signal: null, score: 0 };
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 8. PRICE ACTION: INSIDE BAR / OUTSIDE BAR (NR4/NR7, Tony Crabel 1990)
//    Volatility contraction then expansion
// ═══════════════════════════════════════════════════════════════════════════
export const priceActionStrategy: BaseStrategy = {
  name: 'Price Action NR7',
  evaluate(state: MarketState): StrategySignal {
    const candles = state.candles1m;
    if (candles.length < 10) return { name: this.name, signal: null, score: 0 };
    const recent7 = candles.slice(-7);
    const ranges  = recent7.map(c => c.high - c.low);
    const currRange = ranges[ranges.length - 1];
    const isNR7 = currRange === Math.min(...ranges);
    if (!isNR7) return { name: this.name, signal: null, score: 0 };
    // Direction: breakout above/below NR7 bar
    const nr7High = recent7[recent7.length - 1].high;
    const nr7Low  = recent7[recent7.length - 1].low;
    const prev    = candles[candles.length - 2];
    if (state.price > nr7High && prev.close > prev.open)
      return { name: this.name, signal: 'BUY',  score: 2, meta: { nr7High, nr7Low } };
    if (state.price < nr7Low && prev.close < prev.open)
      return { name: this.name, signal: 'SELL', score: 2, meta: { nr7High, nr7Low } };
    return { name: this.name, signal: null, score: 0 };
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 9. SUPERTREND (Oliver Seban, 2009)
//    ATR-based dynamic support/resistance with trend direction
// ═══════════════════════════════════════════════════════════════════════════
export const supertrendStrategy: BaseStrategy = {
  name: 'Supertrend',
  evaluate(state: MarketState): StrategySignal {
    const candles = state.candles1m;
    if (candles.length < 16) return { name: this.name, signal: null, score: 0 };
    const closes = candles.map(c => c.close);
    const highs  = candles.map(c => c.high);
    const lows   = candles.map(c => c.low);
    const atr    = calculateATR(highs, lows, closes, 14);
    const hl2    = (highs[highs.length - 1] + lows[lows.length - 1]) / 2;
    const multiplier = 3;
    const upperBand = hl2 + multiplier * atr;
    const lowerBand = hl2 - multiplier * atr;
    const price = state.price;
    const prevClose = closes[closes.length - 2];
    // Trend: price above lowerBand = bullish, below upperBand = bearish
    const bullish = price > lowerBand && prevClose > lowerBand;
    const bearish = price < upperBand && prevClose < upperBand;
    const score = atr > 0 ? Math.min(3, (atr / price) * 1000) : 0;
    if (bullish && !bearish) return { name: this.name, signal: 'BUY',  score: score + 1, meta: { upperBand, lowerBand, atr } };
    if (bearish && !bullish) return { name: this.name, signal: 'SELL', score: score + 1, meta: { upperBand, lowerBand, atr } };
    return { name: this.name, signal: null, score: 0 };
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 10. HEIKIN ASHI TREND (Japanese candlestick variant, popularized 2000s)
//     Smoothed candles eliminate noise — consecutive same-color = strong trend
// ═══════════════════════════════════════════════════════════════════════════
export const heikinAshiStrategy: BaseStrategy = {
  name: 'Heikin Ashi',
  evaluate(state: MarketState): StrategySignal {
    const candles = state.candles1m;
    if (candles.length < 5) return { name: this.name, signal: null, score: 0 };
    // Convert last 5 candles to Heikin Ashi
    const ha: { open: number; close: number; high: number; low: number }[] = [];
    for (let i = 0; i < candles.length && i < 5; i++) {
      const c = candles[candles.length - 5 + i];
      const haClose = (c.open + c.high + c.low + c.close) / 4;
      const haOpen  = i === 0 ? (c.open + c.close) / 2 : (ha[i - 1].open + ha[i - 1].close) / 2;
      const haHigh  = Math.max(c.high, haOpen, haClose);
      const haLow   = Math.min(c.low, haOpen, haClose);
      ha.push({ open: haOpen, close: haClose, high: haHigh, low: haLow });
    }
    // Count consecutive bullish/bearish HA candles
    let bullStreak = 0, bearStreak = 0;
    for (let i = ha.length - 1; i >= 0; i--) {
      if (ha[i].close > ha[i].open) { if (bearStreak > 0) break; bullStreak++; }
      else { if (bullStreak > 0) break; bearStreak++; }
    }
    if (bullStreak >= 3) return { name: this.name, signal: 'BUY',  score: Math.min(bullStreak, 4), meta: { bullStreak } };
    if (bearStreak >= 3) return { name: this.name, signal: 'SELL', score: Math.min(bearStreak, 4), meta: { bearStreak } };
    return { name: this.name, signal: null, score: 0 };
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 11. OPENING RANGE BREAKOUT (Toby Crabel, 1990)
//     First N-bar range defines session high/low — breakout = momentum trade
// ═══════════════════════════════════════════════════════════════════════════
export const orbStrategy: BaseStrategy = {
  name: 'ORB Strategy',
  evaluate(state: MarketState): StrategySignal {
    const candles = state.candles1m;
    if (candles.length < 10) return { name: this.name, signal: null, score: 0 };
    const openRange = candles.slice(0, 5); // first 5 bars = "opening range"
    const orHigh = Math.max(...openRange.map(c => c.high));
    const orLow  = Math.min(...openRange.map(c => c.low));
    const price  = state.price;
    const orRange = orHigh - orLow;
    if (orRange === 0) return { name: this.name, signal: null, score: 0 };
    if (price > orHigh * 1.0005) return { name: this.name, signal: 'BUY',  score: 2.5, meta: { orHigh, orLow } };
    if (price < orLow  * 0.9995) return { name: this.name, signal: 'SELL', score: 2.5, meta: { orHigh, orLow } };
    return { name: this.name, signal: null, score: 0 };
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 12. WILLIAMS %R + MOMENTUM CONFLUENCE (Larry Williams, 1973)
//     Overbought/oversold with momentum confirmation
// ═══════════════════════════════════════════════════════════════════════════
export const williamsRStrategy: BaseStrategy = {
  name: 'Williams %R',
  evaluate(state: MarketState): StrategySignal {
    const candles = state.candles1m;
    if (candles.length < 14) return { name: this.name, signal: null, score: 0 };
    const highs  = candles.map(c => c.high);
    const lows   = candles.map(c => c.low);
    const h14    = highest(highs, 14);
    const l14    = lowest(lows, 14);
    const wR     = h14 === l14 ? -50 : ((h14 - state.price) / (h14 - l14)) * -100;
    const closes = candles.map(c => c.close);
    const rsi    = calculateRSI(closes, 14);
    if (wR < -80 && rsi < 40) return { name: this.name, signal: 'BUY',  score: 2.5, meta: { wR, rsi } };
    if (wR > -20 && rsi > 60) return { name: this.name, signal: 'SELL', score: 2.5, meta: { wR, rsi } };
    return { name: this.name, signal: null, score: 0 };
  },
};

// ── Strategy configs for UI ───────────────────────────────────────────────
export const classicStrategyConfigs = [
  { id: 'turtle',     name: 'Turtle Trading',     enabled: true,  weight: 3.0, strategy: turtleTradingStrategy,    era: '1983', category: 'Breakout' },
  { id: 'ichimoku',   name: 'Ichimoku Cloud',      enabled: true,  weight: 3.0, strategy: ichimokuStrategy,         era: '1968', category: 'Trend' },
  { id: 'bbsqueeze',  name: 'Bollinger Squeeze',   enabled: true,  weight: 2.5, strategy: bollingerSqueezeStrategy, era: '1983', category: 'Volatility' },
  { id: 'dualmomentum', name: 'Dual Momentum',     enabled: true,  weight: 2.5, strategy: dualMomentumStrategy,    era: '2012', category: 'Momentum' },
  { id: 'vwap',       name: 'VWAP Strategy',       enabled: true,  weight: 2.5, strategy: vwapStrategy,             era: '2000', category: 'Volume' },
  { id: 'macdiv',     name: 'MACD Divergence',     enabled: true,  weight: 2.0, strategy: macdDivergenceStrategy,  era: '1979', category: 'Oscillator' },
  { id: 'stochrsi',   name: 'Stochastic RSI',      enabled: true,  weight: 2.0, strategy: stochRsiStrategy,        era: '1994', category: 'Oscillator' },
  { id: 'nr7',        name: 'Price Action NR7',    enabled: true,  weight: 2.0, strategy: priceActionStrategy,     era: '1990', category: 'Price Action' },
  { id: 'supertrend', name: 'Supertrend',          enabled: true,  weight: 2.5, strategy: supertrendStrategy,      era: '2009', category: 'Trend' },
  { id: 'heikinashi', name: 'Heikin Ashi',         enabled: true,  weight: 2.0, strategy: heikinAshiStrategy,      era: '2000', category: 'Candle' },
  { id: 'orb',        name: 'ORB Strategy',        enabled: false, weight: 1.5, strategy: orbStrategy,             era: '1990', category: 'Breakout' },
  { id: 'williamsr',  name: 'Williams %R',         enabled: true,  weight: 1.5, strategy: williamsRStrategy,       era: '1973', category: 'Oscillator' },
];
